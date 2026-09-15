from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import AppointmentStatus


if TYPE_CHECKING:
    from app.models.business import Business
    from app.models.customer import Customer
    from app.models.employee import Employee
    from app.models.service import Service


class Appointment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "appointments"

    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    customer_id: Mapped[UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    employee_id: Mapped[UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    service_id: Mapped[UUID] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    start_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    end_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    status: Mapped[AppointmentStatus] = mapped_column(
        SQLEnum(
            AppointmentStatus,
            name="appointment_status",
        ),
        nullable=False,
        default=AppointmentStatus.PENDING,
        index=True,
    )

    customer_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    internal_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    business: Mapped["Business"] = relationship(
        "Business",
        back_populates="appointments",
    )

    customer: Mapped["Customer"] = relationship(
        "Customer",
        back_populates="appointments",
    )

    employee: Mapped["Employee"] = relationship(
        "Employee",
        back_populates="appointments",
    )

    service: Mapped["Service"] = relationship(
        "Service",
        back_populates="appointments",
    )