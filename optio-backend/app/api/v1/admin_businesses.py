from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_admin,
    get_db,
)
from app.models.user import User
from app.schemas.business import (
    AdminBusinessResponse,
    AdminBusinessUpdateRequest,
)
from app.services.business_service import (
    get_business_by_id,
    list_businesses,
    update_business,
)


router = APIRouter(
    prefix="/admin/businesses",
    tags=["Admin Businesses"],
)


def _to_admin_business_response(
    business,
) -> AdminBusinessResponse:
    owner = business.owner

    return AdminBusinessResponse(
        id=str(business.id),
        owner_id=str(business.owner_id),
        name=business.name,
        slug=business.slug,
        description=business.description,
        phone=business.phone,
        email=business.email,
        address=business.address,
        city=business.city,
        country=business.country,
        timezone=business.timezone,
        logo_url=business.logo_url,
        is_active=business.is_active,
        owner_first_name=(
            owner.first_name
            if owner
            else None
        ),
        owner_last_name=(
            owner.last_name
            if owner
            else None
        ),
        owner_email=(
            owner.email
            if owner
            else None
        ),
        owner_phone=(
            owner.phone
            if owner
            else None
        ),
    )


@router.get(
    "",
    response_model=list[AdminBusinessResponse],
)
def get_businesses(
    search: str | None = Query(
        default=None,
        max_length=150,
    ),
    is_active: bool | None = Query(
        default=None,
    ),
    _: User = Depends(
        get_current_admin,
    ),
    db: Session = Depends(get_db),
) -> list[AdminBusinessResponse]:
    businesses = list_businesses(
        db=db,
        search=search,
        is_active=is_active,
    )

    return [
        _to_admin_business_response(
            business,
        )
        for business in businesses
    ]


@router.get(
    "/{business_id}",
    response_model=AdminBusinessResponse,
)
def get_business(
    business_id: UUID,
    _: User = Depends(
        get_current_admin,
    ),
    db: Session = Depends(get_db),
) -> AdminBusinessResponse:
    business = get_business_by_id(
        db=db,
        business_id=business_id,
    )

    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    return _to_admin_business_response(
        business,
    )


@router.patch(
    "/{business_id}",
    response_model=AdminBusinessResponse,
)
def update_business_endpoint(
    business_id: UUID,
    data: AdminBusinessUpdateRequest,
    _: User = Depends(
        get_current_admin,
    ),
    db: Session = Depends(get_db),
) -> AdminBusinessResponse:
    business = get_business_by_id(
        db=db,
        business_id=business_id,
    )

    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    try:
        business = update_business(
            db=db,
            business=business,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    business = get_business_by_id(
        db=db,
        business_id=business.id,
    )

    return _to_admin_business_response(
        business,
    )