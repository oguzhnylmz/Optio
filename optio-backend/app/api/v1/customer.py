from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_customer_user,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.appointment import AppointmentResponse
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
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    return _to_appointment_response(
        appointment
    )