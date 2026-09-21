from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.api.v1.availability import router as employee_availability_router
from app.api.v1.business_hours import router as business_hours_router

app = FastAPI(
    title=settings.app_name,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }
app.include_router(
    employee_availability_router,
    prefix="/api/v1",
)

app.include_router(
    business_hours_router,
    prefix="/api/v1",
)