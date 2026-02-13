from fastapi import UploadFile, APIRouter, HTTPException, Depends, BackgroundTasks, Form
from sqlmodel import Session, select
import traceback
import shutil
import os
import uuid
import logging
from typing import Optional
from pydantic import BaseModel
from app.database import get_session, engine
from app.models import Participante, SessaoAconselhamento, StatusSessao, ModeloRelatorio, Usuario, CompartilhamentoSessao
from app.ai_service import AIService
from app.auth import get_current_user

router = APIRouter()
logger = logging.getLogger("uvicorn")

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/sessoes")
@router.get("/sessoes/", include_in_schema=False)
async def listar_sessoes(
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    print(f"⚡ GET /sessoes chamado por {current_user.email}")
    try:
        # Subquery for shared sessions
        shared_query = select(CompartilhamentoSessao.sessao_id).where(
            CompartilhamentoSessao.usuario_destinatario_id == current_user.id
        )
        
        # Main query: Owner OR Shared
        statement = select(SessaoAconselhamento).join(Participante).where(
            (SessaoAconselhamento.usuario_id == current_user.id) | 
            (SessaoAconselhamento.id.in_(shared_query))
        )
        
        results = session.exec(statement).all()
        print(f"🔍 [DEBUG] Encontradas {len(results)} sessões no banco.")
        
        response_list = []
        for s in results:
            try:
                # Safe Access Logic
                modelo_nome = "N/A"
                if s.modelo:
                    modelo_nome = s.modelo.nome
                
                part_nome = "Desconhecido"
                if s.participante:
                    part_nome = s.participante.nome_codigo

                item = {
                    "id": s.id,
                    "data_upload": s.data_upload,
                    "status": s.status,
                    "transcricao_full_text": s.transcricao_full_text,
                    "analise_json": s.analise_json,
                    "modelo_nome": modelo_nome,
                    "participante": {
                        "nome_codigo": part_nome
                    }
                }
                response_list.append(item)
            except Exception as item_error:
                print(f"⚠️ [WARN] Erro ao processar sessão {s.id}: {item_error}")
                continue
        
        print(f"✅ [DEBUG] Retornando {len(response_list)} sessões válidas.")
        return response_list

    except Exception as e:
        traceback.print_exc()
        print(f"❌ [CRITICAL] Erro fatal em listar_sessoes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessoes/{sessao_id}")
async def obter_sessao(
    sessao_id: int, 
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        sessao = session.get(SessaoAconselhamento, sessao_id)
        if not sessao:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
        # Check Authorization
        has_access = (sessao.usuario_id == current_user.id)
        if not has_access:
            share = session.exec(select(CompartilhamentoSessao).where(
                CompartilhamentoSessao.sessao_id == sessao_id,
                CompartilhamentoSessao.usuario_destinatario_id == current_user.id
            )).first()
            if share:
                has_access = True
        
        if not has_access:
             raise HTTPException(status_code=403, detail="Acesso negado")

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
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    try:
        print(f"🔥 UPLOAD INICIADO por {current_user.email}")
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
            modelo_id=modelo_id, # Assign Template
            usuario_id=current_user.id
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

class ShareRequest(BaseModel):
    email: str

@router.post("/sessoes/{sessao_id}/compartilhar")
async def compartilhar_sessao(
    sessao_id: int, 
    share_data: ShareRequest,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    # 1. Buscar Sessão
    sessao = session.get(SessaoAconselhamento, sessao_id)
    if not sessao:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    # 2. Verificar Permissão (Apenas Dono)
    if sessao.usuario_id != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o proprietário pode compartilhar esta sessão.")
    
    # 3. Buscar ou Criar Destinatário (Invite Flow)
    destinatario = session.exec(select(Usuario).where(Usuario.email == share_data.email)).first()
    
    is_new_invite = False
    if not destinatario:
        # Create Invite User
        print(f"📧 [SHARE] Criando usuário convidado para {share_data.email}")
        destinatario = Usuario(
            nome="Convidado",
            email=share_data.email,
            senha_hash="INVITE_PENDING",
            papel="leitura"
        )
        session.add(destinatario)
        session.commit()
        session.refresh(destinatario)
        is_new_invite = True
    
    if destinatario.id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode compartilhar consigo mesmo.")

    # 4. Verificar se já existe compartilhamento
    existing = session.exec(select(CompartilhamentoSessao).where(
        CompartilhamentoSessao.sessao_id == sessao_id, 
        CompartilhamentoSessao.usuario_destinatario_id == destinatario.id
    )).first()

    if existing:
         # Gera o link mesmo se já existir
         link = f"https://aconselhamentorelatorio-poqy.vercel.app/relatorio/{sessao_id}"
         return {
             "message": f"Usuário {destinatario.email} já possui acesso.",
             "link_acesso": link
         }

    # 5. Criar Compartilhamento
    novo_share = CompartilhamentoSessao(
        sessao_id=sessao_id,
        usuario_destinatario_id=destinatario.id, 
        permissoes="leitura"
    )
    session.add(novo_share)
    session.commit()
    
    # 6. Simular Envio de Email
    link = f"https://aconselhamentorelatorio-poqy.vercel.app/relatorio/{sessao_id}"
    print(f"📧 [EMAIL SIMULATION] To: {destinatario.email} | Subject: Você recebeu um relatório! | Link: {link}")
    
    return {
        "message": f"Convite enviado para {destinatario.email}", 
        "link_acesso": link,
        "status": "novo_convite" if is_new_invite else "permissao_concedida"
    }
