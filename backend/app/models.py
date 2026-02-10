from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum
from sqlalchemy import Text, JSON

class StatusSessao(str, Enum):
    AGUARDANDO = "AGUARDANDO"
    PROCESSANDO_AUDIO = "PROCESSANDO_AUDIO"
    CONCLUIDO = "CONCLUIDO"
    ERRO = "ERRO"

# --- NOVAS TABELAS PARA MULTI-USUÁRIO ---

class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    email: str = Field(unique=True, index=True)
    senha_hash: str # Armazena hash bcrypt
    papel: str = Field(default="profissional") # "admin", "profissional"
    
    sessoes_criadas: List["SessaoAconselhamento"] = Relationship(back_populates="usuario")

class ModeloRelatorio(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str = Field(unique=True) # Ex: "Nutrição Esportiva", "Psicologia"
    descricao: Optional[str] = None
    
    # O "Cérebro" do modelo
    system_prompt: str = Field(sa_type=Text) # Instruções para a IA
    schema_json: Dict[str, Any] = Field(default={}, sa_type=JSON) # Estrutura esperada do JSON de saída
    
    ativo: bool = Field(default=True)
    
    sessoes: List["SessaoAconselhamento"] = Relationship(back_populates="modelo")

# --- TABELAS EXISTENTES (ATUALIZADAS) ---

class Participante(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nome_codigo: str = Field(index=True) 
    grupo_intervencao: Optional[str] = None
    
    sessoes: List["SessaoAconselhamento"] = Relationship(back_populates="participante")

class SessaoAconselhamento(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relacionamentos
    participante_id: Optional[int] = Field(default=None, foreign_key="participante.id")
    usuario_id: Optional[int] = Field(default=None, foreign_key="usuario.id") # Quem analisou
    modelo_id: Optional[int] = Field(default=None, foreign_key="modelorelatorio.id") # Qual modelo usou

    data_upload: datetime = Field(default_factory=datetime.now)
    caminho_arquivo_audio: str
    status: StatusSessao = Field(default=StatusSessao.AGUARDANDO)
    
    # Resultados da IA
    transcricao_full_text: Optional[str] = Field(default=None, sa_type=Text) 
    analise_json: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON) 
    
    # Meta-dados simples
    tipo_motivacao_detectada: Optional[str] = None 
    
    # Back-populates
    participante: Optional[Participante] = Relationship(back_populates="sessoes")
    usuario: Optional[Usuario] = Relationship(back_populates="sessoes_criadas")
    modelo: Optional[ModeloRelatorio] = Relationship(back_populates="sessoes")

    class Config:
        arbitrary_types_allowed = True
