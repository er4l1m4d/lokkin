from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field
from uuid import UUID

class CreateUserRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)
    wallet_address: str | None = None

class CreateQuizRequest(BaseModel):
    creator_id: UUID
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    currency: str = "NIM"
    entry_amount: Decimal = Field(ge=0)
    duration_seconds: int = Field(gt=0, le=3600)
    starts_at: datetime | None = None

class CreateQuestionRequest(BaseModel):
    position: int = Field(gt=0)
    question_text: str = Field(min_length=1)
    option_a: str = Field(min_length=1)
    option_b: str = Field(min_length=1)
    option_c: str = Field(min_length=1)
    option_d: str = Field(min_length=1)
    correct_option: str = Field(pattern="^[ABCD]$")

class AnswerRequest(BaseModel):
    participant_id: UUID
    question_id: UUID
    selected_option: str = Field(pattern="^[ABCD]$")

class FlagRequest(BaseModel):
    participant_id: UUID
    reason: str = Field(min_length=1, max_length=100)
    description: str | None = None
