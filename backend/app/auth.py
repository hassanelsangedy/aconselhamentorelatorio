import os
import jwt
import requests
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from app.database import get_session
from app.models import Usuario
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURAÇÃO DO CLERK ---
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "https://concise-moose-54.clerk.accounts.dev")
JWKS_URL = f"{CLERK_ISSUER}/.well-known/jwks.json"

# Cache para chaves públicas
jwks_client = jwt.PyJWKClient(JWKS_URL)

security = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security), 
    session: Session = Depends(get_session)
) -> Usuario:
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract Key ID (kid) manually to be safe
        unverified_header = jwt.get_unverified_header(token.credentials)
        kid = unverified_header.get("kid")
        
        # Get the key using the kid
        signing_key = jwks_client.get_signing_key(kid)
        
        # Decode using the key
        payload = jwt.decode(
            token.credentials,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False}, 
            leeway=120, # Allow 2 minutes of clock skew
            # issuer=CLERK_ISSUER, # Keep disabled for now
        )
        
        user_id_clerk = payload.get("sub")
        if user_id_clerk is None:
             raise credentials_exception

    except Exception as e:
        print(f"🔴 [AUTH ERROR] JWT Validation Failed: {e}")
        # print(f"🔴 [AUTH DEBUG] Token Header: {jwt.get_unverified_header(token.credentials)}")
        
        # Return specific error to frontend for debugging
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Auth Failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Sincronização JIT (Just-In-Time)
    # Tenta usar email se disponível, senão usa ID do Clerk como email fake para garantir unicidade
    user_email = payload.get("email")
    if not user_email:
        user_email = f"{user_id_clerk}@clerk.user"
    
    # Busca usuário existente
    user = session.exec(select(Usuario).where(Usuario.email == user_email)).first()
    
    if not user:
        # Se não existe, busca pelo ID "fake" caso o email tenha mudado (edge case)
        # Mas para simplificar MVP, criamos novo.
        user_name = payload.get("name") or payload.get("given_name") or "Novo Usuário"
        
        user = Usuario(
            nome=user_name,
            email=user_email,
            senha_hash="CLERK_AUTH_NO_PASSWORD", 
            papel="profissional"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
    return user

async def get_current_active_user(current_user: Usuario = Depends(get_current_user)):
    return current_user
