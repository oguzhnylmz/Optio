from datetime import datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.business import Business
from app.models.business_hour import BusinessHour
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.employee_availability import EmployeeAvailability
from app.models.employee_service import employee_services
from app.models.enums import AppointmentStatus
from app.models.service import Service
from app.models.user import User
from app.schemas.appointment import PublicAppointmentCreateRequest
from app.services.customer_service import normalize_phone


BLOCKING_APPOINTMENT_STATUSES = {
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
}


def _time_range_contains(
    range_start,
    range_end,
    requested_start,
    requested_end,
) -> bool:
    return (
        range_start <= requested_start
        and requested_end <= range_end
    )


def _is_employee_available(
    db: Session,
    business: Business,
    employee: Employee,
    start_at: datetime,
    end_at: datetime,
) -> bool:
    business_timezone = ZoneInfo(
        business.timezone
    )

    local_start = start_at.astimezone(
        business_timezone
    )

    local_end = end_at.astimezone(
        business_timezone
    )

    if local_start.date() != local_end.date():
        return False

    day_of_week = local_start.weekday()

    business_hours = list(
        db.scalars(
            select(BusinessHour).where(
                BusinessHour.business_id == business.id,
                BusinessHour.day_of_week == day_of_week,
            )
        ).all()
    )

    employee_availability = list(
        db.scalars(
            select(EmployeeAvailability).where(
                EmployeeAvailability.employee_id
                == employee.id,
                EmployeeAvailability.day_of_week
                == day_of_week,
            )
        ).all()
    )

    if not business_hours or not employee_availability:
        return False

    for business_hour in business_hours:
        if not _time_range_contains(
            business_hour.start_time,
            business_hour.end_time,
            local_start.time(),
            local_end.time(),
        ):
            continue

        for availability in employee_availability:
            if _time_range_contains(
                availability.start_time,
                availability.end_time,
                local_start.time(),
                local_end.time(),
            ):
                return True

    return False


def get_or_create_public_customer(
    db: Session,
    business: Business,
    data: PublicAppointmentCreateRequest,
    current_user: User | None = None,
) -> Customer:
    normalized_phone = normalize_phone(
        data.phone
    )

    # ---------------------------------------------------------
    # 1. Registered user already linked to this business
    # ---------------------------------------------------------

    if current_user is not None:
        customer = db.scalar(
            select(Customer).where(
                Customer.business_id == business.id,
                Customer.user_id == current_user.id,
            )
        )

        if customer:
            customer.full_name = data.full_name
            customer.phone = data.phone

            if data.email is not None:
                customer.email = data.email

            if data.customer_note is not None:
                customer.notes = data.customer_note

            db.flush()

            return customer

    # ---------------------------------------------------------
    # 2. Try existing customer by phone
    # ---------------------------------------------------------

    customer = db.scalar(
        select(Customer).where(
            Customer.business_id == business.id,
            Customer.normalized_phone == normalized_phone,
        )
    )

    if customer:
        # Guest → registered customer conversion
        if (
            current_user is not None
            and customer.user_id is None
        ):
            customer.user_id = current_user.id

        customer.full_name = data.full_name
        customer.phone = data.phone

        if data.email is not None:
            customer.email = data.email

        if data.customer_note is not None:
            customer.notes = data.customer_note

        db.flush()

        return customer

    # ---------------------------------------------------------
    # 3. Create a new customer
    # ---------------------------------------------------------

    customer = Customer(
        business_id=business.id,
        user_id=(
            current_user.id
            if current_user is not None
            else None
        ),
        full_name=data.full_name,
        phone=data.phone,
        normalized_phone=normalized_phone,
        email=data.email,
        notes=data.customer_note,
    )

    db.add(customer)
    db.flush()

    return customer


def create_appointment(
    db: Session,
    business: Business,
    customer_id: UUID,
    employee_id: UUID,
    service_id: UUID,
    start_at: datetime,
    customer_note: str | None = None,
) -> Appointment:
    if start_at.tzinfo is None:
        raise ValueError(
            "Appointment start time must include timezone information."
        )

    start_at = start_at.astimezone(
        timezone.utc
    )

    if start_at <= datetime.now(timezone.utc):
        raise ValueError(
            "Appointment start time must be in the future."
        )

    customer = db.scalar(
        select(Customer).where(
            Customer.id == customer_id,
            Customer.business_id == business.id,
        )
    )

    if not customer:
        raise ValueError(
            "Customer not found."
        )

    employee = db.scalar(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.business_id == business.id,
            Employee.is_active.is_(True),
        )
    )

    if not employee:
        raise ValueError(
            "Employee not found."
        )

    service = db.scalar(
        select(Service).where(
            Service.id == service_id,
            Service.business_id == business.id,
            Service.is_active.is_(True),
        )
    )

    if not service:
        raise ValueError(
            "Service not found."
        )

    employee_has_service = db.scalar(
        select(employee_services.c.employee_id).where(
            employee_services.c.employee_id == employee.id,
            employee_services.c.service_id == service.id,
        )
    )

    if employee_has_service is None:
        raise ValueError(
            "Employee does not provide this service."
        )

    end_at = start_at + timedelta(
        minutes=service.duration_minutes
    )

    if not _is_employee_available(
        db=db,
        business=business,
        employee=employee,
        start_at=start_at,
        end_at=end_at,
    ):
        raise ValueError(
            "The selected time is outside the employee's availability."
        )

    conflicting_appointment = db.scalar(
        select(Appointment).where(
            Appointment.business_id == business.id,
            Appointment.employee_id == employee.id,
            Appointment.status.in_(
                BLOCKING_APPOINTMENT_STATUSES
            ),
            Appointment.start_at < end_at,
            Appointment.end_at > start_at,
        )
    )

    if conflicting_appointment:
        raise ValueError(
            "The selected time slot is no longer available."
        )

    appointment = Appointment(
        business_id=business.id,
        customer_id=customer.id,
        employee_id=employee.id,
        service_id=service.id,
        start_at=start_at,
        end_at=end_at,
        status=AppointmentStatus.PENDING,
        customer_note=customer_note,
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment


def create_public_appointment(
    db: Session,
    business: Business,
    data: PublicAppointmentCreateRequest,
    current_user: User | None = None,
) -> Appointment:
    try:
        employee_id = UUID(data.employee_id)
        service_id = UUID(data.service_id)
    except ValueError as exc:
        raise ValueError(
            "Invalid employee or service ID."
        ) from exc

    employee = db.scalar(
        select(Employee).where(
            Employee.id == employee_id,
            Employee.business_id == business.id,
            Employee.is_active.is_(True),
        )
    )

    if not employee:
        raise ValueError(
            "Employee not found."
        )

    service = db.scalar(
        select(Service).where(
            Service.id == service_id,
            Service.business_id == business.id,
            Service.is_active.is_(True),
        )
    )

    if not service:
        raise ValueError(
            "Service not found."
        )

    employee_has_service = db.scalar(
        select(employee_services.c.employee_id).where(
            employee_services.c.employee_id
            == employee.id,
            employee_services.c.service_id
            == service.id,
        )
    )

    if employee_has_service is None:
        raise ValueError(
            "Employee does not provide this service."
        )

    customer = get_or_create_public_customer(
        db=db,
        business=business,
        data=data,
        current_user=current_user,
    )

    try:
        return create_appointment(
            db=db,
            business=business,
            customer_id=customer.id,
            employee_id=employee.id,
            service_id=service.id,
            start_at=data.start_at,
            customer_note=data.customer_note,
        )

    except ValueError:
        db.rollback()
        raise


def get_appointments(
    db: Session,
    business: Business,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> list[Appointment]:
    query = select(Appointment).where(
        Appointment.business_id == business.id,
    )

    if start_date is not None:
        query = query.where(
            Appointment.start_at >= start_date
        )

    if end_date is not None:
        query = query.where(
            Appointment.start_at < end_date
        )

    query = query.order_by(
        Appointment.start_at.asc()
    )

    return list(
        db.scalars(query).all()
    )


def get_appointment(
    db: Session,
    business: Business,
    appointment_id: UUID,
) -> Appointment | None:
    return db.scalar(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.business_id == business.id,
        )
    )


def update_appointment_status(
    db: Session,
    appointment: Appointment,
    new_status: AppointmentStatus,
) -> Appointment:
    current_status = appointment.status

    allowed_transitions = {
        AppointmentStatus.PENDING: {
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
        },
        AppointmentStatus.CONFIRMED: {
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.NO_SHOW,
        },
        AppointmentStatus.COMPLETED: set(),
        AppointmentStatus.CANCELLED: set(),
        AppointmentStatus.NO_SHOW: set(),
    }

    if new_status == current_status:
        raise ValueError(
            "Appointment is already in this status."
        )

    if new_status not in allowed_transitions[current_status]:
        raise ValueError(
            f"Cannot change appointment status from "
            f"{current_status.value} to {new_status.value}."
        )

    appointment.status = new_status

    db.commit()
    db.refresh(appointment)

    return appointment