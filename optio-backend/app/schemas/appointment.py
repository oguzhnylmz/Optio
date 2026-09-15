from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class AppointmentStatusUpdate(str, Enum):
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class AppointmentCreateRequest(BaseModel):
    customer_id: str
    employee_id: str
    service_id: str

    start_at: datetime

    customer_note: str | None = Field(
        default=None,
        max_length=2000,
    )


class PublicAppointmentCreateRequest(BaseModel):
    employee_id: str
    service_id: str

    start_at: datetime

    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    phone: str = Field(
        min_length=7,
        max_length=30,
    )

    email: str | None = None

    customer_note: str | None = Field(
        default=None,
        max_length=2000,
    )


class AppointmentStatusUpdateRequest(BaseModel):
    status: AppointmentStatusUpdate


class AppointmentResponse(BaseModel):
    id: str
    business_id: str
    customer_id: str
    employee_id: str
    service_id: str
    start_at: datetime
    end_at: datetime
    status: str
    customer_note: str | None
    internal_note: str | None


class PublicAppointmentResponse(BaseModel):
    appointment_id: str
    business_name: str
    customer_name: str
    service_name: str
    employee_name: str
    start_at: datetime
    end_at: datetime
    status: str