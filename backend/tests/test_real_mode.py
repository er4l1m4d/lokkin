"""Real-payments mode: memo commitments, on-chain verification, settlement sidecar API."""
from datetime import datetime, timedelta, timezone

import pytest

pytestmark = pytest.mark.asyncio

ESCROW = "NQ02 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM YYQ0"


async def mk_user(client, name):
    r = await client.post("/api/users", json={"displayName": name})
    assert r.status_code == 201, r.text
    return r.json()


async def build_quiz(client, creator_id, *, starts_in_s=0, entry=100, min_participants=3):
    r = await client.post("/api/quizzes", json={
        "creatorId": creator_id,
        "title": "Real Mode Quiz",
        "currency": "NIM",
        "entryAmount": entry,
        "durationSeconds": 300,
        "startsAt": (datetime.now(timezone.utc) + timedelta(seconds=starts_in_s)).isoformat(),
        "minParticipants": min_participants,
    })
    assert r.status_code == 201, r.text
    quiz_id = r.json()["quizId"]
    for pos in (1, 2):
        await client.post(f"/api/quizzes/{quiz_id}/questions", json={
            "position": pos,
            "questionText": f"Q{pos} blank ______?",
            "optionA": "Alpha", "optionB": "Beta", "optionC": "Gamma", "optionD": "Delta",
            "correctOption": "C",
        })
    r = await client.post(f"/api/quizzes/{quiz_id}/publish")
    assert r.status_code == 200, r.text
    r = await client.post(f"/api/quizzes/{quiz_id}/open")
    assert r.status_code == 200, r.text
    return quiz_id


def fake_tx(chain, memo: str, *, value_luna: int = 10_000_000, to: str = ESCROW, frm: str = "NQ33 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM 1234") -> str:
    tx_hash = "ab" * 32
    chain.add_tx(tx_hash, to=to, value_luna=value_luna, data_hex=memo.encode().hex(), frm=frm)
    return tx_hash


async def join_and_pay(client, chain, quiz_id, user, wallet=None):
    r = await client.post(f"/api/quizzes/{quiz_id}/join", json={"userId": user["id"]})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "PENDING"
    assert body["memoCode"].startswith("QS-")
    assert body["escrowAddress"] == ESCROW
    assert body["paymentsMode"] == "real"

    if wallet:
        r = await client.post(f"/api/users/{user['id']}/wallet", json={"walletAddress": wallet})
        assert r.status_code == 200

    tx_hash = fake_tx(chain, body["memoCode"], frm=wallet or "NQ33 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM 1234")
    r = await client.post(f"/api/quizzes/{quiz_id}/commitments/verify", json={
        "participantId": body["participantId"],
        "txRef": tx_hash,
    })
    assert r.status_code == 200, r.text
    assert r.json()["verified"] is True, r.text
    assert r.json()["status"] == "JOINED"
    return body["participantId"], body["memoCode"]


async def test_config_reports_real_mode(client):
    r = await client.get("/api/config")
    assert r.status_code == 200
    assert r.json() == {
        "paymentsMode": "mock",
        "escrowAddress": ESCROW,
        "minParticipantsDefault": 3,
    }


async def test_real_join_pending_with_memo(client, real_mode):
    creator = await mk_user(client, "Ada")
    quiz_id = await build_quiz(client, creator["id"], starts_in_s=60)

    # creator auto-joined on publish -> also PENDING in real mode
    r = await client.get(f"/api/quizzes/{quiz_id}/participants")
    assert r.json()[0]["status"] == "PENDING"

    # config now says real
    r = await client.get("/api/config")
    assert r.json()["paymentsMode"] == "real"


async def test_pending_does_not_count_toward_quorum(client, real_mode):
    creator = await mk_user(client, "Ada")
    other = await mk_user(client, "Bode")
    quiz_id = await build_quiz(client, creator["id"], starts_in_s=0, min_participants=2)

    # one more PENDING join (creator + this = 2 pending, 0 confirmed)
    r = await client.post(f"/api/quizzes/{quiz_id}/join", json={"userId": other["id"]})
    assert r.json()["status"] == "PENDING"

    # window closes with zero confirmed -> cancel path, PENDING players get no refund rows
    for _ in range(10):
        state = (await client.get(f"/api/quizzes/{quiz_id}/state")).json()
        if state["status"] in ("REFUNDING", "REFUNDED"):
            break
    assert state["status"] in ("REFUNDING", "REFUNDED")


async def test_verification_rejects_wrong_amount_recipient_and_memo(client, real_mode):
    creator = await mk_user(client, "Ada")
    quiz_id = await build_quiz(client, creator["id"], starts_in_s=60)

    r = await client.post(f"/api/quizzes/{quiz_id}/join", json={"userId": creator["id"]})
    pid = r.json()["participantId"]
    memo = r.json()["memoCode"]

    # wrong recipient
    tx = fake_tx(real_mode, memo, to="NQ00 0000 0000 0000 0000 0000 0000 0000 0000")
    r = await client.post(f"/api/quizzes/{quiz_id}/commitments/verify", json={"participantId": pid, "txRef": tx})
    assert r.json()["verified"] is False
    assert "escrow" in r.json()["detail"].lower()

    # wrong value (entry is 100 NIM = 10,000,000 luna; send 1 NIM)
    tx = fake_tx(real_mode, memo, value_luna=100_000)
    r = await client.post(f"/api/quizzes/{quiz_id}/commitments/verify", json={"participantId": pid, "txRef": tx})
    assert r.json()["verified"] is False
    assert "value" in r.json()["detail"].lower()

    # wrong memo
    tx = fake_tx(real_mode, "QS-WRONG")
    r = await client.post(f"/api/quizzes/{quiz_id}/commitments/verify", json={"participantId": pid, "txRef": tx})
    assert r.json()["verified"] is False
    assert "memo" in r.json()["detail"].lower()

    # unknown hash -> pending, not error
    r = await client.post(f"/api/quizzes/{quiz_id}/commitments/verify", json={"participantId": pid, "txRef": "ff" * 32})
    assert r.status_code == 200
    assert r.json()["verified"] is False
    assert r.json()["status"] == "PENDING"

    # commitment status endpoint reflects state
    r = await client.get(f"/api/quizzes/{quiz_id}/commitments/{pid}")
    assert r.json()["status"] == "PENDING"
    assert r.json()["memoCode"] == memo

    # correct tx -> confirmed
    tx = fake_tx(real_mode, memo)
    r = await client.post(f"/api/quizzes/{quiz_id}/commitments/verify", json={"participantId": pid, "txRef": tx})
    assert r.json()["verified"] is True
    r = await client.get(f"/api/quizzes/{quiz_id}/commitments/{pid}")
    assert r.json()["status"] == "JOINED"
    assert r.json()["txHash"] == tx


async def test_sender_mismatch_rejected_when_wallet_linked(client, real_mode):
    creator = await mk_user(client, "Ada")
    linked = "NQ55 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM 5555"
    r = await client.post(f"/api/users/{creator['id']}/wallet", json={"walletAddress": linked})
    assert r.status_code == 200
    assert r.json()["deviceId"] is None

    quiz_id = await build_quiz(client, creator["id"], starts_in_s=60)
    r = await client.post(f"/api/quizzes/{quiz_id}/join", json={"userId": creator["id"]})
    pid, memo = r.json()["participantId"], r.json()["memoCode"]

    # paid from a different wallet than the linked one
    tx = fake_tx(real_mode, memo, frm="NQ99 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM 9999")
    r = await client.post(f"/api/quizzes/{quiz_id}/commitments/verify", json={"participantId": pid, "txRef": tx})
    assert r.json()["verified"] is False
    assert "different wallet" in r.json()["detail"].lower()

    # paid from the linked wallet
    tx = fake_tx(real_mode, memo, frm=linked)
    r = await client.post(f"/api/quizzes/{quiz_id}/commitments/verify", json={"participantId": pid, "txRef": tx})
    assert r.json()["verified"] is True


async def test_full_real_mode_flow_with_settlement_sidecar(client, real_mode):
    creator = await mk_user(client, "Ada")
    wallets = {
        "Ada": "NQ11 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM 1111",
        "Bode": "NQ22 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM 2222",
        "Chidi": "NQ33 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM 3333",
        "Dara": "NQ44 4RCH AXQ1 P50Y 2LJV F9RN 0FCX 4VKM 4444",
    }
    p2 = await mk_user(client, "Bode")
    p3 = await mk_user(client, "Chidi")
    p4 = await mk_user(client, "Dara")

    quiz_id = await build_quiz(client, creator["id"], starts_in_s=0, entry=100)
    # creator pays (auto-joined on publish as PENDING)
    await join_and_pay(client, real_mode, quiz_id, creator, wallets["Ada"])
    await join_and_pay(client, real_mode, quiz_id, p2, wallets["Bode"])
    await join_and_pay(client, real_mode, quiz_id, p3, wallets["Chidi"])
    await join_and_pay(client, real_mode, quiz_id, p4, wallets["Dara"])

    # quorum met -> auto LIVE at window close
    for _ in range(12):
        state = (await client.get(f"/api/quizzes/{quiz_id}/state")).json()
        if state["status"] == "LIVE":
            break
    assert state["status"] == "LIVE"

    # play: Ada 2/2, Bode 1/2, Chidi 1/2, Dara 0/2 -> ranks 1, 2, 2, 4
    plans = [(creator, 2), (p2, 1), (p3, 1), (p4, 0)]
    for user, correct in plans:
        questions = (await client.get(f"/api/quizzes/{quiz_id}/questions", params={"user_id": user["id"]})).json()
        jr = await client.post(f"/api/quizzes/{quiz_id}/demo-start", params={"user_id": user["id"]})
        pid = jr.json()["participantId"]
        for q in questions:
            await client.post(f"/api/quizzes/{quiz_id}/answers", json={
                "participantId": pid,
                "questionId": q["id"],
                "selectedOption": "C" if q["position"] <= correct else "B",
            })

    # walk to FINALIZED (real mode: does NOT auto-settle)
    for _ in range(12):
        state = (await client.get(f"/api/quizzes/{quiz_id}/state")).json()
        if state["status"] == "FINALIZED":
            break
    assert state["status"] == "FINALIZED"

    # settlement token guard
    r = await client.get("/api/settlement/queue")
    assert r.status_code == 401

    # sidecar picks up the queue
    r = await client.get("/api/settlement/queue", headers={"x-settlement-token": "test-token"})
    assert r.status_code == 200
    queue = r.json()
    assert queue["paymentsMode"] == "real"
    assert queue["escrowAddress"] == ESCROW
    entry = next(q for q in queue["quizzes"] if q["quizId"] == quiz_id)
    assert len(entry["payouts"]) == 4
    by_name = {p["displayName"]: p for p in entry["payouts"]}
    # pool = 20% of Dara's 100 = 20. Rank1 Ada 10; rank2 Bode+Chidi split 6 -> 3 each;
    # rank3 skipped -> bonus = 2 + 2 = 4, split over 4 completers -> 1 each.
    assert by_name["Ada"]["amountLuna"] == (100 + 10 + 1) * 100_000
    assert by_name["Bode"]["amountLuna"] == (100 + 3 + 1) * 100_000
    assert by_name["Dara"]["amountLuna"] == (80 + 1) * 100_000
    assert set(by_name["Ada"]["walletAddress"].split()) == set(wallets["Ada"].split())

    # sidecar reports completion (mocked broadcast)
    payouts = [{"participantId": p["participantId"], "txHash": "cd" * 32} for p in entry["payouts"]]
    r = await client.post("/api/settlement/complete", json={"quizId": quiz_id, "payouts": payouts}, headers={"x-settlement-token": "test-token"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "SETTLED"

    # results visible after settlement
    r = await client.get(f"/api/quizzes/{quiz_id}/results")
    assert r.status_code == 200
    rows = r.json()["rows"]
    total = sum(row["payout"] for row in rows)
    assert total == pytest.approx(400.0, abs=1e-6)

    # queue no longer contains it
    r = await client.get("/api/settlement/queue", headers={"x-settlement-token": "test-token"})
    assert all(q["quizId"] != quiz_id for q in r.json()["quizzes"])


async def test_settlement_wrong_token_rejected(client, real_mode):
    r = await client.post("/api/settlement/complete", json={"quizId": "0" * 32, "payouts": []}, headers={"x-settlement-token": "wrong"})
    assert r.status_code == 401
