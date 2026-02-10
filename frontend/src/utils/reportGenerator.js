export const generateHTMLReport = (dados, logoCaurn, logoServico, logoPsico) => {
    // Cores da Marca e Ícones (Design System Update)
    const colors = {
        primary: '#0095DA',     // Brand Blue
        secondary: '#ef4444',   // Brand Red
        success: '#10B981',     // Fresh Green (New)
        text: '#334155',        // Slate 700
        darkText: '#0f172a',    // Slate 900 for headings
        lightBg: '#F8FAFC',     // Clean Slate
        cardBg: '#ffffff',
        accentBg: '#f0f9ff'
    };

    const icons = {
        heart: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${colors.secondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
        user: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${colors.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        target: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${colors.success}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
        dumbell: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
        clock: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`
    };

    // Fallbacks inteligentes
    const primeiroNome = dados.dados_estruturados?.nome_primeiro || (dados.dados_pessoais?.perfil ? dados.dados_pessoais.perfil.split(' ')[0] : 'Participante');

    const boasVindas = dados.boas_vindas || `Olá, ${primeiroNome}! Preparamos este relatório com base na sua sessão.`;
    const significado = dados.significado_movimento || dados.perfil_comportamental?.significado || "Autocuidado e bem-estar.";
    const rotinaTexto = dados.identificacao_rotina || dados.dados_pessoais?.rotina || "Sua rotina foi analisada para melhor adaptação.";
    const saudeTexto = dados.saude_cuidado || dados.saude_seguranca?.status_clinico || "Consideramos seu histórico de saúde.";
    const motivacaoTexto = dados.motivacao_traduzida || "Analisamos o que te move.";
    const metaTexto = dados.meta_sensata || "Sua meta foi definida com foco na constância.";
    const estrategiaTexto = dados.estrategia_treino || "O treino foi desenhado para sua segurança.";
    const mensagemFinal = dados.mensagem_final || dados.proximos_passos?.mensagem_motivacional || "Conte conosco!";

    // Novos campos técnicos
    const justificaExercicios = dados.justificativa_tecnica_detalhada?.selecao_exercicios || "Exercícios multiarticulares para otimizar seu tempo e resultados.";
    const justificaSeries = dados.justificativa_tecnica_detalhada?.volume_series_reps || "Volume ajustado para gerar adaptação sem fadiga excessiva.";
    const justificaIntervalo = dados.justificativa_tecnica_detalhada?.intervalo_descanso || "Descanso calculado para recuperar sua energia para a próxima série.";
    const justificaCadencia = dados.justificativa_tecnica_detalhada?.cadencia_velocidade || "Execução controlada para garantir segurança e consciência corporal.";

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Aconselhamento - ${primeiroNome}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Raleway:wght@300;400;500;600;700&display=swap');
        
        body { 
            background: #f8fafc; 
            margin: 0; 
            padding: 40px; 
            font-family: 'Raleway', sans-serif;
            color: ${colors.text};
            line-height: 1.8;
            -webkit-print-color-adjust: exact;
        }
        h1, h2, h3, h4, .greeting, .section-title {
            font-family: 'Lora', serif;
        }
        .container {
            max-width: 850px; 
            margin: auto; 
            background: white; 
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); /* Softer shadow */
            border-radius: 16px;
            overflow: hidden;
            position: relative;
        }
        
        .print-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: ${colors.primary};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Raleway', sans-serif;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: background 0.2s;
            z-index: 100;
        }
        .print-btn:hover { background: #0284c7; }
        .print-btn svg { width: 20px; height: 20px; }

        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border: none; max-width: 100%; border-radius: 0; }
            .section-block { page-break-inside: avoid; }
            .print-btn { display: none; }
        }
        
        /* HEADER */
        .header {
            padding: 30px 50px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #f1f5f9;
            gap: 20px;
        }
        .logo-wrapper { flex: 1; display: flex; align-items: center; }
        .logo-img { max-height: 80px; max-width: 100%; object-fit: contain; }

        /* BOAS VINDAS & INTRO */
        .intro-section { padding: 40px 50px; }
        .greeting { font-size: 1.25em; color: ${colors.darkText}; margin-bottom: 20px; font-weight: 600; }
        
        .meaning-box {
            background: #f0f9ff;
            border-left: 4px solid ${colors.primary};
            padding: 25px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .meaning-label { 
            text-transform: uppercase; letter-spacing: 2px; font-size: 0.75em; color: ${colors.primary}; font-weight: 700; margin-bottom: 10px; display: block;
        }
        .meaning-text {
            font-family: 'Lora', serif; font-style: italic; font-size: 1.5em; color: #0369a1; line-height: 1.4;
        }

        /* BLOCOS NARRATIVOS */
        .section-block { padding: 0 50px 30px; }
        .section-title {
            display: flex; align-items: center; gap: 10px;
            font-size: 1.3em; font-weight: 700; color: ${colors.primary};
            margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;
        }
        
        .text-content { 
            background: #fff; text-align: justify; color: #475569; margin-bottom: 20px; font-size: 1.05em;
        }

        /* CARD TÉCNICO DIDÁTICO */
        .tech-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        .tech-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .tech-icon-circle {
            background: white;
            padding: 8px;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 36px; min-height: 36px;
        }
        .tech-info h4 { margin: 0 0 5px; font-size: 0.95em; color: ${colors.darkText}; font-weight: 700; font-family: 'Raleway', sans-serif; }
        .tech-info p { margin: 0; font-size: 0.9em; color: #64748b; line-height: 1.5; text-align: left; }

        /* META SENSATA - Refined */
        .meta-box {
            background: #ECFDF5;
            padding: 30px 50px;
            margin: 30px 0;
            border-top: 1px dashed #6EE7B7;
            border-bottom: 1px dashed #6EE7B7;
            text-align: center;
        }

        /* FOOTER */
        .footer {
            background: #1e293b;
            color: white;
            padding: 50px;
            text-align: center;
        }
        .footer-msg { font-size: 1.1em; opacity: 0.9; margin-bottom: 30px; font-style: italic; font-family: 'Lora', serif;}
        .signature { font-family: 'Caveat', cursive; font-size: 2.2em; color: ${colors.primary}; }
        
        .actions-bar {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 100;
        }

        .action-btn {
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Raleway', sans-serif;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: background 0.2s;
        }
        
        .download-btn { background: ${colors.success}; }
        .download-btn:hover { background: #059669; }

        .print-btn svg, .action-btn svg { width: 20px; height: 20px; }

        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border: none; max-width: 100%; border-radius: 0; }
            .section-block { page-break-inside: avoid; }
            .print-btn, .actions-bar { display: none; }
        }
        
        /* HEADER */
        .header {
            padding: 30px 50px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #f1f5f9;
            gap: 20px;
        }
        .logo-wrapper { flex: 1; display: flex; align-items: center; }
        .logo-img { max-height: 80px; max-width: 100%; object-fit: contain; }

        /* BOAS VINDAS & INTRO */
        .intro-section { padding: 40px 50px; }
        .greeting { font-size: 1.25em; color: ${colors.darkText}; margin-bottom: 20px; font-weight: 600; }
        
        .meaning-box {
            background: #f0f9ff;
            border-left: 4px solid ${colors.primary};
            padding: 25px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .meaning-label { 
            text-transform: uppercase; letter-spacing: 2px; font-size: 0.75em; color: ${colors.primary}; font-weight: 700; margin-bottom: 10px; display: block;
        }
        .meaning-text {
            font-family: 'Lora', serif; font-style: italic; font-size: 1.5em; color: #0369a1; line-height: 1.4;
        }

        /* BLOCOS NARRATIVOS */
        .section-block { padding: 0 50px 30px; }
        .section-title {
            display: flex; align-items: center; gap: 10px;
            font-size: 1.3em; font-weight: 700; color: ${colors.primary};
            margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;
        }
        
        .text-content { 
            background: #fff; text-align: justify; color: #475569; margin-bottom: 20px; font-size: 1.05em;
        }
        strong { color: ${colors.darkText}; font-weight: 600; }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <div class="container" id="report-content">
        
        <div class="actions-bar">
            <button class="action-btn print-btn" onclick="window.print()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
            </button>
            <button class="action-btn download-btn" onclick="downloadPDF()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar PDF
            </button>
        </div>

        <script>
            async function downloadPDF() {
                const { jsPDF } = window.jspdf;
                const element = document.getElementById('report-content');
                const actions = document.querySelector('.actions-bar');
                
                // Hide actions for capture
                actions.style.display = 'none';
                
                try {
                    const canvas = await html2canvas(element, {
                        scale: 2,
                        useCORS: true,
                        logging: false
                    });
                    
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    
                    const imgWidth = canvas.width;
                    const imgHeight = canvas.height;
                    
                    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                    
                    // Use simple fit width
                    const imgProps = pdf.getImageProperties(imgData);
                    const pdfH = (imgProps.height * pdfWidth) / imgProps.width;
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfH);
                    pdf.save("Relatorio_" + primeiroNome + ".pdf");
                } catch (err) {
                    console.error('Erro ao gerar PDF', err);
                    alert('Erro ao gerar PDF: ' + err.message);
                } finally {
                    actions.style.display = 'flex';
                }
            }
        </script>

        <!-- CABEÇALHO -->
        <div class="header">
            <div class="logo-wrapper" style="justify-content: flex-start;">
                ${logoCaurn ? `<img src="${logoCaurn}" class="logo-img" alt="PsicoFisio">` : '<b>PSICOFISIO</b>'}
            </div>
            
            <div class="logo-wrapper" style="justify-content: center;">
                <img src="${logoServico || '/logos/caurnpersonaldigital.jpeg'}" alt="Caurn Personal Digital" class="logo-img">
            </div>

            <div class="logo-wrapper" style="justify-content: flex-end;">
                ${logoPsico ? `<img src="${logoPsico}" class="logo-img">` : '<b>PsicoFisio</b>'}
            </div>
        </div>

        <!-- SAUDAÇÃO & SIGNIFICADO -->
        <div class="intro-section">
            <div class="greeting">
                ${boasVindas.replace(/\n/g, '<br>')}
            </div>

            <div class="meaning-box">
                <span class="meaning-label">PARA VOCÊ, O MOVIMENTO É:</span>
                <div class="meaning-text">"${significado}"</div>
            </div>
        </div>

        <!-- 1. IDENTIFICAÇÃO E ROTINA -->
        <div class="section-block">
            <div class="section-title">${icons.user} Identificação e Sua Rotina</div>
            <div class="text-content">
                ${rotinaTexto}
            </div>
        </div>

        <!-- 2. SAÚDE -->
        <div class="section-block">
            <div class="section-title">${icons.heart} Saúde e Cuidado com o Corpo</div>
            <div class="text-content">
                ${saudeTexto}
            </div>
        </div>

        <!-- 3. MOTIVAÇÃO -->
        <div class="section-block">
            <div class="section-title">✨ Sua Motivação</div>
            <div class="text-content">
                ${motivacaoTexto}
            </div>
        </div>

        <!-- 4. META -->
        <div class="meta-box">
            <div class="section-title" style="color: #166534; justify-content: center;">${icons.target} Nossa Meta Sensata</div>
            <div style="text-align: center; color: #14532d; font-size: 1.1em;">
                ${metaTexto}
            </div>
        </div>

        <!-- 5. ESTRATÉGIA -->
        <div class="section-block">
            <div class="section-title">📋 Estratégia de Treino</div>
            <div class="text-content">
                ${estrategiaTexto}
            </div>
            
            <!-- GRID TÉCNICO EXPLICATIVO -->
            <div class="tech-grid">
                <div class="tech-item">
                    <div class="tech-icon-circle">${icons.dumbell}</div>
                    <div class="tech-info">
                        <h4>Seleção dos Exercícios</h4>
                        <p>${justificaExercicios}</p>
                    </div>
                </div>
                <div class="tech-item">
                    <div class="tech-icon-circle">${icons.refresh}</div>
                    <div class="tech-info">
                        <h4>Séries e Repetições</h4>
                        <p>${justificaSeries}</p>
                    </div>
                </div>
                <div class="tech-item">
                    <div class="tech-icon-circle">${icons.clock}</div>
                    <div class="tech-info">
                        <h4>Intervalo de Descanso</h4>
                        <p>${justificaIntervalo}</p>
                    </div>
                </div>
                <div class="tech-item">
                    <div class="tech-icon-circle" style="font-size: 1.2em;">🐌</div>
                    <div class="tech-info">
                        <h4>Cadência (Velocidade)</h4>
                        <p>${justificaCadencia}</p>
                    </div>
                </div>
            </div>

        </div>

        <!-- 6. PLANO PRÁTICO SUGERIDO -->
        <div class="section-block" style="background: #ffffff; margin-top: 20px;">
            <div class="section-title">🏋️ Plano de Treinamento Sugerido</div>
            
            <!-- Grid de Parâmetros -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="color: ${colors.primary}; font-weight: 700; font-size: 0.8em; text-transform: uppercase;">Frequência</div>
                    <div style="font-size: 1.1em; font-weight: 600; color: ${colors.darkText};">3x por semana</div>
                </div>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="color: ${colors.primary}; font-weight: 700; font-size: 0.8em; text-transform: uppercase;">Duração</div>
                    <div style="font-size: 1.1em; font-weight: 600; color: ${colors.darkText};">30–40 min</div>
                </div>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="color: ${colors.primary}; font-weight: 700; font-size: 0.8em; text-transform: uppercase;">Volume</div>
                    <div style="font-size: 1.1em; font-weight: 600; color: ${colors.darkText};">3 Séries x 12 Reps</div>
                </div>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="color: ${colors.primary}; font-weight: 700; font-size: 0.8em; text-transform: uppercase;">Intervalo</div>
                    <div style="font-size: 1.1em; font-weight: 600; color: ${colors.darkText};">60–90 seg</div>
                </div>
            </div>

            <!-- Explicação de Intensidade -->
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                <h4 style="margin: 0 0 10px; color: #92400e; font-size: 1em;">🔹 O que é Intensidade Moderada?</h4>
                <p style="margin: 0; font-size: 0.95em; color: #78350f; line-height: 1.6;">
                    Significa escolher uma carga que permita completar as 12 repetições com boa técnica. As últimas 2–3 repetições exigem esforço, mas <strong>sem dor articular</strong> ou desconforto. A respiração fica mais acelerada, porém ainda é possível falar frases curtas. A sensação final deve ser de "músculo trabalhado", não de exaustão total.
                </p>
            </div>

            <!-- Mobilidade -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: ${colors.secondary}; font-size: 1.1em; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    🧘 Mobilidade Inicial (5 min)
                    <span style="font-size: 0.7em; font-weight: 400; color: #64748b; background: #f1f5f9; padding: 4px 8px; border-radius: 12px;">Realizar antes de todo treino</span>
                </h3>
                <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    <li style="padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9em;">Mobilidade cervical</li>
                    <li style="padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9em;">Elevação e depressão dos ombros</li>
                    <li style="padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9em;">Rotação de tronco (em pé na parede)</li>
                    <li style="padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9em;">Mobilidade de quadril (em pé)</li>
                    <li style="padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.9em;">Mobilidade de tornozelos (parede)</li>
                </ul>
                <div style="font-size: 0.8em; color: ${colors.secondary}; margin-top: 8px; font-style: italic;">
                    *Exercícios executados em pé ou sentada, sem elevação excessiva dos braços acima da cabeça.
                </div>
            </div>

            <!-- Treinos A, B, C -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                
                <!-- TREINO A -->
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: white;">
                    <div style="background: ${colors.primary}; color: white; padding: 12px; text-align: center; font-weight: 700;">🅰️ TREINO A</div>
                    <div style="padding: 20px;">
                        <ul style="padding: 0; margin: 0; list-style: none; font-size: 0.9em; display: flex; flex-direction: column; gap: 8px;">
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Leg press sentada</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Mesa flexora</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Remada baixa (máq.)</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Peck deck (sentada)</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Cadeira abdutora</li>
                            <li>Tríceps polia (sent/pé)</li>
                        </ul>
                    </div>
                </div>

                <!-- TREINO B -->
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: white;">
                    <div style="background: ${colors.secondary}; color: white; padding: 12px; text-align: center; font-weight: 700;">🅱️ TREINO B</div>
                    <div style="padding: 20px;">
                        <ul style="padding: 0; margin: 0; list-style: none; font-size: 0.9em; display: flex; flex-direction: column; gap: 8px;">
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Agachamento (cad/guiado)</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Cadeira extensora</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Remada em pé (cross)</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Crucifixo máq. (sentada)</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Elevação lateral</li>
                            <li>Rosca bíceps (máq/halt)</li>
                        </ul>
                    </div>
                </div>

                <!-- TREINO C -->
                <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: white;">
                    <div style="background: ${colors.success}; color: white; padding: 12px; text-align: center; font-weight: 700;">🅾️ TREINO C</div>
                    <div style="padding: 20px;">
                        <ul style="padding: 0; margin: 0; list-style: none; font-size: 0.9em; display: flex; flex-direction: column; gap: 8px;">
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Step-up baixo (caixa)</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Mesa flexora</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Remada unilateral</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Supino máq. (sentada)</li>
                            <li style="border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Cadeira adutora</li>
                            <li>Tríceps (polia/máq)</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>

        <!-- 7. FOOTER / MENSAGEM FINAL -->
        <div class="footer">
            <div class="footer-msg">"${mensagemFinal}"</div>
            
            <p>Estamos felizes em fazer parte dessa jornada.</p>
            
            <div class="signature">Hassan Mohamed Elsangedy</div>
            <div style="font-size: 0.8em; opacity: 0.6; letter-spacing: 1px; margin-top: 5px;">COORDENADOR DO PROJETO</div>
        </div>

    </div>
</body>
</html>
    `;
};
