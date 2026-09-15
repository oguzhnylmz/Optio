from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_customer
from app.db.database import get_db
from app.models.customer import Customer
from app.schemas.appointment import AppointmentResponse
from app.services.customer_service import (
    get_customer_appointment,
    get_customer_appointments,
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
    current_customer: Customer = Depends(
        get_current_customer
    ),
    db: Session = Depends(get_db),
) -> list[AppointmentResponse]:
    appointments = get_customer_appointments(
        db=db,
        customer=current_customer,
    )

    return [
        _to_appointment_response(appointment)
        for appointment in appointments
    ]


@router.get(
    "/appointments/{appointment_id}",
    response_model=AppointmentResponse,
)
def get_my_appointment(
    appointment_id: UUID,
    current_customer: Customer = Depends(
        get_current_customer
    ),
    db: Session = Depends(get_db),
) -> AppointmentResponse:
    appointment = get_customer_appointment(
        db=db,
        customer=current_customer,
        appointment_id=appointment_id,
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found.",
        )

    return _to_appointment_response(appointment)