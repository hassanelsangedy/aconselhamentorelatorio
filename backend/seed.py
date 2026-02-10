from sqlmodel import Session, select
from app.database import engine, create_db_and_tables
from app.models import Usuario, ModeloRelatorio
from app.auth import get_password_hash

def seed():
    # Ensure tables exist
    create_db_and_tables()

    with Session(engine) as session:
        # 1. Create Default Admin User
        admin_email = "admin@caurn.com.br"
        user = session.exec(select(Usuario).where(Usuario.email == admin_email)).first()
        if not user:
            print(f"Creating default user: {admin_email}")
            user = Usuario(
                nome="Administrador",
                email=admin_email,
                senha_hash=get_password_hash("123456"), # Default password
                papel="admin"
            )
            session.add(user)
        
        # 2. Create Default Template (Caurn Personal Digital)
        template_name = "Caurn Personal Digital"
        template = session.exec(select(ModeloRelatorio).where(ModeloRelatorio.nome == template_name)).first()
        
        if not template:
            print(f"Creating default template: {template_name}")
            
            # Reconstructed Prompt based on Mock Output
            system_prompt = """
Você é um especialista em Educação Física e Saúde comportamental do projeto CaurnAtiva.
Sua tarefa é analisar a fala de um participante sobre sua rotina e hábitos de atividade física e gerar um relatório de aconselhamento personalizado.

O tom deve ser acolhedor, motivador e profissional. Evite jargões excessivos, mas mostre embasamento técnico.

Analise a transcrição e extraia/gere os seguintes pontos no formato JSON estrito:

1. "boas_vindas": Uma saudação personalizada e curta.
2. "significado_movimento": Interprete qual o significado do movimento para essa pessoa (ex: estética, saúde, social, alívio de estresse).
3. "identificacao_rotina": Resuma a rotina atual dela e barreiras mencionadas.
4. "saude_cuidado": Destaque pontos de atenção à saúde ou lesões citadas.
5. "motivacao_traduzida": Identifique a motivação principal (intrínseca ou extrínseca) e dê um nome a ela.
6. "meta_sensata": Sugira uma meta realista para começar/manter (ex: 3x na semana).
7. "estrategia_treino": Sugira uma estratégia geral (ex: Treino Fullbody, Caminhada + Alongamento).
8. "justificativa_tecnica_detalhada": Um objeto com detalhes técnicos:
    - "selecao_exercicios": Quais tipos priorizar (ex: Multiarticulares).
    - "volume_series_reps": Sugestão de volume (ex: 2 a 3 séries).
    - "intervalo_descanso": Tempo de descanso sugerido.
    - "cadencia_velocidade": Ritmo de execução.
9. "mensagem_final": Uma frase de encerramento encorajadora.
10. "dados_estruturados": Um objeto resumo com campos curtos para exibição rápida:
    - "nome_primeiro": Primeiro nome (se identificado).
    - "meta_curta": Ex: "Hipertrofia", "Mobilidade".
    - "frequencia_semanal": Ex: "3x".
    - "intensidade": "Leve", "Moderada" ou "Alta".
    - "foco_imediato": O que fazer já.
    - "preferencias": Objeto com "adora" e "detesta".
    - "regulas": Objeto com motivadores (ex: "intrinseca": "Alta").

Retorne APENAS o JSON válido.
"""
            
            schema_json = {
                "boas_vindas": "string",
                "significado_movimento": "string",
                "identificacao_rotina": "string",
                "saude_cuidado": "string",
                "motivacao_traduzida": "string",
                "meta_sensata": "string",
                "estrategia_treino": "string",
                "justificativa_tecnica_detalhada": "object",
                "mensagem_final": "string",
                "dados_estruturados": "object"
            }
            
            template = ModeloRelatorio(
                nome=template_name,
                descricao="Modelo padrão focado em prescrição de treino e mudança comportamental.",
                system_prompt=system_prompt,
                schema_json=schema_json,
                ativo=True
            )
            session.add(template)

        session.commit()
        print("Seed completed successfully!")

if __name__ == "__main__":
    seed()
