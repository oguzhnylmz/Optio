from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.enums import AppointmentStatus
from app.models.service import Service
from app.models.user import User
from app.schemas.customer import CustomerCreateRequest
from app.services.business_service import get_owned_business
from app.services.customer_service import (
    create_customer,
    get_customer,
    get_customer_appointments,
    get_customers,
    update_customer,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


# =========================================================
# RESPONSE SCHEMAS
# =========================================================

class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID
    user_id: UUID | None
    full_name: str
    phone: str
    email: str | None
    notes: str | None


class CustomerUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class CustomerAppointmentResponse(BaseModel):
    id: UUID
    service_name: str | None
    employee_name: str | None
    start_at: object
    end_at: object
    status: str


# =========================================================
# HELPERS
# =========================================================

def _to_customer_response(
    customer: Customer,
) -> CustomerResponse:
    return CustomerResponse(
        id=customer.id,
        business_id=customer.business_id,
        user_id=customer.user_id,
        full_name=customer.full_name,
        phone=customer.phone,
        email=customer.email,
        notes=customer.notes,
    )


def _to_customer_appointment_responses(
    db: Session,
    appointments: list[Appointment],
) -> list[CustomerAppointmentResponse]:
    if not appointments:
        return []

    service_ids = {
        appointment.service_id
        for appointment in appointments
    }

    employee_ids = {
        appointment.employee_id
        for appointment in appointments
    }

    services = {
        service.id: service
        for service in db.scalars(
            select(Service).where(
                Service.id.in_(service_ids)
            )
        ).all()
    }

    employees = {
        employee.id: employee
        for employee in db.scalars(
            select(Employee).where(
                Employee.id.in_(employee_ids)
            )
        ).all()
    }

    responses: list[CustomerAppointmentResponse] = []

    for appointment in appointments:
        employee = employees.get(
            appointment.employee_id
        )

        employee_name = None

        if employee:
            employee_name = (
                employee.display_name
                or (
                    f"{employee.first_name} "
                    f"{employee.last_name}"
                ).strip()
            )

        service = services.get(
            appointment.service_id
        )

        responses.append(
            CustomerAppointmentResponse(
                id=appointment.id,
                service_name=(
                    service.name
                    if service
                    else None
                ),
                employee_name=employee_name,
                start_at=appointment.start_at,
                end_at=appointment.end_at,
                status=appointment.status.value,
            )
        )

    return responses


# =========================================================
# LIST CUSTOMERS
# =========================================================

@router.get(
    "",
    response_model=list[CustomerResponse],
)
def list_customers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CustomerResponse]:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    customers = get_customers(
        db=db,
        business=business,
    )

    return [
        _to_customer_response(customer)
        for customer in customers
    ]


# =========================================================
# CREATE CUSTOMER
# =========================================================

@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_endpoint(
    data: CustomerCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    try:
        customer = create_customer(
            db=db,
            business=business,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_customer_response(customer)


# =========================================================
# GET CUSTOMER
# =========================================================

@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer_endpoint(
    customer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    customer = get_customer(
        db=db,
        business=business,
        customer_id=customer_id,
    )

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return _to_customer_response(customer)


# =========================================================
# UPDATE CUSTOMER
# =========================================================

@router.patch(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer_endpoint(
    customer_id: UUID,
    data: CustomerUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    customer = get_customer(
        db=db,
        business=business,
        customer_id=customer_id,
    )

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    try:
        customer = update_customer(
            db=db,
            business=business,
            customer=customer,
            data=update_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_customer_response(customer)


# =========================================================
# CUSTOMER APPOINTMENTS
# =========================================================

@router.get(
    "/{customer_id}/appointments",
    response_model=list[CustomerAppointmentResponse],
)
def list_customer_appointments(
    customer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CustomerAppointmentResponse]:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    customer = get_customer(
        db=db,
        business=business,
        customer_id=customer_id,
    )

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    appointments = get_customer_appointments(
        db=db,
        business=business,
        customer=customer,
    )

    return _to_customer_appointment_responses(
        db=db,
        appointments=appointments,
    )