from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.availability import EmployeeAvailabilityRequest
from app.services.business_service import get_owned_business
from app.services.employee_service import get_employee
from app.services.employee_availability_service import (
    create_employee_availability,
    get_employee_availability,
)


router = APIRouter(
    prefix="/employees",
    tags=["Employee Availability"],
)


@router.post(
    "/{employee_id}/availability",
    status_code=status.HTTP_201_CREATED,
)
def create_employee_availability_endpoint(
    employee_id: UUID,
    data: EmployeeAvailabilityRequest,
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

    employee = get_employee(
        db=db,
        business=business,
        employee_id=employee_id,
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    try:
        availability = create_employee_availability(
            db=db,
            employee=employee,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return {
        "id": str(availability.id),
        "employee_id": str(availability.employee_id),
        "day_of_week": availability.day_of_week,
        "start_time": availability.start_time,
        "end_time": availability.end_time,
    }


@router.get(
    "/{employee_id}/availability",
)
def list_employee_availability(
    employee_id: UUID,
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

    employee = get_employee(
        db=db,
        business=business,
        employee_id=employee_id,
    )

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    availability = get_employee_availability(
        db=db,
        employee=employee,
    )

    return [
        {
            "id": str(item.id),
            "employee_id": str(item.employee_id),
            "day_of_week": item.day_of_week,
            "start_time": item.start_time,
            "end_time": item.end_time,
        }
        for item in availability
    ]