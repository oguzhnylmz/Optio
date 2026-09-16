"""add user role

Revision ID: 5ee4ab982293
Revises: 9e06a8b91147
Create Date: 2026-09-16 03:01:38.406975

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5ee4ab982293"
down_revision: Union[str, Sequence[str], None] = "9e06a8b91147"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


user_role_enum = sa.Enum(
    "owner",
    "customer",
    name="user_role",
)


def upgrade() -> None:
    user_role_enum.create(
        op.get_bind(),
        checkfirst=True,
    )

    op.add_column(
        "users",
        sa.Column(
            "role",
            user_role_enum,
            nullable=True,
        ),
    )

    op.execute(
        sa.text(
            """
            UPDATE users
            SET role = 'owner'
            WHERE role IS NULL
            """
        )
    )

    op.alter_column(
        "users",
        "role",
        nullable=False,
    )

    op.create_index(
        op.f("ix_users_role"),
        "users",
        ["role"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_users_role"),
        table_name="users",
    )

    op.drop_column(
        "users",
        "role",
    )

    user_role_enum.drop(
        op.get_bind(),
        checkfirst=True,
    )