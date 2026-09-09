from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from uuid import UUID


class CamelModel(BaseModel):
    """Accepts camelCase (frontend) and snake_case payloads."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CreateUserRequest(CamelModel):
    display_name: str = Field(min_length=1, max_length=80)
    wallet_address: str | None = None


class CreateQuizRequest(CamelModel):
    creator_id: UUID
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    currency: str = "NIM"
    entry_amount: Decimal = Field(ge=0)
    duration_seconds: int = Field(gt=0, le=3600)
    starts_at: datetime | None = None
    min_participants: int = Field(default=3, ge=1, le=100)


class CreateQuestionRequest(CamelModel):
    position: int = Field(gt=0)
    question_text: str = Field(min_length=1)
    option_a: str = Field(min_length=1)
    option_b: str = Field(min_length=1)
    option_c: str = Field(min_length=1)
    option_d: str = Field(min_length=1)
    correct_option: str = Field(pattern="^[ABCD]$")
    explanation: str | None = None


class JoinRequest(CamelModel):
    user_id: UUID


class AnswerRequest(CamelModel):
    participant_id: UUID
    question_id: UUID
    selected_option: str = Field(pattern="^[ABCD]$")


class FlagRequest(CamelModel):
    participant_id: UUID
    reason: str = Field(min_length=1, max_length=100)
    description: str | None = None
