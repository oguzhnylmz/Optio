from datetime import date, time

from pydantic import BaseModel, Field


class EmployeeAvailabilityRequest(BaseModel):
    day_of_week: int = Field(
        ge=0,
        le=6,
    )

    start_time: time
    end_time: time


class AvailableSlotsResponse(BaseModel):
    date: date
    employee_id: str
    service_id: str
    slots: list[time]