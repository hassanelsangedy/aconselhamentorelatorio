from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.database import get_session
from app.models import Usuario
from app.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Endpoint simples para verificar se o token do Clerk está funcionando
@router.get("/me")
async def read_users_me(current_user: Usuario = Depends(get_current_user)):
    return current_user
