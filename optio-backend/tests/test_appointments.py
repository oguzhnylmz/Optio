from datetime import datetime, time
from zoneinfo import ZoneInfo


def appointment_payload(
    context,
    hour: int,
    minute: int = 0,
):
    target_date = context["target_date"]

    start_at = datetime.combine(
        target_date,
        time(hour, minute),
        tzinfo=ZoneInfo("Europe/Istanbul"),
    )

    return {
        "customer_id": context["customer"]["id"],
        "employee_id": context["employee"]["id"],
        "service_id": context["service"]["id"],
        "start_at": start_at.isoformat(),
        "customer_note": "Appointment test",
    }


def test_create_appointment_success(
    client,
    booking_context,
):
    response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            0,
        ),
        headers=booking_context["headers"],
    )

    assert response.status_code == 201

    data = response.json()

    assert data["status"] == "pending"
    assert data["customer_id"] == (
        booking_context["customer"]["id"]
    )
    assert data["employee_id"] == (
        booking_context["employee"]["id"]
    )
    assert data["service_id"] == (
        booking_context["service"]["id"]
    )


def test_appointment_outside_employee_availability(
    client,
    booking_context,
):
    response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            18,
            0,
        ),
        headers=booking_context["headers"],
    )

    assert response.status_code == 400

    assert response.json()["detail"] == (
        "The selected time is outside "
        "the employee's availability."
    )


def test_conflicting_appointment_is_rejected(
    client,
    booking_context,
):
    first_response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            0,
        ),
        headers=booking_context["headers"],
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            15,
        ),
        headers=booking_context["headers"],
    )

    assert second_response.status_code == 400

    assert second_response.json()["detail"] == (
        "The selected time slot is no longer available."
    )


def test_adjacent_appointment_is_allowed(
    client,
    booking_context,
):
    first_response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            0,
        ),
        headers=booking_context["headers"],
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            30,
        ),
        headers=booking_context["headers"],
    )

    assert second_response.status_code == 201


def test_cancelled_appointment_releases_slot(
    client,
    booking_context,
):
    create_response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            0,
        ),
        headers=booking_context["headers"],
    )

    assert create_response.status_code == 201

    appointment_id = create_response.json()["id"]

    cancel_response = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        json={
            "status": "cancelled"
        },
        headers=booking_context["headers"],
    )

    assert cancel_response.status_code == 200

    retry_response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            0,
        ),
        headers=booking_context["headers"],
    )

    assert retry_response.status_code == 201


def test_completed_appointment_releases_slot(
    client,
    booking_context,
):
    create_response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            0,
        ),
        headers=booking_context["headers"],
    )

    assert create_response.status_code == 201

    appointment_id = create_response.json()["id"]

    confirm_response = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        json={
            "status": "confirmed"
        },
        headers=booking_context["headers"],
    )

    assert confirm_response.status_code == 200

    complete_response = client.patch(
        f"/api/v1/appointments/{appointment_id}/status",
        json={
            "status": "completed"
        },
        headers=booking_context["headers"],
    )

    assert complete_response.status_code == 200

    retry_response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            booking_context,
            14,
            0,
        ),
        headers=booking_context["headers"],
    )

    assert retry_response.status_code == 201