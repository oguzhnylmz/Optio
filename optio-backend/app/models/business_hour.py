from typing import TYPE_CHECKING
from uuid import UUID
from datetime import time

from sqlalchemy import ForeignKey, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.business import Business


class BusinessHour(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "business_hours"

    business_id: Mapped[UUID] = mapped_column(
        ForeignKey("businesses.id", ondelete="CASCADE"),
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

    business: Mapped["Business"] = relationship(
        "Business",
        back_populates="business_hours",
    )