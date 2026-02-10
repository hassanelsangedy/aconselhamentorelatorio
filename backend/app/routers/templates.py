from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import ModeloRelatorio, Usuario
from app.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/templates", tags=["templates"])

class TemplateCreate(BaseModel):
    nome: str
    descricao: str
    system_prompt: str
    schema_json: Dict[str, Any]

@router.get("/", response_model=List[ModeloRelatorio])
async def list_templates(session: Session = Depends(get_session)):
    templates = session.exec(select(ModeloRelatorio).where(ModeloRelatorio.ativo == True)).all()
    return templates

@router.post("/", response_model=ModeloRelatorio, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    current_user: Usuario = Depends(get_current_user), # Requires login
    session: Session = Depends(get_session)
):
    # Check duplicate name
    exists = session.exec(select(ModeloRelatorio).where(ModeloRelatorio.nome == template_data.nome)).first()
    if exists:
        raise HTTPException(status_code=400, detail="Modelo com este nome já existe")
    
    new_template = ModeloRelatorio(
        nome=template_data.nome,
        descricao=template_data.descricao,
        system_prompt=template_data.system_prompt,
        schema_json=template_data.schema_json
    )
    session.add(new_template)
    session.commit()
    session.refresh(new_template)
    return new_template
