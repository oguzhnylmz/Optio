from fastapi import APIRouter

from app.api.v1.appointments import router as appointments_router
from app.api.v1.auth import router as auth_router
from app.api.v1.availability import router as availability_router
from app.api.v1.businesses import router as businesses_router
from app.api.v1.business_hours import router as business_hours_router
from app.api.v1.customer import router as customer_router
from app.api.v1.customer_auth import router as customer_auth_router
from app.api.v1.customers import router as customers_router
from app.api.v1.employees import router as employees_router
from app.api.v1.public.businesses import (
    router as public_businesses_router,
)
from app.api.v1.services import router as services_router


api_router = APIRouter(
    prefix="/api/v1",
)

# Authentication
api_router.include_router(auth_router)

# Business owner / management
api_router.include_router(businesses_router)
api_router.include_router(services_router)
api_router.include_router(employees_router)
api_router.include_router(business_hours_router)
api_router.include_router(availability_router)
api_router.include_router(customers_router)
api_router.include_router(appointments_router)

# Registered customer
api_router.include_router(customer_auth_router)
api_router.include_router(customer_router)

# Public booking
api_router.include_router(public_businesses_router)