from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.business_application import BusinessApplicationStatus


class BusinessApplicationCreateRequest(BaseModel):
    first_name: str = Field(
        min_length=2,
        max_length=100,
    )

    last_name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    phone: str = Field(
        min_length=7,
        max_length=30,
    )

    business_name: str = Field(
        min_length=2,
        max_length=150,
    )

    business_type: str | None = Field(
        default=None,
        max_length=100,
    )

    business_phone: str | None = Field(
        default=None,
        max_length=30,
    )

    business_email: EmailStr | None = None

    city: str = Field(
        min_length=2,
        max_length=100,
    )

    district: str | None = Field(
        default=None,
        max_length=100,
    )

    address: str | None = Field(
        default=None,
        max_length=255,
    )

    website: str | None = Field(
        default=None,
        max_length=500,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )


class BusinessApplicationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: str
    first_name: str
    last_name: str
    email: str
    phone: str

    business_name: str
    business_type: str | None
    business_phone: str | None
    business_email: str | None

    city: str
    district: str | None
    address: str | None
    website: str | None
    description: str | None

    status: BusinessApplicationStatus
    rejection_reason: str | None

    reviewed_at: datetime | None
    reviewed_by: str | None

    created_at: datetime
    updated_at: datetime


class BusinessApplicationRejectRequest(BaseModel):
    rejection_reason: str = Field(
        min_length=3,
        max_length=2000,
    )