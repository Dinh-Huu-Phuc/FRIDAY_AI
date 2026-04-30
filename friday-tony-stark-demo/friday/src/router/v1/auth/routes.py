from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from friday.src.dependencies.auth import require_active_user
from friday.src.dependencies.database import get_db
from friday.src.models.user import User
from friday.src.schemas.auth.requests import LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest
from friday.src.schemas.auth.responses import LogoutResponse, TokenResponse
from friday.src.schemas.users.responses import UserResponse
from friday.src.services.auth.service import login_user, logout_user, refresh_access_token, register_user


router = APIRouter()


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    return register_user(db, payload, request)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    return login_user(db, payload, request)


@router.post("/logout", response_model=LogoutResponse)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)) -> LogoutResponse:
    return logout_user(db, payload)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(require_active_user)) -> User:
    return current_user


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    return refresh_access_token(db, payload, request)
