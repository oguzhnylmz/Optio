from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.services.service_service import (
    create_service,
    get_service,
    get_services,
    update_service,
)
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.service import Service
from app.models.user import User
from app.schemas.service import (
    ServiceCreateRequest,
    ServiceResponse,
    ServiceUpdateRequest,
)
from app.services.business_service import get_owned_business
from app.services.service_service import create_service
from uuid import UUID

router = APIRouter(
    prefix="/services",
    tags=["Services"],
)


@router.post(
    "",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_service_endpoint(
    data: ServiceCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ServiceResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    service = create_service(
        db=db,
        business=business,
        data=data,
    )

    return ServiceResponse(
        id=str(service.id),
        business_id=str(service.business_id),
        name=service.name,
        description=service.description,
        duration_minutes=service.duration_minutes,
        price=service.price,
        currency=service.currency,
        is_active=service.is_active,
    )

@router.get(
    "",
    response_model=list[ServiceResponse],
)
def list_services(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ServiceResponse]:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    services = get_services(
        db=db,
        business=business,
    )

    return [
        ServiceResponse(
            id=str(service.id),
            business_id=str(service.business_id),
            name=service.name,
            description=service.description,
            duration_minutes=service.duration_minutes,
            price=service.price,
            currency=service.currency,
            is_active=service.is_active,
        )
        for service in services
    ]

@router.patch(
    "/{service_id}",
    response_model=ServiceResponse,
)
def update_service_endpoint(
    service_id: UUID,
    data: ServiceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ServiceResponse:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    service = get_service(
        db=db,
        business=business,
        service_id=service_id,
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )

    service = update_service(
        db=db,
        service=service,
        data=data,
    )

    return ServiceResponse(
        id=str(service.id),
        business_id=str(service.business_id),
        name=service.name,
        description=service.description,
        duration_minutes=service.duration_minutes,
        price=service.price,
        currency=service.currency,
        is_active=service.is_active,
    )