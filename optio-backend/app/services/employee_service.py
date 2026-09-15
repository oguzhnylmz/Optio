from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.employee import Employee
from app.models.employee_service import employee_services
from app.models.service import Service
from app.schemas.employee import EmployeeCreateRequest


def create_employee(
    db: Session,
    business: Business,
    data: EmployeeCreateRequest,
) -> Employee:
    employee = Employee(
        business_id=business.id,
        first_name=data.first_name,
        last_name=data.last_name,
        display_name=data.display_name,
        phone=data.phone,
        email=data.email,
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
            .order_by(Employee.created_at.desc())
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


def set_employee_services(
    db: Session,
    employee: Employee,
    service_ids: list[UUID],
) -> list[Service]:
    services = list(
        db.scalars(
            select(Service).where(
                Service.id.in_(service_ids),
                Service.business_id == employee.business_id,
                Service.is_active.is_(True),
            )
        ).all()
    )

    if len(services) != len(set(service_ids)):
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