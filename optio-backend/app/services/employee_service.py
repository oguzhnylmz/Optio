from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.employee import Employee
from app.models.employee_service import employee_services
from app.models.service import Service
from app.schemas.employee import (
    EmployeeCreateRequest,
    EmployeeUpdateRequest,
)


def create_employee(
    db: Session,
    business: Business,
    data: EmployeeCreateRequest,
) -> Employee:
    employee = Employee(
        business_id=business.id,
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        display_name=(
            data.display_name.strip()
            if data.display_name
            else None
        ),
        phone=(
            data.phone.strip()
            if data.phone
            else None
        ),
        email=(
            data.email.strip()
            if data.email
            else None
        ),
        is_active=True,
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    return employee


def get_employees(
    db: Session,
    business: Business,
) -> list[Employee]:
    return list(
        db.scalars(
            select(Employee)
            .where(Employee.business_id == business.id)
            .order_by(
                Employee.is_active.desc(),
                Employee.created_at.desc(),
            )
        ).all()
    )


def get_employee(
    db: Session,
    business: Business,
    employee_id: UUID,
) -> Employee | None:
    return db.scalar(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.business_id == business.id,
        )
    )


def update_employee(
    db: Session,
    employee: Employee,
    data: EmployeeUpdateRequest,
) -> Employee:
    if data.first_name is not None:
        employee.first_name = data.first_name.strip()

    if data.last_name is not None:
        employee.last_name = data.last_name.strip()

    if data.display_name is not None:
        display_name = data.display_name.strip()
        employee.display_name = display_name or None

    if data.phone is not None:
        phone = data.phone.strip()
        employee.phone = phone or None

    if data.email is not None:
        email = data.email.strip()
        employee.email = email or None

    if data.is_active is not None:
        employee.is_active = data.is_active

    db.commit()
    db.refresh(employee)

    return employee


def delete_employee(
    db: Session,
    employee: Employee,
) -> Employee:
    employee.is_active = False

    db.commit()
    db.refresh(employee)

    return employee


def set_employee_services(
    db: Session,
    employee: Employee,
    service_ids: list[UUID],
) -> list[Service]:
    unique_service_ids = list(dict.fromkeys(service_ids))

    if not unique_service_ids:
        db.execute(
            delete(employee_services).where(
                employee_services.c.employee_id == employee.id
            )
        )

        db.commit()

        return []

    services = list(
        db.scalars(
            select(Service).where(
                Service.id.in_(unique_service_ids),
                Service.business_id == employee.business_id,
                Service.is_active.is_(True),
            )
        ).all()
    )

    if len(services) != len(unique_service_ids):
        raise ValueError(
            "One or more services are invalid."
        )

    db.execute(
        delete(employee_services).where(
            employee_services.c.employee_id == employee.id
        )
    )

    db.execute(
        employee_services.insert(),
        [
            {
                "employee_id": employee.id,
                "service_id": service.id,
            }
            for service in services
        ],
    )

    db.commit()

    return services


def get_employee_services(
    db: Session,
    employee: Employee,
) -> list[Service]:
    return list(
        db.scalars(
            select(Service)
            .join(
                employee_services,
                employee_services.c.service_id == Service.id,
            )
            .where(
                employee_services.c.employee_id == employee.id,
                Service.business_id == employee.business_id,
            )
            .order_by(Service.name.asc())
        ).all()
    )