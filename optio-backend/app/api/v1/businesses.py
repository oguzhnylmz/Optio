from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.business import (
    BusinessCreateRequest,
    BusinessResponse,
)
from app.services.business_service import create_business


router = APIRouter(
    prefix="/businesses",
    tags=["Businesses"],
)


@router.post(
    "",
    response_model=BusinessResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_business_endpoint(
    data: BusinessCreateRequest,
    current_user: User = Depends(get_current_user),
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