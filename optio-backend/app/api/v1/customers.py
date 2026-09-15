from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.customer import (
    CustomerCreateRequest,
    CustomerResponse,
)
from app.services.business_service import get_owned_business
from app.services.customer_service import (
    create_customer,
    get_customers,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_endpoint(
    data: CustomerCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CustomerResponse:
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
        customer = create_customer(
            db=db,
            business=business,
            data=data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return CustomerResponse(
        id=str(customer.id),
        business_id=str(customer.business_id),
        user_id=(
            str(customer.user_id)
            if customer.user_id
            else None
        ),
        full_name=customer.full_name,
        phone=customer.phone,
        email=customer.email,
        notes=customer.notes,
    )


@router.get(
    "",
    response_model=list[CustomerResponse],
)
def list_customers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CustomerResponse]:
    business = get_owned_business(
        db=db,
        owner_id=current_user.id,
    )

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found.",
        )

    customers = get_customers(
        db=db,
        business=business,
    )

    return [
        CustomerResponse(
            id=str(customer.id),
            business_id=str(customer.business_id),
            user_id=(
                str(customer.user_id)
                if customer.user_id
                else None
            ),
            full_name=customer.full_name,
            phone=customer.phone,
            email=customer.email,
            notes=customer.notes,
        )
        for customer in customers
    ]