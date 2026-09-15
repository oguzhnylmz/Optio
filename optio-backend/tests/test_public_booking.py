from datetime import datetime, time
from zoneinfo import ZoneInfo


def public_booking_payload(
    context,
    *,
    hour: int,
    minute: int = 0,
    full_name: str = "Guest Customer",
    phone: str = "05361112233",
    email: str = "guest@example.com",
    note: str = "Public booking test",
):
    start_at = datetime.combine(
        context["target_date"],
        time(hour, minute),
        tzinfo=ZoneInfo("Europe/Istanbul"),
    )

    return {
        "employee_id": context["employee"]["id"],
        "service_id": context["service"]["id"],
        "start_at": start_at.isoformat(),
        "full_name": full_name,
        "phone": phone,
        "email": email,
        "customer_note": note,
    }


def test_public_business_endpoint(
    client,
    public_booking_context,
):
    business = public_booking_context["business"]

    response = client.get(
        f"/api/v1/public/businesses/{business['slug']}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == business["id"]
    assert data["name"] == business["name"]
    assert data["slug"] == business["slug"]


def test_public_services_endpoint(
    client,
    public_booking_context,
):
    business = public_booking_context["business"]

    response = client.get(
        f"/api/v1/public/businesses/"
        f"{business['slug']}/services"
    )

    assert response.status_code == 200

    services = response.json()

    assert len(services) == 1
    assert services[0]["id"] == (
        public_booking_context["service"]["id"]
    )
    assert services[0]["name"] == "Hair Cut"


def test_public_employees_filtered_by_service(
    client,
    public_booking_context,
):
    business = public_booking_context["business"]
    service = public_booking_context["service"]

    response = client.get(
        f"/api/v1/public/businesses/"
        f"{business['slug']}/employees",
        params={
            "service_id": service["id"],
        },
    )

    assert response.status_code == 200

    employees = response.json()

    assert len(employees) == 1
    assert employees[0]["id"] == (
        public_booking_context["employee"]["id"]
    )


def test_public_availability(
    client,
    public_booking_context,
):
    business = public_booking_context["business"]
    employee = public_booking_context["employee"]
    service = public_booking_context["service"]

    response = client.get(
        f"/api/v1/public/businesses/"
        f"{business['slug']}/availability",
        params={
            "service_id": service["id"],
            "employee_id": employee["id"],
            "date": public_booking_context[
                "target_date"
            ].isoformat(),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["employee_id"] == employee["id"]
    assert data["service_id"] == service["id"]

    assert "10:00:00" in data["slots"]
    assert "12:30:00" in data["slots"]
    assert "14:00:00" in data["slots"]
    assert "17:30:00" in data["slots"]

    assert "13:00:00" not in data["slots"]
    assert "18:00:00" not in data["slots"]


def test_guest_public_booking(
    client,
    public_booking_context,
):
    business = public_booking_context["business"]

    response = client.post(
        f"/api/v1/public/businesses/"
        f"{business['slug']}/appointments",
        json=public_booking_payload(
            public_booking_context,
            hour=14,
            minute=0,
        ),
    )

    assert response.status_code == 201

    data = response.json()

    assert data["business_name"] == business["name"]
    assert data["customer_name"] == "Guest Customer"
    assert data["service_name"] == "Hair Cut"
    assert data["employee_name"] == "Test Employee"
    assert data["status"] == "pending"


def test_guest_booking_reuses_customer(
    client,
    public_booking_context,
):
    business = public_booking_context["business"]

    first_payload = public_booking_payload(
        public_booking_context,
        hour=14,
        minute=0,
        full_name="Ahmet Test",
        phone="05364445566",
        email="ahmet@example.com",
    )

    first_response = client.post(
        f"/api/v1/public/businesses/"
        f"{business['slug']}/appointments",
        json=first_payload,
    )

    assert first_response.status_code == 201

    second_payload = public_booking_payload(
        public_booking_context,
        hour=15,
        minute=0,
        full_name="Ahmet Test",
        phone="+90 536 444 55 66",
        email="updated@example.com",
    )

    second_response = client.post(
        f"/api/v1/public/businesses/"
        f"{business['slug']}/appointments",
        json=second_payload,
    )

    assert second_response.status_code == 201

    customer_response = client.get(
        "/api/v1/customers",
        headers=public_booking_context["headers"],
    )

    assert customer_response.status_code == 200

    customers = customer_response.json()

    matching_customers = [
        customer
        for customer in customers
        if customer["full_name"] == "Ahmet Test"
    ]

    assert len(matching_customers) == 1

    assert matching_customers[0]["phone"] == (
        "+90 536 444 55 66"
    )


def test_registered_customer_public_booking(
    client,
    registered_customer_context,
):
    context = registered_customer_context
    business = context["business"]

    response = client.post(
        f"/api/v1/public/businesses/"
        f"{business['slug']}/appointments",
        json=public_booking_payload(
            context,
            hour=16,
            minute=0,
            full_name="Registered Customer",
            phone="05367778899",
            email="registered-customer@example.com",
            note="Registered customer booking",
        ),
        headers=context["customer_headers"],
    )

    assert response.status_code == 201

    data = response.json()

    assert data["customer_name"] == (
        "Registered Customer"
    )
    assert data["service_name"] == "Hair Cut"
    assert data["status"] == "pending"

    customer_response = client.get(
        "/api/v1/customers",
        headers=context["headers"],
    )

    assert customer_response.status_code == 200

    customers = customer_response.json()

    matching_customers = [
        customer
        for customer in customers
        if customer["user_id"]
        == context["customer_user_id"]
    ]

    assert len(matching_customers) == 1

    assert matching_customers[0]["business_id"] == (
        business["id"]
    )


def test_registered_customer_can_see_public_booking(
    client,
    registered_customer_context,
):
    context = registered_customer_context
    business = context["business"]

    booking_response = client.post(
        f"/api/v1/public/businesses/"
        f"{business['slug']}/appointments",
        json=public_booking_payload(
            context,
            hour=16,
            minute=0,
            full_name="Registered Customer",
            phone="05367778899",
            email="registered-customer@example.com",
        ),
        headers=context["customer_headers"],
    )

    assert booking_response.status_code == 201

    appointment_id = booking_response.json()[
        "appointment_id"
    ]

    my_appointments_response = client.get(
        "/api/v1/customer/appointments",
        headers=context["customer_headers"],
    )

    assert my_appointments_response.status_code == 200

    appointments = my_appointments_response.json()

    matching_appointments = [
        appointment
        for appointment in appointments
        if appointment["id"] == appointment_id
    ]

    assert len(matching_appointments) == 1