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
            
            return {
                "transcricao": "Esta é uma transcrição simulada... O aluno João Silva relatou dores.",
                "analise": {
                    "boas_vindas": "Olá, João! Que bom ter você aqui.",
                    "dados_identificacao": {
                        "nome_participante": "João Silva",
                        "nome_conselheiro": "Prof. Carlos"
                    },
                    "significado_movimento": "Um momento de cuidado pessoal.",
                    "identificacao_rotina": "Rotina intensa, mas com janelas pela manhã.",
                    # ... (rest of mock data same as before or simplified)
                    "saude_cuidado": "Atenção especial à região lombar.",
                    "motivacao_traduzida": "Busca por saúde e bem-estar.",
                    "meta_sensata": "3x na semana, foco em constância.",
                    "estrategia_treino": "Treinos curtos e eficientes.",
                    "justificativa_tecnica_detalhada": {
                        "selecao_exercicios": "Multiarticulares.",
                        "volume_series_reps": "3x12",
                        "intervalo_descanso": "60s",
                        "cadencia_velocidade": "Controlada"
                    },
                    "mensagem_final": "Conte conosco!",
                    "dados_estruturados": {
                        "nome_primeiro": "João"
                    }
                }
            }

        # Lógica REAL com Groq
        from groq import Groq
        import json

        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY não configurada!")

        client = Groq(api_key=GROQ_API_KEY)

        # 1. Transcrição
        print(f"🎙️ [IA] Transcrevendo áudio: {caminho_audio}")
        with open(caminho_audio, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(caminho_audio, file.read()),
                model="distil-whisper-large-v3-en",
                language="pt"
            )
        texto_transcrito = transcription.text
        print(f"📝 [IA] Transcrição concluída ({len(texto_transcrito)} chars)")

        # 2. Análise (LLM)
        print(f"🧠 [IA] Analisando texto com Llama 3...")
        
        # Injetar instrução de extração de nomes no prompt se não existir
        instrucao_extra = """
        IMPORTANTE: Além da análise, você DEVE extrair os nomes se citados no áudio.
        Adicione um campo "dados_identificacao": { "nome_participante": "...", "nome_conselheiro": "..." } ao JSON final.
        Se não encontrar, use "Não identificado".
        """
        prompt_final = f"{system_prompt}\n\n{instrucao_extra}"

        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": prompt_final},
                {"role": "user", "content": f"Analise esta transcrição de uma sessão de aconselhamento:\n\n{texto_transcrito}"}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.7
        )

        analise_json = json.loads(completion.choices[0].message.content)

        return {
            "transcricao": texto_transcrito,
            "analise": analise_json
        }
