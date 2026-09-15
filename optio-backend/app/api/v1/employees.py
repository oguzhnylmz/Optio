from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.employee import (
    EmployeeCreateRequest,
    EmployeeResponse,
    EmployeeServicesUpdateRequest,
)
from app.services.business_service import get_owned_business
from app.services.employee_service import (
    create_employee,
    get_employee,
    get_employee_services,
    get_employees,
    set_employee_services,
)


router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee_endpoint(
    data: EmployeeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EmployeeResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    employee = create_employee(
        db=db,
        business=business,
        data=data,
    )

    return EmployeeResponse(
        id=str(employee.id),
        business_id=str(employee.business_id),
        first_name=employee.first_name,
        last_name=employee.last_name,
        display_name=employee.display_name,
        phone=employee.phone,
        email=employee.email,
        is_active=employee.is_active,
    )


@router.get(
    "",
    response_model=list[EmployeeResponse],
)
def list_employees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[EmployeeResponse]:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    employees = get_employees(
        db=db,
        business=business,
    )

    return [
        EmployeeResponse(
            id=str(employee.id),
            business_id=str(employee.business_id),
            first_name=employee.first_name,
            last_name=employee.last_name,
            display_name=employee.display_name,
            phone=employee.phone,
            email=employee.email,
            is_active=employee.is_active,
        )
        for employee in employees
    ]


@router.put(
    "/{employee_id}/services",
)
def update_employee_services(
    employee_id: UUID,
    data: EmployeeServicesUpdateRequest,
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
        service_ids = [
            UUID(service_id)
            for service_id in data.service_ids
        ]

        services = set_employee_services(
            db=db,
            employee=employee,
            service_ids=service_ids,
        )

    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return {
        "employee_id": str(employee.id),
        "service_ids": [
            str(service.id)
            for service in services
        ],
    }


@router.get(
    "/{employee_id}/services",
)
def list_employee_services(
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

    services = get_employee_services(
        db=db,
        employee=employee,
    )

    return [
        {
            "id": str(service.id),
            "name": service.name,
            "duration_minutes": service.duration_minutes,
            "price": service.price,
            "currency": service.currency,
            "is_active": service.is_active,
        }
        for service in services
    ]