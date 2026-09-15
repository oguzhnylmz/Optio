import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.customer import Customer
from app.models.appointment import Appointment
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
            Customer.normalized_phone == normalized_phone,
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
        full_name=data.full_name,
        phone=data.phone,
        normalized_phone=normalized_phone,
        email=data.email,
        notes=data.notes,
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
            .order_by(Customer.created_at.desc())
        ).all()
    )


def get_customer_appointments(
    db: Session,
    customer: Customer,
) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment)
            .where(
                Appointment.customer_id == customer.id
            )
            .order_by(
                Appointment.start_at.desc()
            )
        ).all()
    )


def get_customer_appointment(
    db: Session,
    customer: Customer,
    appointment_id,
) -> Appointment | None:
    return db.scalar(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.customer_id == customer.id,
        )
    )