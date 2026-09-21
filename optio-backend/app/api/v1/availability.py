from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.availability import (
    EmployeeAvailabilityRequest,
)
from app.services.business_service import get_owned_business
from app.services.employee_service import get_employee
from app.services.employee_availability_service import (
    create_employee_availability,
    delete_employee_availability,
    get_employee_availability,
    replace_employee_availability,
)

router = APIRouter(
    prefix="/employees",
    tags=["Employee Availability"],
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


def get_owned_employee_or_404(
    db: Session,
    business,
    employee_id: UUID,
):
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

    return employee


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
    business = get_owner_business_or_404(
        db=db,
        current_user=current_user,
    )

    employee = get_owned_employee_or_404(
        db=db,
        business=business,
        employee_id=employee_id,
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
        "employee_id": str(
            availability.employee_id
        ),
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
    business = get_owner_business_or_404(
        db=db,
        current_user=current_user,
    )

    employee = get_owned_employee_or_404(
        db=db,
        business=business,
        employee_id=employee_id,
    )

    availability = get_employee_availability(
        db=db,
        employee=employee,
    )

    return [
        {
            "id": str(item.id),
            "employee_id": str(
                item.employee_id
            ),
            "day_of_week": item.day_of_week,
            "start_time": item.start_time,
            "end_time": item.end_time,
        }
        for item in availability
    ]


@router.put(
    "/{employee_id}/availability",
)
def replace_employee_availability_endpoint(
    employee_id: UUID,
    data: list[EmployeeAvailabilityRequest],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = get_owner_business_or_404(
        db=db,
        current_user=current_user,
    )

    employee = get_owned_employee_or_404(
        db=db,
        business=business,
        employee_id=employee_id,
    )

    try:
        availability = (
            replace_employee_availability(
                db=db,
                employee=employee,
                availability=data,
            )
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return [
        {
            "id": str(item.id),
            "employee_id": str(
                item.employee_id
            ),
            "day_of_week": item.day_of_week,
            "start_time": item.start_time,
            "end_time": item.end_time,
        }
        for item in availability
    ]


@router.delete(
    "/{employee_id}/availability/{availability_id}",
)
def delete_employee_availability_endpoint(
    employee_id: UUID,
    availability_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = get_owner_business_or_404(
        db=db,
        current_user=current_user,
    )

    employee = get_owned_employee_or_404(
        db=db,
        business=business,
        employee_id=employee_id,
    )

    deleted = delete_employee_availability(
        db=db,
        employee=employee,
        availability_id=availability_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability not found.",
        )

    return {
        "message": (
            "Employee availability "
            "deleted successfully."
        )
    }