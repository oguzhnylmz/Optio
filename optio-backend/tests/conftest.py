import os
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest
from dotenv import dotenv_values
from fastapi.testclient import TestClient
from sqlalchemy import text


BASE_DIR = Path(__file__).resolve().parent.parent
TEST_ENV_FILE = BASE_DIR / "tests" / ".env.test"

test_env = dotenv_values(TEST_ENV_FILE)

TEST_DATABASE_URL = test_env.get("DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is missing from tests/.env.test"
    )

os.environ["DATABASE_URL"] = TEST_DATABASE_URL


@pytest.fixture(scope="session", autouse=True)
def prepare_test_database():
    subprocess.run(
        [
            sys.executable,
            "-m",
            "alembic",
            "upgrade",
            "head",
        ],
        cwd=BASE_DIR,
        env=os.environ.copy(),
        check=True,
    )

    yield


@pytest.fixture(autouse=True)
def clean_test_database():
    from app.db.database import engine

    tables = [
        "appointments",
        "employee_services",
        "employee_availability",
        "business_hours",
        "customers",
        "services",
        "employees",
        "businesses",
        "users",
    ]

    with engine.begin() as connection:
        connection.execute(
            text(
                f"""
                TRUNCATE TABLE
                    {", ".join(tables)}
                RESTART IDENTITY
                CASCADE
                """
            )
        )

    yield


@pytest.fixture
def test_database_url() -> str:
    return TEST_DATABASE_URL


@pytest.fixture
def client():
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def booking_context(client):
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "appointment-owner@example.com",
            "password": "StrongPass123",
            "first_name": "Appointment",
            "last_name": "Owner",
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "appointment-owner@example.com",
            "password": "StrongPass123",
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}",
    }

    business_response = client.post(
        "/api/v1/businesses",
        json={
            "name": "Test Beauty",
            "description": "Appointment test business",
            "phone": "+905551111111",
            "email": "test@beauty.example",
            "address": "Test Street 1",
            "city": "Marmaris",
        },
        headers=headers,
    )

    assert business_response.status_code == 201

    business = business_response.json()

    service_response = client.post(
        "/api/v1/services",
        json={
            "name": "Hair Cut",
            "description": "Test haircut",
            "duration_minutes": 30,
            "price": 400,
            "currency": "TRY",
        },
        headers=headers,
    )

    assert service_response.status_code == 201

    service = service_response.json()

    employee_response = client.post(
        "/api/v1/employees",
        json={
            "first_name": "Test",
            "last_name": "Employee",
            "display_name": "Test Employee",
            "phone": "+905552222222",
            "email": "employee@example.com",
        },
        headers=headers,
    )

    assert employee_response.status_code == 201

    employee = employee_response.json()

    assign_response = client.put(
        f"/api/v1/employees/{employee['id']}/services",
        json={
            "service_ids": [service["id"]],
        },
        headers=headers,
    )

    assert assign_response.status_code == 200

    business_hours = [
        {
            "day_of_week": 0,
            "start_time": "09:00:00",
            "end_time": "13:00:00",
        },
        {
            "day_of_week": 0,
            "start_time": "14:00:00",
            "end_time": "19:00:00",
        },
    ]

    for business_hour in business_hours:
        response = client.post(
            "/api/v1/business-hours",
            json=business_hour,
            headers=headers,
        )

        assert response.status_code == 201

    employee_availability = [
        {
            "day_of_week": 0,
            "start_time": "10:00:00",
            "end_time": "13:00:00",
        },
        {
            "day_of_week": 0,
            "start_time": "14:00:00",
            "end_time": "18:00:00",
        },
    ]

    for availability in employee_availability:
        response = client.post(
            f"/api/v1/employees/{employee['id']}/availability",
            json=availability,
            headers=headers,
        )

        assert response.status_code == 201

    customer_response = client.post(
        "/api/v1/customers",
        json={
            "full_name": "Test Customer",
            "phone": "05351234567",
            "email": "customer@example.com",
            "notes": "Appointment test customer",
        },
        headers=headers,
    )

    assert customer_response.status_code == 201

    customer = customer_response.json()

    today = date.today()
    days_until_monday = (7 - today.weekday()) % 7

    if days_until_monday == 0:
        days_until_monday = 7

    target_date = today + timedelta(
        days=days_until_monday
    )

    return {
        "headers": headers,
        "business": business,
        "service": service,
        "employee": employee,
        "customer": customer,
        "target_date": target_date,
    }


@pytest.fixture
def public_booking_context(
    client,
    booking_context,
):
    return {
        **booking_context,
        "public_headers": {},
    }


@pytest.fixture
def registered_customer_context(
    client,
    booking_context,
):
    register_response = client.post(
        "/api/v1/customer/register",
        json={
            "email": "registered-customer@example.com",
            "password": "StrongPass123",
            "first_name": "Registered",
            "last_name": "Customer",
            "phone": "05367778899",
        },
    )

    assert register_response.status_code == 201

    register_data = register_response.json()

    customer_login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "registered-customer@example.com",
            "password": "StrongPass123",
        },
    )

    assert customer_login_response.status_code == 200

    customer_token = customer_login_response.json()["access_token"]

    return {
        **booking_context,
        "customer_user_id": register_data["user_id"],
        "customer_token": customer_token,
        "customer_headers": {
            "Authorization": f"Bearer {customer_token}",
        },
    }