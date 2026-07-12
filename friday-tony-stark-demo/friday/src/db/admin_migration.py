from __future__ import annotations

from sqlalchemy import inspect, text

from friday.src.common.security import hash_password
from friday.src.db.database import get_engine
from friday.src.models.admin_account import AdminAccount


def _has_column(inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _add_user_quota_columns() -> None:
    engine = get_engine()
    inspector = inspect(engine)
    dialect = engine.dialect.name

    with engine.begin() as connection:
        if not _has_column(inspector, "users", "free_question_limit_daily"):
            if dialect == "mssql":
                connection.execute(text("ALTER TABLE users ADD free_question_limit_daily INT NOT NULL CONSTRAINT DF_users_free_question_limit_daily DEFAULT 10"))
            else:
                connection.execute(text("ALTER TABLE users ADD COLUMN free_question_limit_daily INTEGER NOT NULL DEFAULT 10"))
        if not _has_column(inspector, "users", "api_key_question_limit_daily"):
            if dialect == "mssql":
                connection.execute(text("ALTER TABLE users ADD api_key_question_limit_daily INT NOT NULL CONSTRAINT DF_users_api_key_question_limit_daily DEFAULT 10"))
            else:
                connection.execute(text("ALTER TABLE users ADD COLUMN api_key_question_limit_daily INTEGER NOT NULL DEFAULT 10"))


def _create_admin_table() -> None:
    engine = get_engine()
    AdminAccount.__table__.create(bind=engine, checkfirst=True)


def _seed_super_admin() -> None:
    engine = get_engine()
    with engine.begin() as connection:
        existing = connection.execute(
            text("SELECT COUNT(*) FROM admin_accounts WHERE username = :username"),
            {"username": "fridayADMIN"},
        ).scalar()
        if existing:
            return
        connection.execute(
            text(
                """
                INSERT INTO admin_accounts
                    (username, password_hash, display_name, role, is_active, created_at, updated_at)
                VALUES
                    (:username, :password_hash, :display_name, :role, :is_active, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """
            ),
            {
                "username": "fridayADMIN",
                "password_hash": hash_password("Admin@Admin123"),
                "display_name": "FRIDAY Super Admin",
                "role": "super_admin",
                "is_active": True,
            },
        )


def run() -> None:
    _add_user_quota_columns()
    _create_admin_table()
    _seed_super_admin()


if __name__ == "__main__":
    run()
