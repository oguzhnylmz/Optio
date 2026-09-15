from pydantic import BaseModel, Field, EmailStr


class BusinessCreateRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: EmailStr | None = None

    address: str | None = Field(
        default=None,
        max_length=255,
    )

    city: str | None = Field(
        default=None,
        max_length=100,
    )


class BusinessResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    slug: str
    description: str | None
    phone: str | None
    email: EmailStr | None
    address: str | None
    city: str | None
    country: str
    timezone: str
    logo_url: str | None
    is_active: bool