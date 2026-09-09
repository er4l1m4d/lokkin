import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Answer, Participant, Question, Quiz, QuizEvent, Transaction

VALID_TRANSITIONS = {
    "DRAFT": {"PUBLISHED", "CANCELLED"},
    "PUBLISHED": {"OPEN", "CANCELLED"},
    "OPEN": {"LIVE", "CANCELLED", "REFUNDING"},
    "LIVE": {"ENDED"},
    "ENDED": {"VALIDATING"},
    "VALIDATING": {"FINALIZED", "REFUNDING"},
    "FINALIZED": {"SETTLED"},
    "SETTLED": set(),
    "CANCELLED": {"REFUNDING"},
    "REFUNDING": {"REFUNDED"},
    "REFUNDED": set(),
}

# Server owns the clock. Small grace so a submission racing the timer isn't cut off.
ANSWER_GRACE_SECONDS = 10

# Dispute window between ENDED and FINALIZED (env-tunable for demos)
DISPUTE_WINDOW_SECONDS = int(os.getenv("DISPUTE_WINDOW_SECONDS", "300"))

PAYMENTS_MODE = os.getenv("PAYMENTS_MODE", "mock")

TOP_3_SPLIT = (Decimal("0.5"), Decimal("0.3"), Decimal("0.1"))


class DomainError(Exception):
    pass


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_aware(dt: datetime | None) -> datetime | None:
    """SQLite returns naive datetimes; normalize to aware UTC for comparisons."""
    if dt is None:
        return None
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


async def transition_quiz(db: AsyncSession, quiz: Quiz, new_status: str) -> None:
    if new_status not in VALID_TRANSITIONS.get(quiz.status, set()):
        raise DomainError(f"Illegal quiz transition: {quiz.status} -> {new_status}")
    quiz.status = new_status
    now = utcnow()
    if new_status == "LIVE":
        quiz.started_at = now
    elif new_status == "ENDED":
        quiz.ended_at = now
    elif new_status == "FINALIZED":
        quiz.finalized_at = now
    elif new_status == "SETTLED":
        quiz.settled_at = now
    await db.flush()


async def log_event(db: AsyncSession, quiz_id: UUID, event_type: str, participant_id: UUID | None = None, metadata: dict | None = None) -> None:
    db.add(QuizEvent(quiz_id=quiz_id, participant_id=participant_id, event_type=event_type, event_timestamp=utcnow(), metadata=metadata))


async def add_participant(db: AsyncSession, quiz: Quiz, user_id: UUID, tx_type: str = "ENTRY_COMMITMENT") -> Participant:
    """Idempotent join + mock-payments transaction record."""
    existing = await db.execute(
        select(Participant).where(Participant.quiz_id == quiz.id, Participant.user_id == user_id)
    )
    participant = existing.scalar_one_or_none()
    if participant is not None:
        return participant

    participant = Participant(
        quiz_id=quiz.id,
        user_id=user_id,
        status="JOINED",
        disconnect_count=0,
        correct_answers=0,
    )
    db.add(participant)
    await log_event(db, quiz.id, "QUIZ_JOINED", metadata={"user_id": str(user_id)})

    tx = Transaction(
        quiz_id=quiz.id,
        user_id=user_id,
        type=tx_type,
        currency=quiz.currency,
        amount=quiz.entry_amount,
        status="CONFIRMED" if PAYMENTS_MODE == "mock" else "PENDING",
        created_at=utcnow(),
        confirmed_at=utcnow() if PAYMENTS_MODE == "mock" else None,
    )
    db.add(tx)
    await db.flush()
    return participant


async def refund_all(db: AsyncSession, quiz: Quiz, participants: list[Participant]) -> None:
    """Mock-payments refund ledger rows (real on-chain refunds: Phase 7)."""
    for p in participants:
        db.add(Transaction(
            quiz_id=quiz.id,
            user_id=p.user_id,
            type="REFUND",
            currency=quiz.currency,
            amount=quiz.entry_amount,
            status="CONFIRMED" if PAYMENTS_MODE == "mock" else "PENDING",
            created_at=utcnow(),
            confirmed_at=utcnow() if PAYMENTS_MODE == "mock" else None,
        ))


def quiz_deadline(quiz: Quiz) -> datetime | None:
    started = as_aware(quiz.started_at)
    if started is None:
        return None
    return started + timedelta(seconds=quiz.duration_seconds)


async def maybe_advance(db: AsyncSession, quiz: Quiz) -> None:
    """Server-authoritative lifecycle. One transition per call so status
    steppers visibly walk VALIDATING -> FINALIZED -> SETTLED on polling."""
    now = utcnow()
    participants = (await db.execute(
        select(Participant).where(Participant.quiz_id == quiz.id)
    )).scalars().all()

    if quiz.status == "OPEN":
        starts_at = as_aware(quiz.starts_at)
        if starts_at is None:
            return
        if now < starts_at:
            return
        if len(participants) >= (quiz.min_participants or 3):
            await transition_quiz(db, quiz, "LIVE")
            for p in participants:
                if p.status == "JOINED":
                    p.status = "ACTIVE"
            await log_event(db, quiz.id, "QUIZ_LIVE")
        else:
            # Under quorum at window close: nullify + refund everyone
            await transition_quiz(db, quiz, "CANCELLED")
            await log_event(db, quiz.id, "QUIZ_CANCELLED_UNDERQUORUM", metadata={"participants": len(participants)})
        await db.commit()
        return

    if quiz.status == "CANCELLED":
        await transition_quiz(db, quiz, "REFUNDING")
        await db.commit()
        return

    if quiz.status == "REFUNDING":
        await refund_all(db, quiz, participants)
        await transition_quiz(db, quiz, "REFUNDED")
        await db.commit()
        return

    if quiz.status == "LIVE":
        deadline = quiz_deadline(quiz)
        all_done = True
        for p in participants:
            if p.status == "ACTIVE" and deadline and now > deadline + timedelta(seconds=ANSWER_GRACE_SECONDS):
                p.status = "TIMED_OUT"
            if p.status in ("JOINED", "ACTIVE"):
                all_done = False
        if all_done and participants:
            await transition_quiz(db, quiz, "ENDED")
            await log_event(db, quiz.id, "QUIZ_ENDED")
        await db.commit()
        return

    if quiz.status == "ENDED":
        await transition_quiz(db, quiz, "VALIDATING")
        await db.commit()
        return

    if quiz.status == "VALIDATING":
        ended_at = as_aware(quiz.ended_at)
        if ended_at and now >= ended_at + timedelta(seconds=DISPUTE_WINDOW_SECONDS):
            await finalize_results(db, quiz, participants)
            await transition_quiz(db, quiz, "FINALIZED")
            await log_event(db, quiz.id, "QUIZ_FINALIZED", metadata={"result_version": quiz.result_version})
        await db.commit()
        return

    if quiz.status == "FINALIZED":
        # Mock payments: payouts "sent" instantly. Real settlement: Phase 7 sidecar.
        await transition_quiz(db, quiz, "SETTLED")
        await log_event(db, quiz.id, "QUIZ_SETTLED")
        await db.commit()
        return


def compute_payouts(participants: list[Participant], question_count: int, entry_amount: Decimal) -> tuple[list[dict], Decimal]:
    """Locked economics:
    - Top 3 (competition-ranked): 100% back + pool share 50/30/10, ties split
    - Non-winning finishers: 80% back, 20% -> pool
    - No-shows: 50% back, 50% -> pool
    - 10% of pool + skipped rank allocations -> completion bonus among completers
    """
    stake = Decimal(str(entry_amount))
    finished = [p for p in participants if p.status in ("COMPLETED", "TIMED_OUT")]
    no_shows = [p for p in participants if p.status == "JOINED"]
    ranked = sorted(
        [p for p in finished if p.status == "COMPLETED"],
        key=lambda p: (-p.correct_answers, str(p.id)),
    )

    # competition ranking: 1, 1, 3
    ranks: list[int] = []
    for i, p in enumerate(ranked):
        ranks.append(ranks[i - 1] if i > 0 and p.correct_answers == ranked[i - 1].correct_answers else i + 1)

    def entry(p: Participant) -> Decimal:
        return stake

    rows: dict[UUID, dict] = {}
    for i, p in enumerate(ranked):
        rows[p.id] = {
            "participant_id": p.id,
            "correct_answers": p.correct_answers,
            "rank": ranks[i],
            "entry_amount": entry(p),
            "payout": Decimal("0"),
            "payout_kind": "none",
        }

    winner_ids = {p.id for i, p in enumerate(ranked) if ranks[i] <= 3}

    pool = Decimal("0")
    for p in finished:
        if p.id not in winner_ids:
            pool += entry(p) * Decimal("0.2")
            rows[p.id] = {
                "participant_id": p.id,
                "correct_answers": p.correct_answers,
                "rank": rows[p.id]["rank"] if p.id in rows else 99,
                "entry_amount": entry(p),
                "payout": entry(p) * Decimal("0.8"),
                "payout_kind": "consolation",
            }
    for p in no_shows:
        pool += entry(p) * Decimal("0.5")
        rows[p.id] = {
            "participant_id": p.id,
            "correct_answers": 0,
            "rank": 99,
            "entry_amount": entry(p),
            "payout": entry(p) * Decimal("0.5"),
            "payout_kind": "refund",
        }

    bonus = pool * Decimal("0.1")
    winners_take = Decimal("0")
    for rank in (1, 2, 3):
        holders = [p for i, p in enumerate(ranked) if ranks[i] == rank]
        allocation = pool * TOP_3_SPLIT[rank - 1]
        if not holders:
            bonus += allocation
            continue
        winners_take += allocation
        share = allocation / len(holders)
        for p in holders:
            rows[p.id]["payout"] = entry(p) + share
            rows[p.id]["payout_kind"] = "winner"

    completers = [p for p in finished if p.status == "COMPLETED"]
    if completers:
        per = bonus / len(completers)
        for p in completers:
            rows[p.id]["payout"] += per

    def score_pct(p_correct: int) -> Decimal:
        return Decimal(str(round(p_correct / question_count * 100, 2))) if question_count else Decimal("0")

    ordered = sorted(
        rows.values(),
        key=lambda r: (r["rank"], -float(score_pct(r["correct_answers"]))),
    )
    return ordered, winners_take


async def finalize_results(db: AsyncSession, quiz: Quiz, participants: list[Participant]) -> None:
    rows, _ = compute_payouts(participants, quiz.question_count, quiz.entry_amount)
    by_id = {p.id: p for p in participants}
    for row in rows:
        p = by_id.get(row["participant_id"])
        if p is None:
            continue
        if row["payout_kind"] != "refund":  # no-shows keep rank NULL
            p.rank = row["rank"]
        pct = row["correct_answers"] / quiz.question_count * 100 if quiz.question_count else 0
        p.score_percentage = Decimal(str(round(pct, 5)))
    quiz.result_version += 1
    await db.flush()


async def submit_answer(db: AsyncSession, quiz: Quiz, req_participant: UUID, question_id, selected: str):
    participant = await db.get(Participant, req_participant)
    if not participant or participant.quiz_id != quiz.id:
        raise DomainError("Participant is not part of this quiz")
    if quiz.status != "LIVE":
        raise DomainError("Quiz is not live")
    if participant.status in {"FORFEITED", "DISQUALIFIED", "TIMED_OUT", "COMPLETED"}:
        raise DomainError("Participant cannot submit answers in current state")

    # Server-authoritative deadline (grace absorbs polling latency)
    deadline = quiz_deadline(quiz)
    if deadline and utcnow() > deadline + timedelta(seconds=ANSWER_GRACE_SECONDS):
        participant.status = "TIMED_OUT"
        raise DomainError("Time is up")

    question = await db.get(Question, question_id)
    if not question or question.quiz_id != quiz.id or question.status != "ACTIVE":
        raise DomainError("Question is not answerable")

    existing = await db.execute(select(Answer).where(
        Answer.participant_id == participant.id,
        Answer.question_id == question.id,
    ))
    if existing.scalar_one_or_none() is not None:
        raise DomainError("Question has already been answered")

    answer = Answer(
        participant_id=participant.id,
        question_id=question.id,
        selected_option=selected,
        is_correct=(selected == question.correct_option),
        answered_at=utcnow(),
    )
    db.add(answer)
    if answer.is_correct:
        participant.correct_answers += 1
    await log_event(
        db, quiz.id, "ANSWER_SUBMITTED", participant.id,
        {"question_id": str(question.id), "selected_option": selected},
    )

    # all questions answered -> COMPLETED
    count = len((await db.execute(
        select(Answer.id).where(Answer.participant_id == participant.id)
    )).scalars().all())
    if count >= quiz.question_count:
        participant.status = "COMPLETED"
        pct = participant.correct_answers / quiz.question_count * 100 if quiz.question_count else 0
        participant.score_percentage = Decimal(str(round(pct, 5)))
    await db.flush()
    return answer
