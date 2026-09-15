from datetime import date
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_optional_current_user,
)
from app.db.database import get_db
from app.models.business import Business
from app.models.employee import Employee
from app.models.employee_service import employee_services
from app.models.service import Service
from app.models.user import User
from app.schemas.appointment import (
    PublicAppointmentCreateRequest,
    PublicAppointmentResponse,
)
from app.services.appointment_service import (
    create_public_appointment,
)
from app.services.availability_service import (
    get_available_slots,
)


router = APIRouter(
    prefix="/public/businesses",
    tags=["Public Businesses"],
)


@router.get("/{slug}")
def get_public_business(
    slug: str,
    db: Session = Depends(get_db),
):
    business = db.scalar(
        select(Business).where(
            Business.slug == slug,
            Business.is_active.is_(True),
        )
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    return {
        "id": str(business.id),
        "name": business.name,
        "slug": business.slug,
        "description": business.description,
        "phone": business.phone,
        "email": business.email,
        "address": business.address,
        "city": business.city,
        "country": business.country,
        "timezone": business.timezone,
        "logo_url": business.logo_url,
    }


@router.get("/{slug}/services")
def get_public_services(
    slug: str,
    db: Session = Depends(get_db),
):
    business = db.scalar(
        select(Business).where(
            Business.slug == slug,
            Business.is_active.is_(True),
        )
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    services = list(
        db.scalars(
            select(Service)
            .where(
                Service.business_id == business.id,
                Service.is_active.is_(True),
            )
            .order_by(Service.name.asc())
        ).all()
    )

    return [
        {
            "id": str(service.id),
            "name": service.name,
            "description": service.description,
            "duration_minutes": service.duration_minutes,
            "price": service.price,
            "currency": service.currency,
        }
        for service in services
    ]


@router.get("/{slug}/employees")
def get_public_employees(
    slug: str,
    service_id: UUID | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
):
    business = db.scalar(
        select(Business).where(
            Business.slug == slug,
            Business.is_active.is_(True),
        )
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    query = (
        select(Employee)
        .where(
            Employee.business_id == business.id,
            Employee.is_active.is_(True),
        )
        .order_by(Employee.created_at.asc())
    )

    if service_id is not None:
        service_exists = db.scalar(
            select(Service.id).where(
                Service.id == service_id,
                Service.business_id == business.id,
                Service.is_active.is_(True),
            )
        )

        if service_exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found.",
            )

        query = query.join(
            employee_services,
            employee_services.c.employee_id
            == Employee.id,
        ).where(
            employee_services.c.service_id
            == service_id,
        )

    employees = list(
        db.scalars(query).all()
    )

    return [
        {
            "id": str(employee.id),
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "display_name": (
                employee.display_name
                or (
                    f"{employee.first_name} "
                    f"{employee.last_name}"
                )
            ),
        }
        for employee in employees
    ]


@router.get("/{slug}/availability")
def get_public_availability(
    slug: str,
    service_id: UUID = Query(...),
    employee_id: UUID = Query(...),
    target_date: date = Query(
        ...,
        alias="date",
    ),
    db: Session = Depends(get_db),
):
    business = db.scalar(
        select(Business).where(
            Business.slug == slug,
            Business.is_active.is_(True),
        )
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    employee = db.scalar(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.business_id == business.id,
            Employee.is_active.is_(True),
        )
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    service = db.scalar(
        select(Service).where(
            Service.id == service_id,
            Service.business_id == business.id,
            Service.is_active.is_(True),
        )
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )

    employee_provides_service = db.scalar(
        select(employee_services.c.employee_id).where(
            employee_services.c.employee_id
            == employee.id,
            employee_services.c.service_id
            == service.id,
        )
    )

    if employee_provides_service is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee does not provide this service.",
        )

    slots = get_available_slots(
        db=db,
        business=business,
        employee=employee,
        service=service,
        target_date=target_date,
    )

    return {
        "date": target_date,
        "employee_id": str(employee.id),
        "service_id": str(service.id),
        "slots": slots,
    }


@router.post(
    "/{slug}/appointments",
    response_model=PublicAppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_public_appointment_endpoint(
    slug: str,
    data: PublicAppointmentCreateRequest,
    current_user: User | None = Depends(
        get_optional_current_user
    ),
    db: Session = Depends(get_db),
):
    business = db.scalar(
        select(Business).where(
            Business.slug == slug,
            Business.is_active.is_(True),
        )
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    try:
        appointment = create_public_appointment(
            db=db,
            business=business,
            data=data,
            current_user=current_user,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    employee_name = (
        appointment.employee.display_name
        or (
            f"{appointment.employee.first_name} "
            f"{appointment.employee.last_name}"
        )
    )

    return PublicAppointmentResponse(
        appointment_id=str(appointment.id),
        business_name=business.name,
        customer_name=appointment.customer.full_name,
        service_name=appointment.service.name,
        employee_name=employee_name,
        start_at=appointment.start_at,
        end_at=appointment.end_at,
        status=appointment.status.value,
    )