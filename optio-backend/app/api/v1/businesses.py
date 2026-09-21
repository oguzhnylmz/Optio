from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.business import (
    BusinessCreateRequest,
    BusinessResponse,
    BusinessUpdateRequest,
)
from app.services.business_service import (
    create_business,
    get_owned_business,
    update_business,
)


router = APIRouter(
    prefix="/businesses",
    tags=["Businesses"],
)


def _to_business_response(
    business,
) -> BusinessResponse:
    return BusinessResponse(
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
    )


@router.post(
    "",
    response_model=BusinessResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_business_endpoint(
    data: BusinessCreateRequest,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(get_db),
) -> BusinessResponse:
    try:
        business = create_business(
            db=db,
            owner=current_user,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _to_business_response(
        business,
    )


@router.get(
    "/me",
    response_model=BusinessResponse,
)
def get_my_business(
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(get_db),
) -> BusinessResponse:
    if current_user.role.value != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only business owners can access this endpoint.",
        )

    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owned business not found.",
        )

    return _to_business_response(
        business,
    )


@router.patch(
    "/me",
    response_model=BusinessResponse,
)
def update_my_business(
    data: BusinessUpdateRequest,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(get_db),
) -> BusinessResponse:
    if current_user.role.value != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only business owners can update their business.",
        )

    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owned business not found.",
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

    return _to_business_response(
        business,
    )