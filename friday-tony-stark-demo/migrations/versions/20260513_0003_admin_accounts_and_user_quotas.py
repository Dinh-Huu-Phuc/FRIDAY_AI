"""add admin accounts and per-user quotas

Revision ID: 20260513_0003
Revises: 20260430_0002
Create Date: 2026-05-13
"""
from __future__ import annotations

import hashlib
import hmac
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


revision = "20260513_0003"
down_revision = "20260430_0002"
branch_labels = None
depends_on = None


def _password_hash(password: str) -> str:
    salt = "friday_admin_default_salt"
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 260_000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def upgrade() -> None:
    op.add_column("users", sa.Column("free_question_limit_daily", sa.Integer(), nullable=False, server_default="10"))
    op.add_column("users", sa.Column("api_key_question_limit_daily", sa.Integer(), nullable=False, server_default="10"))

    op.create_table(
        "admin_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.Unicode(length=80), nullable=False),
        sa.Column("password_hash", sa.Unicode(length=255), nullable=False),
        sa.Column("display_name", sa.Unicode(length=255), nullable=True),
        sa.Column("role", sa.Unicode(length=32), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index(op.f("ix_admin_accounts_id"), "admin_accounts", ["id"], unique=False)
    op.create_index(op.f("ix_admin_accounts_role"), "admin_accounts", ["role"], unique=False)
    op.create_index(op.f("ix_admin_accounts_username"), "admin_accounts", ["username"], unique=False)

    now = datetime.now(timezone.utc)
    bind = op.get_bind()
    existing = bind.execute(sa.text("SELECT COUNT(*) FROM admin_accounts WHERE username = :username"), {"username": "fridayADMIN"}).scalar()
    if not existing:
        bind.execute(
            sa.text(
                """
                INSERT INTO admin_accounts
                    (username, password_hash, display_name, role, is_active, created_at, updated_at)
                VALUES
                    (:username, :password_hash, :display_name, :role, :is_active, :created_at, :updated_at)
                """
            ),
            {
                "username": "fridayADMIN",
                "password_hash": _password_hash("Admin@Admin123"),
                "display_name": "FRIDAY Super Admin",
                "role": "super_admin",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_admin_accounts_username"), table_name="admin_accounts")
    op.drop_index(op.f("ix_admin_accounts_role"), table_name="admin_accounts")
    op.drop_index(op.f("ix_admin_accounts_id"), table_name="admin_accounts")
    op.drop_table("admin_accounts")
    op.drop_column("users", "api_key_question_limit_daily")
    op.drop_column("users", "free_question_limit_daily")
