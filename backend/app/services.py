from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from .models import Answer, Participant, Question, Quiz, QuizEvent

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

class DomainError(Exception):
    pass

async def transition_quiz(db: AsyncSession, quiz: Quiz, new_status: str) -> None:
    if new_status not in VALID_TRANSITIONS.get(quiz.status, set()):
        raise DomainError(f"Illegal quiz transition: {quiz.status} -> {new_status}")
    quiz.status = new_status
    now = datetime.now(timezone.utc)
    if new_status == "LIVE":
        quiz.started_at = now
    elif new_status == "ENDED":
        quiz.ended_at = now
    await db.flush()

async def submit_answer(db: AsyncSession, quiz: Quiz, req_participant: UUID, question_id, selected: str):
    participant = await db.get(Participant, req_participant)
    if not participant or participant.quiz_id != quiz.id:
        raise DomainError("Participant is not part of this quiz")
    if quiz.status != "LIVE":
        raise DomainError("Quiz is not live")
    if participant.status in {"FORFEITED", "DISQUALIFIED", "TIMED_OUT", "COMPLETED"}:
        raise DomainError("Participant cannot submit answers in current state")

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
        answered_at=datetime.now(timezone.utc),
    )
    db.add(answer)
    db.add(QuizEvent(
        quiz_id=quiz.id,
        participant_id=participant.id,
        event_type="ANSWER_SUBMITTED",
        event_timestamp=datetime.now(timezone.utc),
        metadata={"question_id": str(question.id), "selected_option": selected},
    ))
    await db.flush()
    return answer
