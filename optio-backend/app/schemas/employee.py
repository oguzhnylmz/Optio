from pydantic import BaseModel, Field


class EmployeeCreateRequest(BaseModel):
    first_name: str = Field(
        min_length=2,
        max_length=100,
    )

    last_name: str = Field(
        min_length=2,
        max_length=100,
    )

    display_name: str | None = Field(
        default=None,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: str | None = Field(
        default=None,
        max_length=255,
    )


class EmployeeUpdateRequest(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    display_name: str | None = Field(
        default=None,
        max_length=150,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    email: str | None = Field(
        default=None,
        max_length=255,
    )

    is_active: bool | None = None


class EmployeeResponse(BaseModel):
    id: str
    business_id: str
    first_name: str
    last_name: str
    display_name: str | None
    phone: str | None
    email: str | None
    is_active: bool


class EmployeeServicesUpdateRequest(BaseModel):
    service_ids: list[str] = Field(
        default_factory=list,
    )