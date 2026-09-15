from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner-test@example.com",
            "password": "StrongPass123",
            "first_name": "Test",
            "last_name": "Owner",
            "phone": "+905551112233",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["email"] == "owner-test@example.com"
    assert data["first_name"] == "Test"
    assert data["last_name"] == "Owner"
    assert data["phone"] == "+905551112233"

    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email():
    payload = {
        "email": "duplicate@example.com",
        "password": "StrongPass123",
        "first_name": "Duplicate",
        "last_name": "User",
    }

    first_response = client.post(
        "/api/v1/auth/register",
        json=payload,
    )

    second_response = client.post(
        "/api/v1/auth/register",
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409


def test_login_success():
    email = "login-test@example.com"
    password = "StrongPass123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "first_name": "Login",
            "last_name": "Test",
        },
    )

    assert register_response.status_code == 201

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["access_token"]


def test_login_wrong_password():
    email = "wrong-password@example.com"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPass123",
            "first_name": "Wrong",
            "last_name": "Password",
        },
    )

    assert register_response.status_code == 201

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "WrongPassword123",
        },
    )

    assert response.status_code == 401

    assert response.json()["detail"] == (
        "Invalid email or password."
    )


def test_me_with_valid_token():
    email = "me-test@example.com"
    password = "StrongPass123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "first_name": "Me",
            "last_name": "Test",
            "phone": "+905551234567",
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == email
    assert data["first_name"] == "Me"
    assert data["last_name"] == "Test"
    assert data["phone"] == "+905551234567"


def test_me_without_token():
    response = client.get(
        "/api/v1/auth/me"
    )

    assert response.status_code == 401