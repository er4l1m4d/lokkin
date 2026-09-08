from datetime import datetime
from decimal import Decimal
from uuid import UUID
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    wallet_address: Mapped[str | None] = mapped_column(Text, unique=True)
    display_name: Mapped[str] = mapped_column(Text)

class Quiz(Base):
    __tablename__ = "quizzes"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    creator_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String)
    currency: Mapped[str] = mapped_column(String)
    entry_amount: Mapped[Decimal] = mapped_column(Numeric(30, 12))
    duration_seconds: Mapped[int] = mapped_column(Integer)
    question_count: Mapped[int] = mapped_column(Integer)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    join_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    result_version: Mapped[int] = mapped_column(Integer)

class Participant(Base):
    __tablename__ = "participants"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    quiz_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("quizzes.id"))
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String)
    disconnect_count: Mapped[int] = mapped_column(Integer)

class Question(Base):
    __tablename__ = "questions"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    quiz_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("quizzes.id"))
    position: Mapped[int] = mapped_column(Integer)
    question_text: Mapped[str] = mapped_column(Text)
    option_a: Mapped[str] = mapped_column(Text)
    option_b: Mapped[str] = mapped_column(Text)
    option_c: Mapped[str] = mapped_column(Text)
    option_d: Mapped[str] = mapped_column(Text)
    correct_option: Mapped[str] = mapped_column(String(1))
    status: Mapped[str] = mapped_column(String)

class Answer(Base):
    __tablename__ = "answers"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    participant_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("participants.id"))
    question_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("questions.id"))
    selected_option: Mapped[str] = mapped_column(String(1))
    is_correct: Mapped[bool] = mapped_column(Boolean)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class QuizEvent(Base):
    __tablename__ = "quiz_events"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    quiz_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("quizzes.id"))
    participant_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("participants.id"))
    event_type: Mapped[str] = mapped_column(Text)
    event_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    metadata: Mapped[dict | None] = mapped_column(JSONB)
