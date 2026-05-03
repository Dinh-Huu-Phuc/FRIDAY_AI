from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from friday.src.common.security import generate_internal_api_key, hash_secret, verify_secret
from friday.src.crud.internal_api_key_crud import (
    create_api_key,
    get_api_key,
    get_api_key_by_prefix,
    list_api_keys,
    revoke_api_key,
)
from friday.src.models.internal_api_key import InternalApiKey
from friday.src.models.user import User
from friday.src.schemas.api_keys.requests import ApiKeyCreateRequest
from friday.src.schemas.api_keys.responses import ApiKeyCreateResponse, ApiKeyMetadataResponse


def _is_admin(user: User) -> bool:
    return user.role is not None and user.role.name == "admin"


def _metadata(api_key: InternalApiKey) -> ApiKeyMetadataResponse:
    return ApiKeyMetadataResponse(
        id=api_key.id,
        owner_user_id=api_key.owner_user_id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        scopes=json.loads(api_key.scopes_json or "[]"),
        status=api_key.status,
        environment=api_key.environment,
        expires_at=api_key.expires_at,
        revoked_at=api_key.revoked_at,
        created_at=api_key.created_at,
        updated_at=api_key.updated_at,
        last_used_at=api_key.last_used_at,
        last_used_ip=api_key.last_used_ip,
        usage_count=api_key.usage_count,
        rate_limit_per_minute=api_key.rate_limit_per_minute,
        token_limit_daily=api_key.token_limit_daily,
        token_used_today=api_key.token_used_today,
        daily_reset_at=api_key.daily_reset_at,
        notes=api_key.notes,
    )


def create_internal_api_key(db: Session, payload: ApiKeyCreateRequest, current_user: User) -> ApiKeyCreateResponse:
    full_key, key_prefix = generate_internal_api_key(payload.environment)
    row = create_api_key(
        db,
        owner_user_id=current_user.id,
        name=payload.name,
        key_prefix=key_prefix,
        key_hash=hash_secret(full_key),
        scopes_json=json.dumps(payload.scopes),
        environment=payload.environment,
        expires_at=payload.expires_at,
        rate_limit_per_minute=payload.rate_limit_per_minute,
        token_limit_daily=payload.token_limit_daily,
        notes=payload.notes,
    )
    return ApiKeyCreateResponse(api_key=full_key, metadata=_metadata(row))


def list_internal_api_keys(db: Session, current_user: User, limit: int = 50, offset: int = 0) -> list[ApiKeyMetadataResponse]:
    owner_id = None if _is_admin(current_user) else current_user.id
    return [_metadata(row) for row in list_api_keys(db, owner_user_id=owner_id, limit=limit, offset=offset)]


def get_internal_api_key(db: Session, current_user: User, key_id: int) -> ApiKeyMetadataResponse:
    row = get_api_key(db, key_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
    if not _is_admin(current_user) and row.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view another user's API key.")
    return _metadata(row)


def revoke_internal_api_key(db: Session, current_user: User, key_id: int) -> ApiKeyMetadataResponse:
    row = get_api_key(db, key_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
    if not _is_admin(current_user) and row.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot revoke another user's API key.")
    if row.status != "revoked":
        row = revoke_api_key(db, row)
    if row.expires_at is not None and row.expires_at < datetime.now(timezone.utc):
        row.status = "expired"
        db.add(row)
        db.commit()
        db.refresh(row)
    return _metadata(row)


def verify_internal_api_key(db: Session, api_key: str, current_user: User) -> ApiKeyMetadataResponse:
    key_prefix = api_key[:24]
    row = get_api_key_by_prefix(db, key_prefix)
    if row is None or not verify_secret(api_key, row.key_hash):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")
    if not _is_admin(current_user) and row.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot use another user's API key.")
    if row.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="API key is not active.")
    if row.expires_at is not None and row.expires_at < datetime.now(timezone.utc):
        row.status = "expired"
        db.add(row)
        db.commit()
        db.refresh(row)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="API key has expired.")
    return _metadata(row)
