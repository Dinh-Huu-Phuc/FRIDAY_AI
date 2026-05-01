from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env")


class Settings:
    app_name: str = "FRIDAY REST API"
    api_v1_prefix: str = "/api/v1"
    sse_prefix: str = "/sse"
    environment: str = os.getenv("FRIDAY_ENV", "local")
    host: str = os.getenv("FRIDAY_API_HOST", "127.0.0.1")
    port: int = int(os.getenv("FRIDAY_API_PORT", "8000"))
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "FRIDAY_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]

    server_name: str = os.getenv("SERVER_NAME", "")
    db_name: str = os.getenv("DB_NAME", "")
    db_user: str = os.getenv("DB_USER", "")
    db_password: str = os.getenv("DB_PASSWORD", "")
    sql_server_driver: str = os.getenv("SQL_SERVER_DRIVER", "ODBC Driver 18 for SQL Server")

    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me-in-env")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    refresh_token_expire_days: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    friday_api_key_pepper: str = os.getenv("FRIDAY_API_KEY_PEPPER", jwt_secret_key)

    @property
    def database_url(self) -> str:
        explicit_url = os.getenv("DATABASE_URL")
        if explicit_url:
            return explicit_url
        if not all([self.server_name, self.db_name, self.db_user, self.db_password]):
            return ""
        odbc_connection = (
            f"DRIVER={{{self.sql_server_driver}}};"
            f"SERVER={self.server_name};"
            f"DATABASE={self.db_name};"
            f"UID={self.db_user};"
            f"PWD={self.db_password};"
            "TrustServerCertificate=yes;"
        )
        return f"mssql+pyodbc:///?odbc_connect={quote_plus(odbc_connection)}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
