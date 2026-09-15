from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.business_hours import BusinessHourRequest
from app.services.business_hours_service import (
    create_business_hour,
    get_business_hours,
)
from app.services.business_service import get_owned_business


router = APIRouter(
    prefix="/business-hours",
    tags=["Business Hours"],
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_business_hour_endpoint(
    data: BusinessHourRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    try:
        business_hour = create_business_hour(
            db=db,
            business=business,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return {
        "id": str(business_hour.id),
        "business_id": str(business_hour.business_id),
        "day_of_week": business_hour.day_of_week,
        "start_time": business_hour.start_time,
        "end_time": business_hour.end_time,
    }


@router.get("")
def list_business_hours(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    business_hours = get_business_hours(
        db=db,
        business=business,
    )

    return [
        {
            "id": str(business_hour.id),
            "business_id": str(business_hour.business_id),
            "day_of_week": business_hour.day_of_week,
            "start_time": business_hour.start_time,
            "end_time": business_hour.end_time,
        }
        for business_hour in business_hours
    ]