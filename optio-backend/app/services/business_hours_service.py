from datetime import time
from uuid import UUID

from sqlalchemy import delete, select
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


def delete_business_hour(
    db: Session,
    business: Business,
    business_hour_id: UUID,
) -> bool:
    result = db.execute(
        delete(BusinessHour).where(
            BusinessHour.id == business_hour_id,
            BusinessHour.business_id == business.id,
        )
    )

    db.commit()

    return result.rowcount > 0


def replace_business_hours(
    db: Session,
    business: Business,
    hours: list[BusinessHourRequest],
) -> list[BusinessHour]:
    for item in hours:
        if item.start_time >= item.end_time:
            raise ValueError(
                "Start time must be earlier than end time."
            )

    db.execute(
        delete(BusinessHour).where(
            BusinessHour.business_id == business.id
        )
    )

    for item in hours:
        db.add(
            BusinessHour(
                business_id=business.id,
                day_of_week=item.day_of_week,
                start_time=item.start_time,
                end_time=item.end_time,
            )
        )

    db.commit()

    return get_business_hours(
        db=db,
        business=business,
    )