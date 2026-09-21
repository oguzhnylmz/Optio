from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.employee_availability import EmployeeAvailability
from app.schemas.availability import (
    EmployeeAvailabilityRequest,
)


def create_employee_availability(
    db: Session,
    employee: Employee,
    data: EmployeeAvailabilityRequest,
) -> EmployeeAvailability:
    if data.start_time >= data.end_time:
        raise ValueError(
            "Start time must be earlier than end time."
        )

    availability = EmployeeAvailability(
        employee_id=employee.id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
    )

    db.add(availability)
    db.commit()
    db.refresh(availability)

    return availability


def get_employee_availability(
    db: Session,
    employee: Employee,
) -> list[EmployeeAvailability]:
    return list(
        db.scalars(
            select(EmployeeAvailability)
            .where(
                EmployeeAvailability.employee_id
                == employee.id
            )
            .order_by(
                EmployeeAvailability.day_of_week,
                EmployeeAvailability.start_time,
            )
        ).all()
    )


def delete_employee_availability(
    db: Session,
    employee: Employee,
    availability_id: UUID,
) -> bool:
    result = db.execute(
        delete(EmployeeAvailability).where(
            EmployeeAvailability.id == availability_id,
            EmployeeAvailability.employee_id
            == employee.id,
        )
    )

    db.commit()

    return result.rowcount > 0


def replace_employee_availability(
    db: Session,
    employee: Employee,
    availability: list[EmployeeAvailabilityRequest],
) -> list[EmployeeAvailability]:
    for item in availability:
        if item.start_time >= item.end_time:
            raise ValueError(
                "Start time must be earlier than end time."
            )

    db.execute(
        delete(EmployeeAvailability).where(
            EmployeeAvailability.employee_id
            == employee.id
        )
    )

    for item in availability:
        db.add(
            EmployeeAvailability(
                employee_id=employee.id,
                day_of_week=item.day_of_week,
                start_time=item.start_time,
                end_time=item.end_time,
            )
        )

    db.commit()

    return get_employee_availability(
        db=db,
        employee=employee,
    )