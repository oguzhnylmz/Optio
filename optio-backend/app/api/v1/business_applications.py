from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_admin,
    get_db,
)
from app.models.business_application import (
    BusinessApplication,
    BusinessApplicationStatus,
)
from app.models.user import User
from app.schemas.business_application import (
    BusinessApplicationCreateRequest,
    BusinessApplicationRejectRequest,
    BusinessApplicationResponse,
)
from app.services.business_application_service import (
    approve_business_application,
    create_business_application,
    get_business_application,
    list_business_applications,
    reject_business_application,
)


router = APIRouter(
    tags=["Business Applications"],
)


def _to_response(
    application: BusinessApplication,
) -> BusinessApplicationResponse:
    return BusinessApplicationResponse(
        id=str(application.id),
        first_name=application.first_name,
        last_name=application.last_name,
        email=application.email,
        phone=application.phone,
        business_name=application.business_name,
        business_type=application.business_type,
        business_phone=application.business_phone,
        business_email=application.business_email,
        city=application.city,
        district=application.district,
        address=application.address,
        website=application.website,
        description=application.description,
        status=application.status,
        rejection_reason=application.rejection_reason,
        reviewed_at=application.reviewed_at,
        reviewed_by=(
            str(application.reviewed_by)
            if application.reviewed_by
            else None
        ),
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.post(
    "/business-applications",
    response_model=BusinessApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    data: BusinessApplicationCreateRequest,
    db: Session = Depends(get_db),
):
    try:
        application = create_business_application(
            db=db,
            data=data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

    return _to_response(application)


@router.get(
    "/admin/business-applications",
    response_model=list[BusinessApplicationResponse],
)
def get_applications(
    application_status: BusinessApplicationStatus | None = Query(
        default=None,
        alias="status",
    ),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    applications = list_business_applications(
        db=db,
        status_filter=application_status,
    )

    return [
        _to_response(application)
        for application in applications
    ]


@router.get(
    "/admin/business-applications/{application_id}",
    response_model=BusinessApplicationResponse,
)
def get_application(
    application_id: UUID,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    application = get_business_application(
        db=db,
        application_id=application_id,
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business application not found.",
        )

    return _to_response(application)


@router.post(
    "/admin/business-applications/{application_id}/approve",
    response_model=BusinessApplicationResponse,
)
def approve_application(
    application_id: UUID,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        application = approve_business_application(
            db=db,
            application_id=application_id,
            reviewer_id=current_admin.id,
        )

    except ValueError as exc:
        message = str(exc)

        if message == "Business application not found.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
        )

    return _to_response(application)


@router.post(
    "/admin/business-applications/{application_id}/reject",
    response_model=BusinessApplicationResponse,
)
def reject_application(
    application_id: UUID,
    data: BusinessApplicationRejectRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    try:
        application = reject_business_application(
            db=db,
            application_id=application_id,
            reviewer_id=current_admin.id,
            rejection_reason=data.rejection_reason,
        )

    except ValueError as exc:
        message = str(exc)

        if message == "Business application not found.":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
        )

    return _to_response(application)