import os
import asyncio
from typing import Dict, Any, Optional

# Config
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MOCK_MODE = os.getenv("MOCK_AI_MODE", "True").lower() == "true"

class AIService:
    
    @staticmethod
    def compress_audio(file_path: str) -> str:
        # Placeholder para compressão (pydub)
        return file_path

    @staticmethod
    async def processar_sessao(caminho_audio: str, system_prompt: Optional[str] = None):
        """Orquestra o fluxo de IA: Transcrição -> Análise"""
        
        # Se nenhum prompt for passado, usar um default (fallback)
        if not system_prompt:
            system_prompt = "Você é um assistente útil. Analise o áudio."

        if MOCK_MODE:
            print("🤖 [MOCK] Simulando processamento de IA... (Aguardando 2s)")
            await asyncio.sleep(2)
            
            # Aqui poderíamos usar o schema_json para gerar dados randomizados,
            # mas por enquanto retornamos o mock padrão do "Caurn Personal Digital"
            return {
                "transcricao": "Esta é uma transcrição simulada para fins de teste. O participante relatou gostar de musculação e ter dores na lombar.",
                "analise": {
                    "boas_vindas": "Olá! Que bom ter você aqui no CaurnAtiva.",
                    "significado_movimento": "Um momento de cuidado pessoal.",
                    "identificacao_rotina": "Rotina intensa, mas com janelas pela manhã.",
                    "saude_cuidado": "Atenção especial à região lombar.",
                    "motivacao_traduzida": "Busca por saúde e bem-estar (Identificada).",
                    "meta_sensata": "3x na semana, foco em constância.",
                    "estrategia_treino": "Treinos curtos e eficientes.",
                    "justificativa_tecnica_detalhada": {
                        "selecao_exercicios": "Multiarticulares com suporte.",
                        "volume_series_reps": "3x12 para resistência.",
                        "intervalo_descanso": "60 segundos.",
                        "cadencia_velocidade": "Controlada (2020)."
                    },
                    "mensagem_final": "Conte conosco nessa jornada!",
                    "dados_estruturados": {
                        "nome_primeiro": "Participante",
                        "meta_curta": "Saúde",
                        "frequencia_semanal": "3x",
                        "intensidade": "Moderada",
                        "foco_imediato": "Adaptação",
                        "preferencias": {"adora": "Musculação", "detesta": "Corrida"},
                        "regulas": {"intrinseca": "Alta"}
                    }
                }
            }

        # Lógica real com Groq Client
        # client = Groq(api_key=GROQ_API_KEY)
        # transcription = client.audio.transcriptions.create(...)
        # analysis = client.chat.completions.create(
        #    messages=[
        #       {"role": "system", "content": system_prompt},
        #       {"role": "user", "content": f"Analise esta transcrição: {transcription.text}"}
        #    ],
        #    model="llama3-70b-8192",
        #    response_format={"type": "json_object"}
        # )
        
        return {}
