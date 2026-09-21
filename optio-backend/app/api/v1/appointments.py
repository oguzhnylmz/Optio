from datetime import datetime, timezone
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

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.appointment import Appointment
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.enums import AppointmentStatus
from app.models.service import Service
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentResponse,
    AppointmentStatusUpdateRequest,
    AppointmentUpdateRequest,
)
from app.services.appointment_service import (
    _UNSET,
    create_appointment,
    get_appointment,
    get_appointments,
    update_appointment,
    update_appointment_status,
)
from app.services.business_service import get_owned_business


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


def _to_response(
    appointment: Appointment,
    customer: Customer | None = None,
    employee: Employee | None = None,
    service: Service | None = None,
) -> AppointmentResponse:
    employee_name = None

    if employee:
        employee_name = (
            employee.display_name
            or f"{employee.first_name} {employee.last_name}".strip()
        )

    return AppointmentResponse(
        id=str(appointment.id),
        business_id=str(appointment.business_id),
        customer_id=str(appointment.customer_id),
        employee_id=str(appointment.employee_id),
        service_id=str(appointment.service_id),
        start_at=appointment.start_at,
        end_at=appointment.end_at,
        status=appointment.status.value,
        customer_note=appointment.customer_note,
        internal_note=appointment.internal_note,
        customer_name=(
            customer.full_name
            if customer
            else None
        ),
        customer_phone=(
            customer.phone
            if customer
            else None
        ),
        customer_email=(
            customer.email
            if customer
            else None
        ),
        service_name=(
            service.name
            if service
            else None
        ),
        employee_name=employee_name,
    )


def _build_related_maps(
    db: Session,
    appointments: list[Appointment],
) -> tuple[
    dict[UUID, Customer],
    dict[UUID, Employee],
    dict[UUID, Service],
]:
    customer_ids = {
        appointment.customer_id
        for appointment in appointments
    }

    employee_ids = {
        appointment.employee_id
        for appointment in appointments
    }

    service_ids = {
        appointment.service_id
        for appointment in appointments
    }

    customers = {}

    if customer_ids:
        customers = {
            customer.id: customer
            for customer in db.scalars(
                select(Customer).where(
                    Customer.id.in_(customer_ids)
                )
            ).all()
        }

    employees = {}

    if employee_ids:
        employees = {
            employee.id: employee
            for employee in db.scalars(
                select(Employee).where(
                    Employee.id.in_(employee_ids)
                )
            ).all()
        }

    services = {}

    if service_ids:
        services = {
            service.id: service
            for service in db.scalars(
                select(Service).where(
                    Service.id.in_(service_ids)
                )
            ).all()
        }

    return (
        customers,
        employees,
        services,
    )


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_appointment_endpoint(
    data: AppointmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
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
        appointment = create_appointment(
            db=db,
            business=business,
            customer_id=UUID(
                data.customer_id
            ),
            employee_id=UUID(
                data.employee_id
            ),
            service_id=UUID(
                data.service_id
            ),
            start_at=data.start_at,
            customer_note=data.customer_note,
            internal_note=data.internal_note,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    customers, employees, services = (
        _build_related_maps(
            db=db,
            appointments=[appointment],
        )
    )

    return _to_response(
        appointment=appointment,
        customer=customers.get(
            appointment.customer_id
        ),
        employee=employees.get(
            appointment.employee_id
        ),
        service=services.get(
            appointment.service_id
        ),
    )


@router.get(
    "",
    response_model=list[AppointmentResponse],
)
def list_appointments(
    start_date: datetime | None = Query(
        default=None,
    ),
    end_date: datetime | None = Query(
        default=None,
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AppointmentResponse]:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    if start_date and start_date.tzinfo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must include timezone information.",
        )

    if end_date and end_date.tzinfo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must include timezone information.",
        )

    if (
        start_date
        and end_date
        and start_date >= end_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be earlier than end_date.",
        )

    appointments = get_appointments(
        db=db,
        business=business,
        start_date=(
            start_date.astimezone(
                timezone.utc
            )
            if start_date
            else None
        ),
        end_date=(
            end_date.astimezone(
                timezone.utc
            )
            if end_date
            else None
        ),
    )

    customers, employees, services = (
        _build_related_maps(
            db=db,
            appointments=appointments,
        )
    )

    return [
        _to_response(
            appointment=appointment,
            customer=customers.get(
                appointment.customer_id
            ),
            employee=employees.get(
                appointment.employee_id
            ),
            service=services.get(
                appointment.service_id
            ),
        )
        for appointment in appointments
    ]


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def get_appointment_endpoint(
    appointment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    appointment = get_appointment(
        db=db,
        business=business,
        appointment_id=appointment_id,
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    customers, employees, services = (
        _build_related_maps(
            db=db,
            appointments=[appointment],
        )
    )

    return _to_response(
        appointment=appointment,
        customer=customers.get(
            appointment.customer_id
        ),
        employee=employees.get(
            appointment.employee_id
        ),
        service=services.get(
            appointment.service_id
        ),
    )


@router.patch(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def update_appointment_endpoint(
    appointment_id: UUID,
    data: AppointmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    appointment = get_appointment(
        db=db,
        business=business,
        appointment_id=appointment_id,
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # ---------------------------------------------------------
    # Employee
    # ---------------------------------------------------------

    employee_id = None

    if "employee_id" in update_data:
        if update_data["employee_id"] is not None:
            try:
                employee_id = UUID(
                    update_data["employee_id"]
                )
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid employee ID.",
                ) from exc

    # ---------------------------------------------------------
    # Service
    # ---------------------------------------------------------

    service_id = None

    if "service_id" in update_data:
        if update_data["service_id"] is not None:
            try:
                service_id = UUID(
                    update_data["service_id"]
                )
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid service ID.",
                ) from exc

    # ---------------------------------------------------------
    # Notes
    # ---------------------------------------------------------

    customer_note = (
        update_data["customer_note"]
        if "customer_note" in update_data
        else _UNSET
    )

    internal_note = (
        update_data["internal_note"]
        if "internal_note" in update_data
        else _UNSET
    )

    try:
        appointment = update_appointment(
            db=db,
            business=business,
            appointment=appointment,
            employee_id=employee_id,
            service_id=service_id,
            start_at=update_data.get(
                "start_at"
            ),
            customer_note=customer_note,
            internal_note=internal_note,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    customers, employees, services = (
        _build_related_maps(
            db=db,
            appointments=[appointment],
        )
    )

    return _to_response(
        appointment=appointment,
        customer=customers.get(
            appointment.customer_id
        ),
        employee=employees.get(
            appointment.employee_id
        ),
        service=services.get(
            appointment.service_id
        ),
    )


@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
)
def update_appointment_status_endpoint(
    appointment_id: UUID,
    data: AppointmentStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    appointment = get_appointment(
        db=db,
        business=business,
        appointment_id=appointment_id,
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    try:
        appointment = update_appointment_status(
            db=db,
            appointment=appointment,
            new_status=AppointmentStatus(
                data.status.value
            ),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    customers, employees, services = (
        _build_related_maps(
            db=db,
            appointments=[appointment],
        )
    )

    return _to_response(
        appointment=appointment,
        customer=customers.get(
            appointment.customer_id
        ),
        employee=employees.get(
            appointment.employee_id
        ),
        service=services.get(
            appointment.service_id
        ),
    )