from decimal import Decimal

from pydantic import BaseModel, Field


class ServiceCreateRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    duration_minutes: int = Field(
        gt=0,
        le=1440,
    )

    price: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2,
    )

    currency: str = Field(
        default="TRY",
        min_length=3,
        max_length=3,
    )


class ServiceUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    duration_minutes: int | None = Field(
        default=None,
        gt=0,
        le=1440,
    )

    price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2,
    )

    currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
    )

    is_active: bool | None = None


class ServiceResponse(BaseModel):
    id: str
    business_id: str
    name: str
    description: str | None
    duration_minutes: int
    price: Decimal
    currency: str
    is_active: bool