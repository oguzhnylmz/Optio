from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.business import Business
from app.models.business_hour import BusinessHour
from app.models.employee import Employee
from app.models.employee_availability import EmployeeAvailability
from app.models.service import Service
from app.models.enums import AppointmentStatus


BOOKING_INTERVAL_MINUTES = 15

BLOCKING_APPOINTMENT_STATUSES = {
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
}


def _merge_intervals(
    intervals: list[tuple[time, time]],
) -> list[tuple[time, time]]:
    if not intervals:
        return []

    sorted_intervals = sorted(
        intervals,
        key=lambda item: item[0],
    )

    merged: list[list[time]] = [
        [sorted_intervals[0][0], sorted_intervals[0][1]]
    ]

    for start, end in sorted_intervals[1:]:
        last_start, last_end = merged[-1]

        if start <= last_end:
            if end > last_end:
                merged[-1][1] = end
        else:
            merged.append([start, end])

    return [
        (start, end)
        for start, end in merged
    ]


def _intersect_intervals(
    first: list[tuple[time, time]],
    second: list[tuple[time, time]],
) -> list[tuple[time, time]]:
    intersections: list[tuple[time, time]] = []

    for first_start, first_end in first:
        for second_start, second_end in second:
            start = max(first_start, second_start)
            end = min(first_end, second_end)

            if start < end:
                intersections.append((start, end))

    return _merge_intervals(intersections)


def _get_business_intervals(
    db: Session,
    business: Business,
    day_of_week: int,
) -> list[tuple[time, time]]:
    hours = list(
        db.scalars(
            select(BusinessHour)
            .where(
                BusinessHour.business_id == business.id,
                BusinessHour.day_of_week == day_of_week,
            )
            .order_by(BusinessHour.start_time)
        ).all()
    )

    return [
        (hour.start_time, hour.end_time)
        for hour in hours
    ]


def _get_employee_intervals(
    db: Session,
    employee: Employee,
    day_of_week: int,
) -> list[tuple[time, time]]:
    availability = list(
        db.scalars(
            select(EmployeeAvailability)
            .where(
                EmployeeAvailability.employee_id == employee.id,
                EmployeeAvailability.day_of_week == day_of_week,
            )
            .order_by(EmployeeAvailability.start_time)
        ).all()
    )

    return [
        (
            item.start_time,
            item.end_time,
        )
        for item in availability
    ]


def _get_blocking_appointments(
    db: Session,
    business: Business,
    employee: Employee,
    target_date: date,
) -> list[Appointment]:
    timezone = ZoneInfo(business.timezone)

    day_start = datetime.combine(
        target_date,
        time.min,
        tzinfo=timezone,
    )

    day_end = day_start + timedelta(days=1)

    return list(
        db.scalars(
            select(Appointment)
            .where(
                Appointment.business_id == business.id,
                Appointment.employee_id == employee.id,
                Appointment.status.in_(
                    BLOCKING_APPOINTMENT_STATUSES
                ),
                Appointment.start_at < day_end,
                Appointment.end_at > day_start,
            )
            .order_by(Appointment.start_at)
        ).all()
    )


def get_available_slots(
    db: Session,
    business: Business,
    employee: Employee,
    service: Service,
    target_date: date,
) -> list[time]:
    if employee.business_id != business.id:
        raise ValueError(
            "Employee does not belong to this business."
        )

    if service.business_id != business.id:
        raise ValueError(
            "Service does not belong to this business."
        )

    if not service.is_active:
        raise ValueError(
            "Service is inactive."
        )

    day_of_week = target_date.weekday()

    business_intervals = _get_business_intervals(
        db=db,
        business=business,
        day_of_week=day_of_week,
    )

    employee_intervals = _get_employee_intervals(
        db=db,
        employee=employee,
        day_of_week=day_of_week,
    )

    business_intervals = _merge_intervals(
        business_intervals
    )

    employee_intervals = _merge_intervals(
        employee_intervals
    )

    working_intervals = _intersect_intervals(
        business_intervals,
        employee_intervals,
    )

    if not working_intervals:
        return []

    appointments = _get_blocking_appointments(
        db=db,
        business=business,
        employee=employee,
        target_date=target_date,
    )

    timezone = ZoneInfo(business.timezone)

    now = datetime.now(timezone)

    service_duration = timedelta(
        minutes=service.duration_minutes
    )

    slots: list[time] = []

    for interval_start, interval_end in working_intervals:
        current_start = datetime.combine(
            target_date,
            interval_start,
            tzinfo=timezone,
        )

        interval_end_datetime = datetime.combine(
            target_date,
            interval_end,
            tzinfo=timezone,
        )

        while (
            current_start + service_duration
            <= interval_end_datetime
        ):
            current_end = current_start + service_duration

            if target_date == now.date() and current_start <= now:
                current_start += timedelta(
                    minutes=BOOKING_INTERVAL_MINUTES
                )
                continue

            has_conflict = any(
                appointment.start_at < current_end
                and appointment.end_at > current_start
                for appointment in appointments
            )

            if not has_conflict:
                slots.append(current_start.time())

            current_start += timedelta(
                minutes=BOOKING_INTERVAL_MINUTES
            )

    return slots