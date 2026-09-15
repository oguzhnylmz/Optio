from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.employee_availability import EmployeeAvailability
    from app.models.service import Service
    from app.models.appointment import Appointment

class Employee(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "employees"

    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    display_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    business: Mapped["Business"] = relationship(
        "Business",
        back_populates="employees",
    )

    services: Mapped[list["Service"]] = relationship(
        "Service",
        secondary="employee_services",
        back_populates="employees",
    )
    availability: Mapped[list["EmployeeAvailability"]] = relationship(
        "EmployeeAvailability",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment",
        back_populates="employee",
        cascade="all, delete-orphan",
    )