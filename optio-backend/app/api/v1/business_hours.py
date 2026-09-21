from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.business_hours import BusinessHourRequest
from app.services.business_hours_service import (
    create_business_hour,
    delete_business_hour,
    get_business_hours,
    replace_business_hours,
)
from app.services.business_service import get_owned_business


router = APIRouter(
    prefix="/business-hours",
    tags=["Business Hours"],
)


def get_owner_business_or_404(
    db: Session,
    current_user: User,
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

    return business


@router.get("")
def list_business_hours(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = get_owner_business_or_404(
        db=db,
        current_user=current_user,
    )

    hours = get_business_hours(
        db=db,
        business=business,
    )

    return [
        {
            "id": str(item.id),
            "business_id": str(item.business_id),
            "day_of_week": item.day_of_week,
            "start_time": item.start_time,
            "end_time": item.end_time,
        }
        for item in hours
    ]


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_business_hour_endpoint(
    data: BusinessHourRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = get_owner_business_or_404(
        db=db,
        current_user=current_user,
    )

    try:
        item = create_business_hour(
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
        "id": str(item.id),
        "business_id": str(item.business_id),
        "day_of_week": item.day_of_week,
        "start_time": item.start_time,
        "end_time": item.end_time,
    }


@router.put("")
def replace_business_hours_endpoint(
    data: list[BusinessHourRequest],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = get_owner_business_or_404(
        db=db,
        current_user=current_user,
    )

    try:
        hours = replace_business_hours(
            db=db,
            business=business,
            hours=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return [
        {
            "id": str(item.id),
            "business_id": str(item.business_id),
            "day_of_week": item.day_of_week,
            "start_time": item.start_time,
            "end_time": item.end_time,
        }
        for item in hours
    ]


@router.delete(
    "/{business_hour_id}",
)
def delete_business_hour_endpoint(
    business_hour_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = get_owner_business_or_404(
        db=db,
        current_user=current_user,
    )

    deleted = delete_business_hour(
        db=db,
        business=business,
        business_hour_id=business_hour_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business hour not found.",
        )

    return {
        "message": "Business hour deleted successfully."
    }