from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


if TYPE_CHECKING:
    from app.models.employee import Employee
    from app.models.service import Service
    from app.models.user import User
    from app.models.business_hour import BusinessHour
    from app.models.customer import Customer
    from app.models.appointment import Appointment

class Business(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "businesses"

    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(180),
        unique=True,
        index=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
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

    address: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    country: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Turkey",
    )

    timezone: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Europe/Istanbul",
    )

    logo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    owner_id: Mapped[UUID] = mapped_column(
    ForeignKey("users.id", ondelete="CASCADE"),
    nullable=False,
    index=True,
    )
    employees: Mapped[list["Employee"]] = relationship(
        "Employee",
        back_populates="business",
        cascade="all, delete-orphan",
    )

    services: Mapped[list["Service"]] = relationship(
        "Service",
        back_populates="business",
        cascade="all, delete-orphan",
    )
    customers: Mapped[list["Customer"]] = relationship(
        "Customer",
        back_populates="business",
        cascade="all, delete-orphan",
    )

    business_hours: Mapped[list["BusinessHour"]] = relationship(
        "BusinessHour",
        back_populates="business",
        cascade="all, delete-orphan",
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment",
        back_populates="business",
        cascade="all, delete-orphan",
    )
    owner: Mapped["User"] = relationship(
    "User",
    back_populates="businesses",
)