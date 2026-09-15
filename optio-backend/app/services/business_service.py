import re
import unicodedata
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.user import User
from app.schemas.business import BusinessCreateRequest


def generate_slug(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")

    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_name)
    slug = slug.strip("-").lower()

    return slug


def get_unique_slug(
    db: Session,
    base_slug: str,
) -> str:
    slug = base_slug
    counter = 2

    while db.scalar(
        select(Business).where(Business.slug == slug)
    ):
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def create_business(
    db: Session,
    owner: User,
    data: BusinessCreateRequest,
) -> Business:
    base_slug = generate_slug(data.name)

    if not base_slug:
        raise ValueError("Business name cannot generate a valid slug.")

    slug = get_unique_slug(db, base_slug)

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
    owner_id,
) -> Business | None:
    return db.scalar(
        select(Business).where(
            Business.owner_id == owner_id
        )
    )