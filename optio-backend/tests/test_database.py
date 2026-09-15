from sqlalchemy import text

from app.db.database import engine


def test_database_connection():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1")
        ).scalar_one()

    assert result == 1


def test_database_schema():
    with engine.connect() as connection:
        result = connection.execute(
            text(
                """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN (
                    'users',
                    'businesses',
                    'customers',
                    'employees',
                    'employee_availability',
                    'employee_services',
                    'services',
                    'business_hours',
                    'appointments'
                )
                """
            )
        ).scalar_one()

    assert result == 9