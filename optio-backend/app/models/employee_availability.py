from typing import TYPE_CHECKING
from uuid import UUID
from datetime import time

from sqlalchemy import ForeignKey, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.employee import Employee


class EmployeeAvailability(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "employee_availability"

    employee_id: Mapped[UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    day_of_week: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    start_time: Mapped[time] = mapped_column(
        nullable=False,
    )

    end_time: Mapped[time] = mapped_column(
        nullable=False,
    )

    employee: Mapped["Employee"] = relationship(
        "Employee",
        back_populates="availability",
    )