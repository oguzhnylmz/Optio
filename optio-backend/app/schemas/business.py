from pydantic import BaseModel, EmailStr, Field


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


class BusinessUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
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

    country: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    timezone: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    logo_url: str | None = Field(
        default=None,
        max_length=500,
    )


class AdminBusinessUpdateRequest(BusinessUpdateRequest):
    is_active: bool | None = None


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


class AdminBusinessResponse(BusinessResponse):
    owner_first_name: str | None
    owner_last_name: str | None
    owner_email: EmailStr | None
    owner_phone: str | None