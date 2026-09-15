from datetime import time

from pydantic import BaseModel, Field


class BusinessHourRequest(BaseModel):
    day_of_week: int = Field(
        ge=0,
        le=6,
    )

    start_time: time
    end_time: time