"""Critical-flow tests (DEPLOY.md): session -> create -> join -> play -> results correct."""
from datetime import datetime, timedelta, timezone

import pytest

pytestmark = pytest.mark.asyncio


# ---------- helpers ----------


async def mk_user(client, name):
    r = await client.post("/api/users", json={"displayName": name})
    assert r.status_code == 201, r.text
    return r.json()


async def mk_quiz(client, creator_id, *, starts_in_s=None, min_participants=3, entry=100, duration=300):
    body = {
        "creatorId": creator_id,
        "title": "Pharma Basics",
        "currency": "NIM",
        "entryAmount": entry,
        "durationSeconds": duration,
        "minParticipants": min_participants,
    }
    if starts_in_s is not None:
        body["startsAt"] = (datetime.now(timezone.utc) + timedelta(seconds=starts_in_s)).isoformat()
    r = await client.post("/api/quizzes", json=body)
    assert r.status_code == 201, r.text
    return r.json()["quizId"]


async def add_question(client, quiz_id, position, correct="C", explanation="Because science."):
    r = await client.post(f"/api/quizzes/{quiz_id}/questions", json={
        "position": position,
        "questionText": f"Question {position}: what fills the blank ______?",
        "optionA": "Alpha",
        "optionB": "Beta",
        "optionC": "Gamma",
        "optionD": "Delta",
        "correctOption": correct,
        "explanation": explanation,
    })
    assert r.status_code == 201, r.text
    return r.json()["questionId"]


async def publish_and_open(client, quiz_id):
    r = await client.post(f"/api/quizzes/{quiz_id}/publish")
    assert r.status_code == 200, r.text
    r = await client.post(f"/api/quizzes/{quiz_id}/open")
    assert r.status_code == 200, r.text


async def join(client, quiz_id, user_id):
    r = await client.post(f"/api/quizzes/{quiz_id}/join", json={"userId": user_id})
    return r


async def advance_to(client, quiz_id, target, max_polls=12):
    """maybe_advance walks one transition per call — poll /state until target."""
    for _ in range(max_polls):
        r = await client.get(f"/api/quizzes/{quiz_id}/state")
        if r.status_code != 200:
            break
        if r.json()["status"] == target:
            return r.json()
    r = await client.get(f"/api/quizzes/{quiz_id}/state")
    raise AssertionError(f"never reached {target}, ended at {r.json()}")


# ---------- critical flows ----------


async def test_full_commitment_flow_with_conserved_payouts(client):
    # flow 1: session
    creator = await mk_user(client, "Ada")
    p2 = await mk_user(client, "Bode")
    p3 = await mk_user(client, "Chidi")

    # flow 2: create the core thing
    quiz_id = await mk_quiz(client, creator["id"], starts_in_s=60)
    for pos in (1, 2, 3):
        await add_question(client, quiz_id, pos, correct="C" if pos != 2 else "A")
    await publish_and_open(client, quiz_id)

    # publish auto-joins the creator (plays blind, counts toward quorum)
    r = await client.get(f"/api/quizzes/{quiz_id}/participants")
    assert r.status_code == 200
    assert len(r.json()) == 1

    # flow 3: participate — two more commitments reach quorum of 3
    p4 = await mk_user(client, "Dara")
    for u in (p2, p3, p4):
        r = await join(client, quiz_id, u["id"])
        assert r.status_code == 200, r.text
    # join is idempotent
    r = await join(client, quiz_id, p2["id"])
    assert r.status_code == 200
    r = await client.get(f"/api/quizzes/{quiz_id}/participants")
    assert len(r.json()) == 4

    # questions sealed until live + never leak the answer
    r = await client.get(f"/api/quizzes/{quiz_id}/questions", params={"user_id": p2["id"]})
    assert r.status_code == 409

    # creator starts the room
    r = await client.post(f"/api/quizzes/{quiz_id}/start")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "LIVE"

    # player view has no correct answers
    r = await client.get(f"/api/quizzes/{quiz_id}/questions", params={"user_id": p2["id"]})
    assert r.status_code == 200
    questions = r.json()
    assert len(questions) == 3
    for q in questions:
        assert set(q.keys()) == {"id", "position", "questionText", "options"}
        assert len(q["options"]) == 4

    # joining after LIVE is blocked
    late = await mk_user(client, "Latecomer")
    r = await join(client, quiz_id, late["id"])
    assert r.status_code == 409

    # play: creator 3/3, p2 2/3, p3 1/3, p4 0/3
    correct_by_pos = {1: "C", 2: "A", 3: "C"}
    plans = {
        "Ada": 3, "Bode": 2, "Chidi": 1, "Dara": 0,
    }
    pid_by_name = {}
    for name, correct_count in plans.items():
        user = {"Ada": creator, "Bode": p2, "Chidi": p3, "Dara": p4}[name]
        r = await client.get(f"/api/quizzes/{quiz_id}/questions", params={"user_id": user["id"]})
        # find this participant's id via join (idempotent returns existing)
        jr = await client.post(f"/api/quizzes/{quiz_id}/demo-start", params={"user_id": user["id"]})
        pid = jr.json()["participantId"]
        pid_by_name[name] = pid
        for q in r.json():
            want = correct_by_pos[q["position"]] if q["position"] <= correct_count else "B"
            ar = await client.post(f"/api/quizzes/{quiz_id}/answers", json={
                "participantId": pid,
                "questionId": q["id"],
                "selectedOption": want,
            })
            assert ar.status_code == 200, ar.text

    # one-shot answers: re-answer rejected
    r = await client.post(f"/api/quizzes/{quiz_id}/answers", json={
        "participantId": pid_by_name["Ada"],
        "questionId": questions[0]["id"],
        "selectedOption": "A",
    })
    assert r.status_code == 409

    # flow 4: results recorded + payout math conserved
    await advance_to(client, quiz_id, "SETTLED")
    r = await client.get(f"/api/quizzes/{quiz_id}/results")
    assert r.status_code == 200, r.text
    results = r.json()
    assert results["status"] == "SETTLED"
    rows = results["rows"]
    assert len(rows) == 4

    by_name = {row["displayName"]: row for row in rows}
    assert by_name["Ada"]["rank"] == 1
    assert by_name["Bode"]["rank"] == 2
    assert by_name["Chidi"]["rank"] == 3
    assert by_name["Dara"]["rank"] == 4
    assert by_name["Ada"]["correctAnswers"] == 3

    # pool = 20% of Dara's 100 = 20; bonus 2; winners split 18 as 10/6/2
    assert by_name["Ada"]["payout"] == pytest.approx(110.5, abs=1e-6)
    assert by_name["Bode"]["payout"] == pytest.approx(106.5, abs=1e-6)
    assert by_name["Chidi"]["payout"] == pytest.approx(102.5, abs=1e-6)
    assert by_name["Dara"]["payout"] == pytest.approx(80.5, abs=1e-6)
    assert by_name["Dara"]["payoutKind"] == "consolation"

    total_paid = sum(row["payout"] for row in rows)
    assert total_paid == pytest.approx(400.0, abs=1e-6), rows

    # review reveals answers + explanations
    r = await client.get(f"/api/quizzes/{quiz_id}/review", params={"user_id": p2["id"]})
    assert r.status_code == 200
    review = r.json()
    assert len(review) == 3
    assert review[0]["correctOption"] == "C"
    assert review[0]["explanation"] == "Because science."
    missed = [q for q in review if q["wasCorrect"] is False]
    assert len(missed) == 1  # p2 got position 3 wrong

    # flow 5: history persists
    r = await client.get(f"/api/users/{p2['id']}/history")
    assert r.status_code == 200
    history = r.json()
    assert len(history) == 1
    assert history[0]["quizId"] == quiz_id
    assert history[0]["rank"] == 2
    assert history[0]["payoutKind"] == "winner"


async def test_public_list_excludes_drafts_and_orders_joinable_first(client):
    creator = await mk_user(client, "Ada")
    draft = await mk_quiz(client, creator["id"])  # never published
    open_quiz = await mk_quiz(client, creator["id"], starts_in_s=60)
    await add_question(client, open_quiz, 1)
    await publish_and_open(client, open_quiz)

    r = await client.get("/api/quizzes")
    assert r.status_code == 200
    listing = r.json()
    ids = [q["id"] for q in listing]
    assert draft not in ids
    assert open_quiz in ids
    entry = next(q for q in listing if q["id"] == open_quiz)
    assert entry["status"] == "OPEN"
    assert entry["participantCount"] == 1  # creator auto-joined
    assert entry["minParticipants"] == 3
    assert entry["creatorId"] == creator["id"]

    # status filter works
    r = await client.get("/api/quizzes", params={"status": "OPEN"})
    assert all(q["status"] == "OPEN" for q in r.json())


async def test_underquorum_quiz_auto_cancels_and_refunds(client):
    creator = await mk_user(client, "Solo")
    quiz_id = await mk_quiz(client, creator["id"], starts_in_s=0, min_participants=3)
    await add_question(client, quiz_id, 1)
    await publish_and_open(client, quiz_id)  # creator only -> 1 of 3

    state = await advance_to(client, quiz_id, "REFUNDED")
    assert state["status"] == "REFUNDED"

    # joiners are locked out of a cancelled room
    other = await mk_user(client, "Other")
    r = await join(client, quiz_id, other["id"])
    assert r.status_code == 409


async def test_auto_live_at_starts_at_and_min_one_for_practice(client):
    creator = await mk_user(client, "Learner")
    quiz_id = await mk_quiz(client, creator["id"], starts_in_s=0, min_participants=1)
    await add_question(client, quiz_id, 1)
    await publish_and_open(client, quiz_id)  # creator auto-joined -> quorum of 1

    state = await advance_to(client, quiz_id, "LIVE")
    assert state["status"] == "LIVE"
    assert state["deadline"] is not None

    # creator can play solo immediately
    r = await client.get(f"/api/quizzes/{quiz_id}/questions", params={"user_id": creator["id"]})
    assert r.status_code == 200
    assert len(r.json()) == 1


async def test_results_locked_until_validation(client):
    creator = await mk_user(client, "Ada")
    quiz_id = await mk_quiz(client, creator["id"], starts_in_s=60)
    await add_question(client, quiz_id, 1)
    await publish_and_open(client, quiz_id)
    p2 = await mk_user(client, "Bode")
    p3 = await mk_user(client, "Chidi")
    await join(client, quiz_id, p2["id"])
    await join(client, quiz_id, p3["id"])

    r = await client.get(f"/api/quizzes/{quiz_id}/results")
    assert r.status_code == 409
    r = await client.get(f"/api/quizzes/{quiz_id}/review", params={"user_id": p2["id"]})
    assert r.status_code == 409


async def test_deadline_enforced_by_server(client):
    creator = await mk_user(client, "Ada")
    quiz_id = await mk_quiz(client, creator["id"], starts_in_s=0, duration=1, min_participants=1)
    await add_question(client, quiz_id, 1)
    await publish_and_open(client, quiz_id)
    await advance_to(client, quiz_id, "LIVE")

    r = await client.get(f"/api/quizzes/{quiz_id}/questions", params={"user_id": creator["id"]})
    q = r.json()[0]
    jr = await client.post(f"/api/quizzes/{quiz_id}/demo-start", params={"user_id": creator["id"]})
    pid = jr.json()["participantId"]

    import asyncio

    # duration is 1s + 10s grace -> wait past it
    await asyncio.sleep(11)

    ar = await client.post(f"/api/quizzes/{quiz_id}/answers", json={
        "participantId": pid,
        "questionId": q["id"],
        "selectedOption": "C",
    })
    assert ar.status_code == 409
    assert "Time is up" in ar.json()["detail"]

    # participant is marked TIMED_OUT by the server on the next poll
    state = await advance_to(client, quiz_id, "VALIDATING")
    r = await client.get(f"/api/quizzes/{quiz_id}/participants")
    me = next(p for p in r.json() if p["userId"] == creator["id"])
    assert me["status"] == "TIMED_OUT"
