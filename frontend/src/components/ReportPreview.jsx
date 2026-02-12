import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, ArrowLeft, Printer, Edit2, Check, X, Save } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function ReportPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [sessao, setSessao] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Editable Content State
    const [reportData, setReportData] = useState(null);
    const reportRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || "";

    useEffect(() => {
        fetchSession();
    }, [id]);

    const fetchSession = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/sessoes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSessao(data);
                if (data.analise_json) {
                    setReportData(data.analise_json);
                }
            } else {
                console.error("Erro ao buscar sessão");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const element = reportRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            // Calculate height to maintain aspect ratio
            const imgProps = pdf.getImageProperties(imgData);
            const pdfH = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfH);
            pdf.save(`Relatorio_${sessao?.participante?.nome_codigo || 'Participante'}.pdf`);
        } catch (err) {
            console.error('Erro ao gerar PDF', err);
            alert('Erro ao gerar PDF: ' + err.message);
        }
    };

    const handleSaveEdits = async () => {
        if (!reportData) return;
        // Here we would ideally save the edited JSON back to the backend
        // For now, we just exit edit mode as the state is updated locally
        // TODO: Implement backend update endpoint
        /*
        try {
            const token = await getToken();
            await fetch(`${API_URL}/api/sessoes/${id}/update_data`, {
                method: 'PUT',
                body: JSON.stringify(reportData)
                ...
            });
        }
        */
        setIsEditing(false);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (!sessao || !reportData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p>Relatório não encontrado ou incompleto.</p>
                <button onClick={() => navigate('/')} className="text-primary hover:underline">Voltar</button>
            </div>
        );
    }

    // Helper to render editable text/textarea
    const EditableText = ({ value, accesor, className, multiline = false }) => {
        if (!isEditing) return <span className={className} dangerouslySetInnerHTML={{ __html: value?.replace(/\n/g, '<br/>') }} />;

        const handleChange = (e) => {
            const keys = accesor.split('.');
            let newData = { ...reportData };
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = e.target.value;
            setReportData(newData);
        };

        if (multiline) {
            return <textarea value={value} onChange={handleChange} className={`w-full p-2 border rounded ${className}`} rows={4} />;
        }
        return <input type="text" value={value} onChange={handleChange} className={`w-full p-1 border rounded ${className}`} />;
    };

    const colors = {
        primary: '#0095DA',
        secondary: '#ef4444',
        success: '#10B981',
        text: '#334155',
        darkText: '#0f172a',
    };

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white print:p-0">
            {/* Toolbar - Hidden when printing */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm p-4 flex justify-between items-center z-50 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-semibold text-slate-800">Visualização do Relatório</h1>
                    {isEditing ? (
                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <Edit2 className="w-3 h-3" /> MODO EDIÇÃO
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    {/* 
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border">
                            <Edit2 className="w-4 h-4" /> Editar
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                            <button onClick={handleSaveEdits} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">
                                <Save className="w-4 h-4" /> Salvar (Local)
                            </button>
                        </>
                    )}
                    */}
                    {/* Edit is momentarily disabled until backend support exists or we decide on local-only */}

                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg shadow-sm">
                        Baixar PDF
                    </button>
                </div>
            </div>

            {/* Report Container */}
            <div className="pt-24 pb-20 print:pt-0 print:pb-0 flex justify-center">
                <div ref={reportRef} className="bg-white w-[210mm] min-h-[297mm] p-[40px] shadow-lg print:shadow-none print:w-full print:min-h-0 mx-auto rounded-xl">

                    {/* Header */}
                    <div className="flex justify-between items-center border-b pb-8 mb-8">
                        <div><img src="/logos/psicofisio1.png" alt="Psicofisio" className="h-20 object-contain" /></div>
                        <div><img src="/logos/caurnpersonaldigital.jpeg" alt="Logo Central" className="h-20 object-contain" /></div>
                        <div className="text-xl font-bold text-slate-800">PSICOFISIO</div>
                    </div>

                    {/* Greeting & Meaning */}
                    <div className="mb-10">
                        <div className="text-xl text-slate-900 font-semibold mb-6 font-serif">
                            <EditableText
                                value={reportData.boas_vindas || `Olá, ${sessao.participante?.nome_codigo?.split(' ')[0]}!`}
                                accesor="boas_vindas"
                                multiline
                            />
                        </div>

                        <div className="bg-blue-50 border-l-4 border-primary p-6 rounded-r-lg">
                            <span className="block text-xs font-bold text-primary tracking-widest mb-2 uppercase">Para você, o movimento é:</span>
                            <div className="text-2xl font-serif text-blue-900 italic">
                                "<EditableText value={reportData.significado_movimento} accesor="significado_movimento" />"
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Routine */}
                    <div className="mb-8">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-primary uppercase tracking-wide mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary">👤</div>
                            Identificação e Sua Rotina
                        </h3>
                        <div className="text-slate-600 text-justify leading-relaxed">
                            <EditableText value={reportData.identificacao_rotina} accesor="identificacao_rotina" multiline />
                        </div>
                    </div>

                    {/* Section 2: Health */}
                    <div className="mb-8">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-secondary uppercase tracking-wide mb-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-secondary">❤️</div>
                            Saúde e Cuidado
                        </h3>
                        <div className="text-slate-600 text-justify leading-relaxed">
                            <EditableText value={reportData.saude_cuidado} accesor="saude_cuidado" multiline />
                        </div>
                    </div>

                    {/* Section 3: Motivation */}
                    <div className="mb-8">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-yellow-600 uppercase tracking-wide mb-3">
                            ✨ Sua Motivação
                        </h3>
                        <div className="text-slate-600 text-justify leading-relaxed">
                            <EditableText value={reportData.motivacao_traduzida} accesor="motivacao_traduzida" multiline />
                        </div>
                    </div>

                    {/* META SENSATA */}
                    <div className="my-10 bg-green-50 p-8 border-y-2 border-dashed border-green-300 text-center">
                        <h3 className="flex items-center justify-center gap-3 text-lg font-bold text-green-800 uppercase tracking-wide mb-3">
                            🎯 Nossa Meta Sensata
                        </h3>
                        <div className="text-lg text-green-900 font-medium">
                            <EditableText value={reportData.meta_sensata} accesor="meta_sensata" multiline />
                        </div>
                    </div>

                    {/* Section 5: Strategy */}
                    <div className="mb-8">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-primary uppercase tracking-wide mb-3">
                            📋 Estratégia de Treino
                        </h3>
                        <div className="text-slate-600 text-justify leading-relaxed mb-6">
                            <EditableText value={reportData.estrategia_treino} accesor="estrategia_treino" multiline />
                        </div>

                        {/* Tech Grid */}
                        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                            {[
                                { icon: '🏋️', title: 'Seleção dos Exercícios', val: reportData.justificativa_tecnica_detalhada?.selecao_exercicios, key: 'justificativa_tecnica_detalhada.selecao_exercicios' },
                                { icon: '🔄', title: 'Séries e Repetições', val: reportData.justificativa_tecnica_detalhada?.volume_series_reps, key: 'justificativa_tecnica_detalhada.volume_series_reps' },
                                { icon: '⏱️', title: 'Intervalo de Descanso', val: reportData.justificativa_tecnica_detalhada?.intervalo_descanso, key: 'justificativa_tecnica_detalhada.intervalo_descanso' },
                                { icon: '🐌', title: 'Cadência (Velocidade)', val: reportData.justificativa_tecnica_detalhada?.cadencia_velocidade, key: 'justificativa_tecnica_detalhada.cadencia_velocidade' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-xl h-10 w-10 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h4>
                                        <p className="text-sm text-slate-500 leading-snug">
                                            <EditableText value={item.val} accesor={item.key} />
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="page-break print:break-before-page"></div>

                    {/* Section 6: Plan */}
                    <div className="mb-8 mt-8">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800 uppercase tracking-wide mb-6">
                            🏋️ Plano de Treinamento Sugerido
                        </h3>

                        {/* Parameters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Frequência', val: '3x por semana' },
                                { label: 'Duração', val: '30–40 min' },
                                { label: 'Volume', val: '3 Séries x 12 Reps' },
                                { label: 'Intervalo', val: '60–90 seg' },
                            ].map((p, i) => (
                                <div key={i} className="bg-slate-100 p-4 rounded-lg text-center border border-slate-200">
                                    <div className="text-xs font-bold text-primary uppercase mb-1">{p.label}</div>
                                    <div className="font-semibold text-slate-800">{p.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Intensity Explanation */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-8">
                            <h4 className="font-bold text-yellow-800 mb-2 text-sm">🔹 O que é Intensidade Moderada?</h4>
                            <p className="text-sm text-yellow-900 leading-relaxed">
                                Escolha uma carga para completar 12 repetições com boa técnica. As últimas 2–3 repetições devem ser desafiadoras, mas <strong>sem dor</strong>. Sensação de "músculo trabalhado", não exaustão.
                            </p>
                        </div>

                        {/* Mobility */}
                        <div className="mb-8">
                            <h3 className="text-md font-bold text-secondary mb-4 flex items-center gap-2">
                                🧘 Mobilidade Inicial (5 min)
                                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Antes do treino</span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {['Mobilidade cervical', 'Elevação de ombros', 'Rotação de tronco (parede)', 'Mobilidade de quadril', 'Mobilidade de tornozelos'].map(m => (
                                    <div key={m} className="text-sm p-3 bg-slate-50 border rounded text-slate-600">{m}</div>
                                ))}
                            </div>
                        </div>

                        {/* Workouts A, B, C */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { name: 'TREINO A', color: 'bg-primary', items: ['Leg press sentada', 'Mesa flexora', 'Remada baixa', 'Peck deck', 'Cadeira abdutora', 'Tríceps polia'] },
                                { name: 'TREINO B', color: 'bg-red-500', items: ['Agachamento (guiado)', 'Cadeira extensora', 'Remada em pé', 'Crucifixo máq.', 'Elevação lateral', 'Rosca bíceps'] },
                                { name: 'TREINO C', color: 'bg-green-500', items: ['Step-up baixo', 'Mesa flexora', 'Remada unilateral', 'Supino máq.', 'Cadeira adutora', 'Tríceps (máq)'] }
                            ].map((t, i) => (
                                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className={`${t.color} text-white font-bold text-center py-2 text-sm`}>{t.name}</div>
                                    <ul className="p-4 space-y-2">
                                        {t.items.map(item => (
                                            <li key={item} className="text-sm text-slate-600 border-b border-slate-100 pb-1 last:border-0">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-800 text-white p-12 text-center rounded-xl mt-12 print:bg-slate-800 print:text-white">
                        <div className="font-serif italic text-lg opacity-90 mb-6">
                            "<EditableText value={reportData.mensagem_final || "Conte conosco!"} accesor="mensagem_final" />"
                        </div>
                        <p className="text-sm opacity-70 mb-8">Estamos felizes em fazer parte dessa jornada.</p>

                        <div className="font-display text-2xl text-primary font-cursive">Hassan Mohamed Elsangedy</div>
                        <div className="text-xs opacity-50 tracking-widest mt-1">COORDENADOR DO PROJETO</div>
                    </div>

                </div>
            </div>
        </div>
    );
}
