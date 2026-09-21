import re
import unicodedata
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.business import Business
from app.models.user import User
from app.schemas.business import (
    AdminBusinessUpdateRequest,
    BusinessCreateRequest,
    BusinessUpdateRequest,
)


def generate_slug(name: str) -> str:
    normalized = unicodedata.normalize(
        "NFKD",
        name,
    )

    ascii_name = normalized.encode(
        "ascii",
        "ignore",
    ).decode("ascii")

    slug = re.sub(
        r"[^a-zA-Z0-9]+",
        "-",
        ascii_name,
    )

    slug = slug.strip("-").lower()

    return slug


def get_unique_slug(
    db: Session,
    base_slug: str,
) -> str:
    slug = base_slug
    counter = 2

    while db.scalar(
        select(Business).where(
            Business.slug == slug,
        )
    ):
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def create_business(
    db: Session,
    owner: User,
    data: BusinessCreateRequest,
) -> Business:
    base_slug = generate_slug(
        data.name,
    )

    if not base_slug:
        raise ValueError(
            "Business name cannot generate a valid slug."
        )

    slug = get_unique_slug(
        db,
        base_slug,
    )

    business = Business(
        owner_id=owner.id,
        name=data.name,
        slug=slug,
        description=data.description,
        phone=data.phone,
        email=data.email,
        address=data.address,
        city=data.city,
    )

    db.add(business)
    db.commit()
    db.refresh(business)

    return business


def get_owned_business(
    db: Session,
    owner_id: UUID,
) -> Business | None:
    return db.scalar(
        select(Business).where(
            Business.owner_id == owner_id,
        )
    )


def get_business_by_id(
    db: Session,
    business_id: UUID,
) -> Business | None:
    return db.scalar(
        select(Business)
        .options(
            selectinload(Business.owner),
        )
        .where(
            Business.id == business_id,
        )
    )


def list_businesses(
    db: Session,
    search: str | None = None,
    is_active: bool | None = None,
) -> list[Business]:
    query = (
        select(Business)
        .options(
            selectinload(Business.owner),
        )
        .order_by(
            Business.created_at.desc(),
        )
    )

    if search:
        search_value = (
            f"%{search.strip()}%"
        )

        query = query.where(
            Business.name.ilike(search_value)
            | Business.slug.ilike(search_value),
        )

    if is_active is not None:
        query = query.where(
            Business.is_active.is_(
                is_active,
            ),
        )

    return list(
        db.scalars(query).all()
    )


def update_business(
    db: Session,
    business: Business,
    data: (
        BusinessUpdateRequest
        | AdminBusinessUpdateRequest
    ),
) -> Business:
    updates = data.model_dump(
        exclude_unset=True,
    )

    if "name" in updates:
        new_name = updates["name"]

        if new_name is None:
            raise ValueError(
                "Business name cannot be empty."
            )

        new_name = new_name.strip()

        if len(new_name) < 2:
            raise ValueError(
                "Business name must be at least 2 characters."
            )

        updates["name"] = new_name

    if "country" in updates:
        country = updates["country"]

        if country is not None:
            country = country.strip()

            if not country:
                raise ValueError(
                    "Country cannot be empty."
                )

            updates["country"] = country

    if "timezone" in updates:
        timezone = updates["timezone"]

        if timezone is not None:
            timezone = timezone.strip()

            if not timezone:
                raise ValueError(
                    "Timezone cannot be empty."
                )

            updates["timezone"] = timezone

    if "phone" in updates:
        phone = updates["phone"]

        if phone is not None:
            updates["phone"] = phone.strip() or None

    if "address" in updates:
        address = updates["address"]

        if address is not None:
            updates["address"] = (
                address.strip() or None
            )

    if "city" in updates:
        city = updates["city"]

        if city is not None:
            updates["city"] = (
                city.strip() or None
            )

    if "description" in updates:
        description = updates[
            "description"
        ]

        if description is not None:
            updates["description"] = (
                description.strip() or None
            )

    if "logo_url" in updates:
        logo_url = updates["logo_url"]

        if logo_url is not None:
            updates["logo_url"] = (
                logo_url.strip() or None
            )

    for field, value in updates.items():
        setattr(
            business,
            field,
            value,
        )

    db.commit()
    db.refresh(business)

    return business