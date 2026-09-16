from enum import Enum


class UserRole(str, Enum):
    OWNER = "owner"
    CUSTOMER = "customer"


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"