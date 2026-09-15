from datetime import time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.business_hour import BusinessHour
from app.schemas.business_hours import BusinessHourRequest


def create_business_hour(
    db: Session,
    business: Business,
    data: BusinessHourRequest,
) -> BusinessHour:
    if data.start_time >= data.end_time:
        raise ValueError(
            "Start time must be earlier than end time."
        )

    business_hour = BusinessHour(
        business_id=business.id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
    )

    db.add(business_hour)
    db.commit()
    db.refresh(business_hour)

    return business_hour


def get_business_hours(
    db: Session,
    business: Business,
) -> list[BusinessHour]:
    return list(
        db.scalars(
            select(BusinessHour)
            .where(
                BusinessHour.business_id == business.id
            )
            .order_by(
                BusinessHour.day_of_week,
                BusinessHour.start_time,
            )
        ).all()
    )