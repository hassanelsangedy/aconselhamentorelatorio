from fastapi import UploadFile, APIRouter, HTTPException, Depends, BackgroundTasks, Form
from sqlmodel import Session, select
import traceback
import shutil
import os
import uuid
import logging
from typing import Optional
from app.database import get_session, engine
from app.models import Participante, SessaoAconselhamento, StatusSessao, ModeloRelatorio
from app.ai_service import AIService

router = APIRouter()
logger = logging.getLogger("uvicorn")

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/sessoes")
@router.get("/sessoes/", include_in_schema=False)
async def listar_sessoes(session: Session = Depends(get_session)):
    print("⚡ GET /sessoes chamado")
    try:
        statement = select(SessaoAconselhamento).join(Participante)
        results = session.exec(statement).all()
        
        return [
            {
                "id": s.id,
                "data_upload": s.data_upload,
                "status": s.status,
                "transcricao_full_text": s.transcricao_full_text,
                "analise_json": s.analise_json,
                "modelo_nome": s.modelo.nome if s.modelo else "N/A", # Return template name
                "participante": {
                    "nome_codigo": s.participante.nome_codigo
                }
            }
            for s in results
        ]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessoes/{sessao_id}")
async def obter_sessao(sessao_id: int, session: Session = Depends(get_session)):
    try:
        sessao = session.get(SessaoAconselhamento, sessao_id)
        if not sessao:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
        return {
            "id": sessao.id,
            "data_upload": sessao.data_upload,
            "status": sessao.status,
            "transcricao_full_text": sessao.transcricao_full_text,
            "analise_json": sessao.analise_json,
            "modelo_nome": sessao.modelo.nome if sessao.modelo else "N/A",
            "participante": {
                "nome_codigo": sessao.participante.nome_codigo if sessao.participante else "Desconhecido"
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
@router.post("/upload/", include_in_schema=False)
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile, 
    nome_participante: str = Form("Desconhecido"), 
    modelo_id: Optional[int] = Form(None), # Optional, defaults to finding active one
    session: Session = Depends(get_session)
):
    try:
        # Default Template Selection Logic
        if modelo_id is None:
            # Find the first active template
            template = session.exec(select(ModeloRelatorio).where(ModeloRelatorio.ativo == True)).first()
            if template:
                modelo_id = template.id
            else:
                # Should not happen if seeded, but handle gracefully
                modelo_id = None 

        # 1. Salvar Arquivo
        file_ext = file.filename.split('.')[-1]
        
        file_uuid = str(uuid.uuid4())
        safe_filename = f"{file_uuid}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"Arquivo salvo em: {file_path}")

        # 2. Criar ou Buscar Participante
        part_code = file.filename.split('.')[0][:10].upper()
        if nome_participante and nome_participante != "Desconhecido":
            part_code = nome_participante.strip().upper()[:15]

        print(f"🔥 RECEBIDO UPLOAD: {file.filename} -> Código: {part_code} -> Modelo: {modelo_id}")

        participante = session.exec(select(Participante).where(Participante.nome_codigo == part_code)).first()
        
        if not participante:
            participante = Participante(nome_codigo=part_code, grupo_intervencao="ND")
            session.add(participante)
            session.commit()
            session.refresh(participante)

        # 3. Criar Sessão
        nova_sessao = SessaoAconselhamento(
            participante_id=participante.id,
            caminho_arquivo_audio=file_path,
            status=StatusSessao.AGUARDANDO,
            modelo_id=modelo_id # Assign Template
        )
        session.add(nova_sessao)
        session.commit()
        session.refresh(nova_sessao)
        
        sessao_id = nova_sessao.id

        # 4. Background Task
        background_tasks.add_task(run_pipeline, sessao_id)

        return {
            "message": "Upload realizado com sucesso! Processamento iniciado.", 
            "sessao_id": sessao_id,
            "status": "AGUARDANDO",
            "participante": part_code,
            "modelo_id": modelo_id
        }

    except Exception as e:
        traceback.print_exc()
        print(f"❌ ERRO NO UPLOAD: {e}")
        logger.error(f"Erro no upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Falha ao processar upload: {str(e)}")


async def run_pipeline(sessao_id: int):
    """Executa a IA em background"""
    print(f"🚀 [Background] Iniciando pipeline para sessão {sessao_id}...")
    try:
        with Session(engine) as session:
            sessao = session.get(SessaoAconselhamento, sessao_id)
            if not sessao:
                print(f"❌ [Background] Sessão {sessao_id} não encontrada!")
                return

            sessao.status = StatusSessao.PROCESSANDO_AUDIO
            session.add(sessao)
            session.commit()
            
            # Fetch Template Prompt
            system_prompt = None
            if sessao.modelo_id:
                modelo = session.get(ModeloRelatorio, sessao.modelo_id)
                if modelo:
                    system_prompt = modelo.system_prompt
                    print(f"ℹ️ [Background] Usando Template: {modelo.nome}")

            # Chama IA (Mock ou Real)
            try:
                # Pass prompt to AI Service
                resultado = await AIService.processar_sessao(sessao.caminho_arquivo_audio, system_prompt=system_prompt)

                sessao.transcricao_full_text = resultado.get("transcricao", "")
                sessao.analise_json = resultado.get("analise", {})
                sessao.status = StatusSessao.CONCLUIDO
                
                print(f"✅ [Background] Sessão {sessao_id} processada com sucesso!")
            
            except Exception as ai_e:
                print(f"❌ [Background] Erro na IA: {ai_e}")
                sessao.status = StatusSessao.ERRO

            session.add(sessao)
            session.commit()

    except Exception as e:
        print(f"❌ [Background] Erro fatal no pipeline: {e}")
        traceback.print_exc()
