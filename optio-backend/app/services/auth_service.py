from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import (
    CustomerRegisterRequest,
    LoginRequest,
    RegisterRequest,
)


def register_user(
    db: Session,
    data: RegisterRequest,
) -> User:
    existing_user = db.scalar(
        select(User).where(
            User.email == data.email
        )
    )

    if existing_user:
        raise ValueError(
            "A user with this email already exists."
        )

    user = User(
        email=data.email,
        password_hash=hash_password(
            data.password
        ),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        role=UserRole.OWNER,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def register_customer_account(
    db: Session,
    data: CustomerRegisterRequest,
) -> tuple[User, str]:
    existing_user = db.scalar(
        select(User).where(
            User.email == data.email
        )
    )

    if existing_user:
        raise ValueError(
            "A user with this email already exists."
        )

    user = User(
        email=data.email,
        password_hash=hash_password(
            data.password
        ),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        role=UserRole.CUSTOMER,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        str(user.id)
    )

    return user, access_token


def login_user(
    db: Session,
    data: LoginRequest,
) -> str:
    user = db.scalar(
        select(User).where(
            User.email == data.email
        )
    )

    if not user or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise ValueError(
            "Invalid email or password."
        )

    if not user.is_active:
        raise ValueError(
            "User account is inactive."
        )

    return create_access_token(
        str(user.id)
    )