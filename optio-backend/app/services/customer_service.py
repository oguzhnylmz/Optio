import re
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.business import Business
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.service import Service
from app.schemas.customer import CustomerCreateRequest


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)

    if digits.startswith("00"):
        digits = digits[2:]

    if digits.startswith("90"):
        return f"+{digits}"

    if digits.startswith("0"):
        digits = digits[1:]

    return f"+90{digits}"


def get_customer_by_phone(
    db: Session,
    business: Business,
    phone: str,
) -> Customer | None:
    normalized_phone = normalize_phone(phone)

    return db.scalar(
        select(Customer).where(
            Customer.business_id == business.id,
            Customer.normalized_phone
            == normalized_phone,
        )
    )


def create_customer(
    db: Session,
    business: Business,
    data: CustomerCreateRequest,
) -> Customer:
    normalized_phone = normalize_phone(
        data.phone
    )

    existing_customer = get_customer_by_phone(
        db=db,
        business=business,
        phone=normalized_phone,
    )

    if existing_customer:
        raise ValueError(
            "A customer with this phone number already exists."
        )

    customer = Customer(
        business_id=business.id,
        full_name=data.full_name.strip(),
        phone=data.phone.strip(),
        normalized_phone=normalized_phone,
        email=(
            str(data.email)
            if data.email
            else None
        ),
        notes=(
            data.notes.strip()
            if data.notes
            else None
        ),
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


def get_customers(
    db: Session,
    business: Business,
) -> list[Customer]:
    return list(
        db.scalars(
            select(Customer)
            .where(
                Customer.business_id == business.id
            )
            .order_by(
                Customer.created_at.desc()
            )
        ).all()
    )


def get_customer(
    db: Session,
    business: Business,
    customer_id: UUID,
) -> Customer | None:
    return db.scalar(
        select(Customer).where(
            Customer.id == customer_id,
            Customer.business_id == business.id,
        )
    )


def update_customer(
    db: Session,
    business: Business,
    customer: Customer,
    data: dict,
) -> Customer:
    if "full_name" in data:
        customer.full_name = (
            data["full_name"].strip()
        )

    if "phone" in data:
        phone = data["phone"].strip()
        normalized_phone = normalize_phone(
            phone
        )

        existing_customer = db.scalar(
            select(Customer).where(
                Customer.business_id
                == business.id,
                Customer.normalized_phone
                == normalized_phone,
                Customer.id
                != customer.id,
            )
        )

        if existing_customer:
            raise ValueError(
                "A customer with this phone number already exists."
            )

        customer.phone = phone
        customer.normalized_phone = (
            normalized_phone
        )

    if "email" in data:
        customer.email = (
            str(data["email"])
            if data["email"]
            else None
        )

    if "notes" in data:
        customer.notes = (
            data["notes"].strip()
            if data["notes"]
            else None
        )

    db.commit()
    db.refresh(customer)

    return customer


def get_customer_appointments(
    db: Session,
    business: Business,
    customer: Customer,
) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment)
            .where(
                Appointment.business_id
                == business.id,
                Appointment.customer_id
                == customer.id,
            )
            .order_by(
                Appointment.start_at.desc()
            )
        ).all()
    )


def get_customer_appointments_for_user(
    db: Session,
    user_id,
) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment)
            .join(
                Customer,
                Appointment.customer_id
                == Customer.id,
            )
            .where(
                Customer.user_id == user_id
            )
            .order_by(
                Appointment.start_at.desc()
            )
        ).all()
    )


def get_customer_appointment_for_user(
    db: Session,
    user_id,
    appointment_id,
) -> Appointment | None:
    return db.scalar(
        select(Appointment)
        .join(
            Customer,
            Appointment.customer_id
            == Customer.id,
        )
        .where(
            Appointment.id == appointment_id,
            Customer.user_id == user_id,
        )
    )