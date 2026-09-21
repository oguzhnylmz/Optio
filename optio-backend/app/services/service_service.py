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
        name=data.name.strip(),
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        duration_minutes=data.duration_minutes,
        price=data.price,
        currency=data.currency.upper(),
        is_active=True,
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
            .where(
                Service.business_id == business.id
            )
            .order_by(
                Service.is_active.desc(),
                Service.created_at.desc(),
            )
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

    if "name" in updates and updates["name"]:
        updates["name"] = updates["name"].strip()

    if "description" in updates:
        if updates["description"]:
            updates["description"] = (
                updates["description"].strip()
            )

    if "currency" in updates and updates["currency"]:
        updates["currency"] = (
            updates["currency"].upper()
        )

    for field, value in updates.items():
        setattr(
            service,
            field,
            value,
        )

    db.commit()
    db.refresh(service)

    return service


def delete_service(
    db: Session,
    service: Service,
) -> Service:
    """
    Hizmeti fiziksel olarak silmek yerine
    pasifleştirir.

    Böylece geçmiş randevulardaki service_id
    ve hizmet kayıtları korunur.
    """
    service.is_active = False

    db.commit()
    db.refresh(service)

    return service