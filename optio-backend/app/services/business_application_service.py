from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.business import Business
from app.models.business_application import (
    BusinessApplication,
    BusinessApplicationStatus,
)
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.business_application import (
    BusinessApplicationCreateRequest,
)


def create_business_application(
    db: Session,
    data: BusinessApplicationCreateRequest,
) -> BusinessApplication:
    email = str(data.email).strip().lower()

    existing_user = db.scalar(
        select(User).where(
            func.lower(User.email) == email
        )
    )

    if existing_user and existing_user.role == UserRole.OWNER:
        raise ValueError(
            "An owner account already exists with this email."
        )

    pending_application = db.scalar(
        select(BusinessApplication).where(
            func.lower(BusinessApplication.email) == email,
            BusinessApplication.status
            == BusinessApplicationStatus.PENDING,
        )
    )

    if pending_application:
        raise ValueError(
            "There is already a pending application with this email."
        )

    application = BusinessApplication(
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        phone=data.phone.strip(),
        business_name=data.business_name.strip(),
        business_type=(
            data.business_type.strip()
            if data.business_type
            else None
        ),
        business_phone=(
            data.business_phone.strip()
            if data.business_phone
            else None
        ),
        business_email=(
            str(data.business_email).strip().lower()
            if data.business_email
            else None
        ),
        city=data.city.strip(),
        district=(
            data.district.strip()
            if data.district
            else None
        ),
        address=(
            data.address.strip()
            if data.address
            else None
        ),
        website=(
            data.website.strip()
            if data.website
            else None
        ),
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        status=BusinessApplicationStatus.PENDING,
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


def get_business_application(
    db: Session,
    application_id: UUID,
) -> BusinessApplication | None:
    return db.scalar(
        select(BusinessApplication).where(
            BusinessApplication.id == application_id
        )
    )


def list_business_applications(
    db: Session,
    status_filter: BusinessApplicationStatus | None = None,
) -> list[BusinessApplication]:
    query = select(BusinessApplication).order_by(
        BusinessApplication.created_at.desc()
    )

    if status_filter is not None:
        query = query.where(
            BusinessApplication.status == status_filter
        )

    return list(
        db.scalars(query).all()
    )


def approve_business_application(
    db: Session,
    application_id: UUID,
    reviewer_id: UUID,
) -> BusinessApplication:
    application = get_business_application(
        db,
        application_id,
    )

    if not application:
        raise ValueError(
            "Business application not found."
        )

    if application.status != BusinessApplicationStatus.PENDING:
        raise ValueError(
            "Only pending applications can be approved."
        )

    email = application.email.strip().lower()

    existing_user = db.scalar(
        select(User).where(
            func.lower(User.email) == email
        )
    )

    if existing_user:
        if existing_user.role == UserRole.OWNER:
            raise ValueError(
                "This email already belongs to an owner account."
            )

        existing_business = db.scalar(
            select(Business).where(
                Business.owner_id == existing_user.id
            )
        )

        if existing_business:
            raise ValueError(
                "This user already owns a business."
            )

        user = existing_user

        user.role = UserRole.OWNER
        user.password_hash = application.password_hash
        user.first_name = application.first_name
        user.last_name = application.last_name
        user.phone = application.phone
        user.is_active = True

    else:
        user = User(
            email=email,
            password_hash=application.password_hash,
            first_name=application.first_name,
            last_name=application.last_name,
            phone=application.phone,
            role=UserRole.OWNER,
            is_active=True,
            is_admin=False,
        )

        db.add(user)
        db.flush()

    base_slug = generate_business_slug(
        application.business_name
    )

    if not base_slug:
        raise ValueError(
            "Business name cannot generate a valid slug."
        )

    slug = get_unique_business_slug(
        db,
        base_slug,
    )

    business = Business(
        owner_id=user.id,
        name=application.business_name,
        slug=slug,
        description=application.description,
        phone=(
            application.business_phone
            or application.phone
        ),
        email=(
            application.business_email
            or application.email
        ),
        address=application.address,
        city=application.city,
        country="Turkey",
        timezone="Europe/Istanbul",
        is_active=True,
    )

    db.add(business)

    application.status = BusinessApplicationStatus.APPROVED
    application.reviewed_at = datetime.now(timezone.utc)
    application.reviewed_by = reviewer_id
    application.rejection_reason = None

    db.commit()
    db.refresh(application)

    return application


def reject_business_application(
    db: Session,
    application_id: UUID,
    reviewer_id: UUID,
    rejection_reason: str,
) -> BusinessApplication:
    application = get_business_application(
        db,
        application_id,
    )

    if not application:
        raise ValueError(
            "Business application not found."
        )

    if application.status != BusinessApplicationStatus.PENDING:
        raise ValueError(
            "Only pending applications can be rejected."
        )

    reason = rejection_reason.strip()

    if not reason:
        raise ValueError(
            "Rejection reason cannot be empty."
        )

    application.status = BusinessApplicationStatus.REJECTED
    application.rejection_reason = reason
    application.reviewed_at = datetime.now(timezone.utc)
    application.reviewed_by = reviewer_id

    db.commit()
    db.refresh(application)

    return application


def generate_business_slug(name: str) -> str:
    import re
    import unicodedata

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


def get_unique_business_slug(
    db: Session,
    base_slug: str,
) -> str:
    slug = base_slug
    counter = 2

    while db.scalar(
        select(Business).where(
            Business.slug == slug
        )
    ):
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug