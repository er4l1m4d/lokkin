from datetime import datetime, timezone
from uuid import UUID
from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_db
from .models import Answer, Participant, Question, Quiz, QuizEvent, User
from .schemas import AnswerRequest, CreateQuestionRequest, CreateQuizRequest, CreateUserRequest, FlagRequest
from .services import DomainError, submit_answer, transition_quiz

app = FastAPI(title="Lokkin Core API", version="0.1.0")

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/api/users", status_code=status.HTTP_201_CREATED)
async def create_user(req: CreateUserRequest, db: AsyncSession = Depends(get_db)):
    user = User(display_name=req.display_name, wallet_address=req.wallet_address)
    db.add(user)
    try:
        await db.commit()
        await db.refresh(user)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(409, "User could not be created") from exc
    return {"id": str(user.id), "displayName": user.display_name}

@app.post("/api/quizzes", status_code=status.HTTP_201_CREATED)
async def create_quiz(req: CreateQuizRequest, db: AsyncSession = Depends(get_db)):
    creator = await db.get(User, req.creator_id)
    if not creator:
        raise HTTPException(404, "Creator not found")
    quiz = Quiz(
        creator_id=creator.id,
        title=req.title,
        description=req.description,
        status="DRAFT",
        currency=req.currency,
        entry_amount=req.entry_amount,
        duration_seconds=req.duration_seconds,
        question_count=0,
        starts_at=req.starts_at,
        result_version=0,
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return {"quizId": str(quiz.id), "status": quiz.status}

@app.post("/api/quizzes/{quiz_id}/questions", status_code=status.HTTP_201_CREATED)
async def add_question(quiz_id: UUID, req: CreateQuestionRequest, db: AsyncSession = Depends(get_db)):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    if quiz.status not in {"DRAFT", "PUBLISHED", "OPEN"}:
        raise HTTPException(409, "Questions cannot be changed in this quiz state")
    q = Question(
        quiz_id=quiz.id,
        position=req.position,
        question_text=req.question_text,
        option_a=req.option_a,
        option_b=req.option_b,
        option_c=req.option_c,
        option_d=req.option_d,
        correct_option=req.correct_option,
        status="ACTIVE",
    )
    db.add(q)
    quiz.question_count = quiz.question_count + 1
    await db.commit()
    await db.refresh(q)
    return {"questionId": str(q.id), "position": q.position}

@app.get("/api/quizzes/{quiz_id}")
async def get_quiz(quiz_id: UUID, db: AsyncSession = Depends(get_db)):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    result = await db.execute(select(func.count(Participant.id)).where(Participant.quiz_id == quiz.id))
    participant_count = result.scalar_one()
    return {
        "id": str(quiz.id),
        "title": quiz.title,
        "description": quiz.description,
        "status": quiz.status,
        "currency": quiz.currency,
        "entryAmount": str(quiz.entry_amount),
        "durationSeconds": quiz.duration_seconds,
        "questionCount": quiz.question_count,
        "participantCount": participant_count,
        "startsAt": quiz.starts_at,
    }

@app.post("/api/quizzes/{quiz_id}/publish")
async def publish_quiz(quiz_id: UUID, db: AsyncSession = Depends(get_db)):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    if quiz.status != "DRAFT":
        raise HTTPException(409, "Quiz is not a draft")
    if quiz.question_count == 0:
        raise HTTPException(400, "Quiz must contain at least one question")
    try:
        await transition_quiz(db, quiz, "PUBLISHED")
        quiz.published_at = datetime.now(timezone.utc)
        await db.commit()
    except DomainError as exc:
        await db.rollback()
        raise HTTPException(409, str(exc)) from exc
    return {"quizId": str(quiz.id), "status": quiz.status}

@app.post("/api/quizzes/{quiz_id}/open")
async def open_quiz(quiz_id: UUID, db: AsyncSession = Depends(get_db)):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    try:
        await transition_quiz(db, quiz, "OPEN")
        await db.commit()
    except DomainError as exc:
        await db.rollback()
        raise HTTPException(409, str(exc)) from exc
    return {"quizId": str(quiz.id), "status": quiz.status}

@app.post("/api/quizzes/{quiz_id}/demo-start")
async def demo_start(quiz_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    """Create a non-financial participant for the demo quiz flow."""
    quiz = await db.get(Quiz, quiz_id)
    user = await db.get(User, user_id)
    if not quiz or not user:
        raise HTTPException(404, "Quiz or user not found")
    if quiz.status not in {"PUBLISHED", "OPEN", "LIVE"}:
        raise HTTPException(409, "Quiz is not available")
    existing = await db.execute(select(Participant).where(Participant.quiz_id == quiz.id, Participant.user_id == user.id))
    participant = existing.scalar_one_or_none()
    if participant is None:
        participant = Participant(quiz_id=quiz.id, user_id=user.id, status="JOINED", disconnect_count=0)
        db.add(participant)
        db.add(QuizEvent(quiz_id=quiz.id, participant_id=None, event_type="QUIZ_JOINED", event_timestamp=datetime.now(timezone.utc), metadata={"user_id": str(user.id)}))
        await db.commit()
        await db.refresh(participant)
    return {"participantId": str(participant.id), "status": participant.status}

@app.post("/api/quizzes/{quiz_id}/start")
async def start_quiz(quiz_id: UUID, db: AsyncSession = Depends(get_db)):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    try:
        await transition_quiz(db, quiz, "LIVE")
        await db.commit()
    except DomainError as exc:
        await db.rollback()
        raise HTTPException(409, str(exc)) from exc
    return {"quizId": str(quiz.id), "status": quiz.status, "startedAt": quiz.started_at}

@app.get("/api/quizzes/{quiz_id}/state")
async def quiz_state(quiz_id: UUID, db: AsyncSession = Depends(get_db)):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    now = datetime.now(timezone.utc)
    deadline = quiz.started_at.timestamp() + quiz.duration_seconds if quiz.started_at else None
    return {"status": quiz.status, "serverTime": now, "deadline": deadline}

@app.post("/api/quizzes/{quiz_id}/answers")
async def answer_question(quiz_id: UUID, req: AnswerRequest, db: AsyncSession = Depends(get_db)):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    try:
        answer = await submit_answer(db, quiz, req.participant_id, req.question_id, req.selected_option)
        await db.commit()
    except DomainError as exc:
        await db.rollback()
        raise HTTPException(409, str(exc)) from exc
    return {"accepted": True, "correct": answer.is_correct}
