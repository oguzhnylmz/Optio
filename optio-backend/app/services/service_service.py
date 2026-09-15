from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.service import Service
from app.schemas.service import (
    ServiceCreateRequest,
    ServiceUpdateRequest,
)


def create_service(
    db: Session,
    business: Business,
    data: ServiceCreateRequest,
) -> Service:
    service = Service(
        business_id=business.id,
        name=data.name,
        description=data.description,
        duration_minutes=data.duration_minutes,
        price=data.price,
        currency=data.currency.upper(),
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return service


def get_services(
    db: Session,
    business: Business,
) -> list[Service]:
    return list(
        db.scalars(
            select(Service)
            .where(Service.business_id == business.id)
            .order_by(Service.created_at.desc())
        ).all()
    )


def get_service(
    db: Session,
    business: Business,
    service_id: UUID,
) -> Service | None:
    return db.scalar(
        select(Service).where(
            Service.id == service_id,
            Service.business_id == business.id,
        )
    )


def update_service(
    db: Session,
    service: Service,
    data: ServiceUpdateRequest,
) -> Service:
    updates = data.model_dump(
        exclude_unset=True,
    )

    if "currency" in updates and updates["currency"]:
        updates["currency"] = updates["currency"].upper()

    for field, value in updates.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    return service