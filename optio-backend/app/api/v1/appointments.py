from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.enums import AppointmentStatus
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentResponse,
    AppointmentStatusUpdateRequest,
)
from app.services.appointment_service import (
    create_appointment,
    get_appointment,
    get_appointments,
    update_appointment_status,
)
from app.services.business_service import get_owned_business


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


def _to_response(
    appointment,
) -> AppointmentResponse:
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
            customer_id=UUID(data.customer_id),
            employee_id=UUID(data.employee_id),
            service_id=UUID(data.service_id),
            start_at=data.start_at,
            customer_note=data.customer_note,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_response(appointment)


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

    if start_date and end_date and start_date >= end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be earlier than end_date.",
        )

    appointments = get_appointments(
        db=db,
        business=business,
        start_date=(
            start_date.astimezone(timezone.utc)
            if start_date
            else None
        ),
        end_date=(
            end_date.astimezone(timezone.utc)
            if end_date
            else None
        ),
    )

    return [
        _to_response(appointment)
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

    return _to_response(appointment)


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
            new_status=AppointmentStatus(data.status.value),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_response(appointment)