from pydantic import BaseModel, EmailStr, Field


class CustomerCreateRequest(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    phone: str = Field(
        min_length=7,
        max_length=30,
    )

    email: EmailStr | None = None

    notes: str | None = Field(
        default=None,
        max_length=2000,
    )


class CustomerResponse(BaseModel):
    id: str
    business_id: str
    user_id: str | None
    full_name: str
    phone: str
    email: EmailStr | None
    notes: str | None