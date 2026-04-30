"""use unicode text columns

Revision ID: 20260430_0002
Revises: 20260429_0001
Create Date: 2026-04-30
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260430_0002"
down_revision = "20260429_0001"
branch_labels = None
depends_on = None


def _drop_indexes(table_name: str, index_names: list[str]) -> None:
    for index_name in index_names:
        op.execute(
            f"""
            IF EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = N'{index_name}' AND object_id = OBJECT_ID(N'{table_name}')
            )
            DROP INDEX {index_name} ON {table_name}
            """
        )


def _drop_unique_constraints_for_columns(table_name: str, column_names: list[str]) -> None:
    columns_sql = ", ".join(f"N'{column}'" for column in column_names)
    op.execute(
        f"""
        DECLARE @sql NVARCHAR(MAX) = N'';
        SELECT @sql = @sql + N'ALTER TABLE {table_name} DROP CONSTRAINT [' + kc.name + N'];'
        FROM sys.key_constraints kc
        JOIN sys.index_columns ic
            ON ic.object_id = kc.parent_object_id
            AND ic.index_id = kc.unique_index_id
        JOIN sys.columns c
            ON c.object_id = ic.object_id
            AND c.column_id = ic.column_id
        WHERE kc.parent_object_id = OBJECT_ID(N'{table_name}')
            AND kc.type = 'UQ'
            AND c.name IN ({columns_sql});
        EXEC sp_executesql @sql;
        """
    )


def _drop_dependencies() -> None:
    _drop_indexes("roles", ["ix_roles_name"])
    _drop_unique_constraints_for_columns("roles", ["name"])

    _drop_indexes("users", ["ix_users_username", "ix_users_email"])
    _drop_unique_constraints_for_columns("users", ["username", "email"])

    _drop_indexes("refresh_tokens", ["ix_refresh_tokens_token_hash"])
    _drop_unique_constraints_for_columns("refresh_tokens", ["token_hash"])

    _drop_indexes(
        "internal_api_keys",
        [
            "ix_internal_api_keys_environment",
            "ix_internal_api_keys_key_hash",
            "ix_internal_api_keys_key_prefix",
            "ix_internal_api_keys_status",
        ],
    )
    _drop_unique_constraints_for_columns("internal_api_keys", ["key_hash", "key_prefix"])


def _recreate_dependencies() -> None:
    op.create_unique_constraint("uq_roles_name", "roles", ["name"])
    op.create_index("ix_roles_name", "roles", ["name"])

    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_unique_constraint("uq_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])

    op.create_unique_constraint("uq_internal_api_keys_key_hash", "internal_api_keys", ["key_hash"])
    op.create_unique_constraint("uq_internal_api_keys_key_prefix", "internal_api_keys", ["key_prefix"])
    op.create_index("ix_internal_api_keys_environment", "internal_api_keys", ["environment"])
    op.create_index("ix_internal_api_keys_key_hash", "internal_api_keys", ["key_hash"])
    op.create_index("ix_internal_api_keys_key_prefix", "internal_api_keys", ["key_prefix"])
    op.create_index("ix_internal_api_keys_status", "internal_api_keys", ["status"])


def upgrade() -> None:
    _drop_dependencies()

    op.alter_column("roles", "name", existing_type=sa.String(length=64), type_=sa.Unicode(length=64), existing_nullable=False)
    op.alter_column("roles", "description", existing_type=sa.Text(), type_=sa.UnicodeText(), existing_nullable=True)

    op.alter_column("users", "username", existing_type=sa.String(length=80), type_=sa.Unicode(length=80), existing_nullable=False)
    op.alter_column("users", "email", existing_type=sa.String(length=255), type_=sa.Unicode(length=255), existing_nullable=False)
    op.alter_column("users", "full_name", existing_type=sa.String(length=255), type_=sa.Unicode(length=255), existing_nullable=True)
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), type_=sa.Unicode(length=255), existing_nullable=False)

    op.alter_column("refresh_tokens", "token_hash", existing_type=sa.String(length=255), type_=sa.Unicode(length=255), existing_nullable=False)
    op.alter_column("refresh_tokens", "created_ip", existing_type=sa.String(length=64), type_=sa.Unicode(length=64), existing_nullable=True)
    op.alter_column("refresh_tokens", "user_agent", existing_type=sa.Text(), type_=sa.UnicodeText(), existing_nullable=True)

    op.alter_column("auth_login_audits", "username_or_email", existing_type=sa.String(length=255), type_=sa.Unicode(length=255), existing_nullable=False)
    op.alter_column("auth_login_audits", "ip_address", existing_type=sa.String(length=64), type_=sa.Unicode(length=64), existing_nullable=True)
    op.alter_column("auth_login_audits", "user_agent", existing_type=sa.Text(), type_=sa.UnicodeText(), existing_nullable=True)
    op.alter_column("auth_login_audits", "failure_reason", existing_type=sa.Text(), type_=sa.UnicodeText(), existing_nullable=True)

    op.alter_column("internal_api_keys", "name", existing_type=sa.String(length=120), type_=sa.Unicode(length=120), existing_nullable=False)
    op.alter_column("internal_api_keys", "key_prefix", existing_type=sa.String(length=48), type_=sa.Unicode(length=48), existing_nullable=False)
    op.alter_column("internal_api_keys", "key_hash", existing_type=sa.String(length=255), type_=sa.Unicode(length=255), existing_nullable=False)
    op.alter_column("internal_api_keys", "scopes_json", existing_type=sa.Text(), type_=sa.UnicodeText(), existing_nullable=False)
    op.alter_column("internal_api_keys", "status", existing_type=sa.String(length=32), type_=sa.Unicode(length=32), existing_nullable=False)
    op.alter_column("internal_api_keys", "environment", existing_type=sa.String(length=32), type_=sa.Unicode(length=32), existing_nullable=False)
    op.alter_column("internal_api_keys", "last_used_ip", existing_type=sa.String(length=64), type_=sa.Unicode(length=64), existing_nullable=True)
    op.alter_column("internal_api_keys", "notes", existing_type=sa.Text(), type_=sa.UnicodeText(), existing_nullable=True)

    op.alter_column("internal_api_key_usage_logs", "endpoint", existing_type=sa.String(length=255), type_=sa.Unicode(length=255), existing_nullable=False)
    op.alter_column("internal_api_key_usage_logs", "method", existing_type=sa.String(length=16), type_=sa.Unicode(length=16), existing_nullable=False)
    op.alter_column("internal_api_key_usage_logs", "ip_address", existing_type=sa.String(length=64), type_=sa.Unicode(length=64), existing_nullable=True)
    op.alter_column("internal_api_key_usage_logs", "user_agent", existing_type=sa.Text(), type_=sa.UnicodeText(), existing_nullable=True)

    _recreate_dependencies()


def downgrade() -> None:
    _drop_dependencies()

    op.alter_column("internal_api_key_usage_logs", "user_agent", existing_type=sa.UnicodeText(), type_=sa.Text(), existing_nullable=True)
    op.alter_column("internal_api_key_usage_logs", "ip_address", existing_type=sa.Unicode(length=64), type_=sa.String(length=64), existing_nullable=True)
    op.alter_column("internal_api_key_usage_logs", "method", existing_type=sa.Unicode(length=16), type_=sa.String(length=16), existing_nullable=False)
    op.alter_column("internal_api_key_usage_logs", "endpoint", existing_type=sa.Unicode(length=255), type_=sa.String(length=255), existing_nullable=False)

    op.alter_column("internal_api_keys", "notes", existing_type=sa.UnicodeText(), type_=sa.Text(), existing_nullable=True)
    op.alter_column("internal_api_keys", "last_used_ip", existing_type=sa.Unicode(length=64), type_=sa.String(length=64), existing_nullable=True)
    op.alter_column("internal_api_keys", "environment", existing_type=sa.Unicode(length=32), type_=sa.String(length=32), existing_nullable=False)
    op.alter_column("internal_api_keys", "status", existing_type=sa.Unicode(length=32), type_=sa.String(length=32), existing_nullable=False)
    op.alter_column("internal_api_keys", "scopes_json", existing_type=sa.UnicodeText(), type_=sa.Text(), existing_nullable=False)
    op.alter_column("internal_api_keys", "key_hash", existing_type=sa.Unicode(length=255), type_=sa.String(length=255), existing_nullable=False)
    op.alter_column("internal_api_keys", "key_prefix", existing_type=sa.Unicode(length=48), type_=sa.String(length=48), existing_nullable=False)
    op.alter_column("internal_api_keys", "name", existing_type=sa.Unicode(length=120), type_=sa.String(length=120), existing_nullable=False)

    op.alter_column("auth_login_audits", "failure_reason", existing_type=sa.UnicodeText(), type_=sa.Text(), existing_nullable=True)
    op.alter_column("auth_login_audits", "user_agent", existing_type=sa.UnicodeText(), type_=sa.Text(), existing_nullable=True)
    op.alter_column("auth_login_audits", "ip_address", existing_type=sa.Unicode(length=64), type_=sa.String(length=64), existing_nullable=True)
    op.alter_column("auth_login_audits", "username_or_email", existing_type=sa.Unicode(length=255), type_=sa.String(length=255), existing_nullable=False)

    op.alter_column("refresh_tokens", "user_agent", existing_type=sa.UnicodeText(), type_=sa.Text(), existing_nullable=True)
    op.alter_column("refresh_tokens", "created_ip", existing_type=sa.Unicode(length=64), type_=sa.String(length=64), existing_nullable=True)
    op.alter_column("refresh_tokens", "token_hash", existing_type=sa.Unicode(length=255), type_=sa.String(length=255), existing_nullable=False)

    op.alter_column("users", "password_hash", existing_type=sa.Unicode(length=255), type_=sa.String(length=255), existing_nullable=False)
    op.alter_column("users", "full_name", existing_type=sa.Unicode(length=255), type_=sa.String(length=255), existing_nullable=True)
    op.alter_column("users", "email", existing_type=sa.Unicode(length=255), type_=sa.String(length=255), existing_nullable=False)
    op.alter_column("users", "username", existing_type=sa.Unicode(length=80), type_=sa.String(length=80), existing_nullable=False)

    op.alter_column("roles", "description", existing_type=sa.UnicodeText(), type_=sa.Text(), existing_nullable=True)
    op.alter_column("roles", "name", existing_type=sa.Unicode(length=64), type_=sa.String(length=64), existing_nullable=False)

    _recreate_dependencies()
