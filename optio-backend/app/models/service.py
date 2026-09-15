from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.employee import Employee
    from app.models.appointment import Appointment
class Service(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "services"

    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="TRY",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    business: Mapped["Business"] = relationship(
        "Business",
        back_populates="services",
    )

    employees: Mapped[list["Employee"]] = relationship(
        "Employee",
        secondary="employee_services",
        back_populates="services",
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment",
        back_populates="service",
        cascade="all, delete-orphan",
    )