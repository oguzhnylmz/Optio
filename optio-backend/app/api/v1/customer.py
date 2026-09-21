from datetime import datetime, timezone
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_customer_user,
)
from app.db.database import get_db
from app.models.enums import AppointmentStatus
from app.models.user import User
from app.schemas.appointment import AppointmentResponse
from app.services.appointment_service import (
    update_appointment_status,
)
from app.services.customer_service import (
    get_customer_appointment_for_user,
    get_customer_appointments_for_user,
)


router = APIRouter(
    prefix="/customer",
    tags=["Customer"],
)


def _to_appointment_response(
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
        internal_note=None,
    )


# =========================================================
# CUSTOMER APPOINTMENTS
# =========================================================

@router.get(
    "/appointments",
    response_model=list[AppointmentResponse],
)
def list_my_appointments(
    current_user: User = Depends(
        get_current_customer_user
    ),
    db: Session = Depends(get_db),
) -> list[AppointmentResponse]:
    appointments = (
        get_customer_appointments_for_user(
            db=db,
            user_id=current_user.id,
        )
    )

    return [
        _to_appointment_response(
            appointment
        )
        for appointment in appointments
    ]


# =========================================================
# GET SINGLE APPOINTMENT
# =========================================================

@router.get(
    "/appointments/{appointment_id}",
    response_model=AppointmentResponse,
)
def get_my_appointment(
    appointment_id: UUID,
    current_user: User = Depends(
        get_current_customer_user
    ),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    appointment = (
        get_customer_appointment_for_user(
            db=db,
            user_id=current_user.id,
            appointment_id=appointment_id,
        )
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    return _to_appointment_response(
        appointment
    )


# =========================================================
# CANCEL APPOINTMENT
# =========================================================

@router.patch(
    "/appointments/{appointment_id}/cancel",
    response_model=AppointmentResponse,
)
def cancel_my_appointment(
    appointment_id: UUID,
    current_user: User = Depends(
        get_current_customer_user
    ),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    appointment = (
        get_customer_appointment_for_user(
            db=db,
            user_id=current_user.id,
            appointment_id=appointment_id,
        )
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    if appointment.status not in {
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This appointment cannot be cancelled.",
        )

    if appointment.start_at <= datetime.now(
        timezone.utc
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Past appointments cannot be cancelled.",
        )

    try:
        appointment = update_appointment_status(
            db=db,
            appointment=appointment,
            new_status=AppointmentStatus.CANCELLED,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_appointment_response(
        appointment
    )