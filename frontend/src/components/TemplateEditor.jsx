import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Save, Plus, Trash2, Eye, LayoutTemplate, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function TemplateEditor() {
    const { getToken } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    // --- STATE DO MODELO ---
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");

    // Configuração Estruturada (Schema JSON)
    const [structure, setStructure] = useState({
        tipo_conversa: "Entrevista Estruturada",
        contexto_aplicacao: "",
        elementos_graficos: false,
        secoes: [ // [{ titulo: "", expectativa: "" }]
            { titulo: "Introdução", expectativa: "Breve resumo do início da conversa e identificação dos participantes." }
        ]
    });

    // Prompt Gerado (Read-only ou editável no final)
    const [generatedPrompt, setGeneratedPrompt] = useState("");
    const [manualPromptOverride, setManualPromptOverride] = useState(false);

    // Status Message
    const [message, setMessage] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || "";

    const TIPOS_CONVERSA = [
        "Entrevista Estruturada",
        "Entrevista Semiestruturada",
        "Conversa Livre",
        "Reunião de Trabalho",
        "Orientação Acadêmica",
        "Sessão de Aconselhamento",
        "Outro"
    ];

    // --- EFEITOS ---

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Auto-generate prompt when structure changes (unless overridden)
    useEffect(() => {
        if (!manualPromptOverride) {
            const prompt = generateSystemPrompt();
            setGeneratedPrompt(prompt);
        }
    }, [structure, nome]);

    // --- LOGICA ---

    const fetchTemplates = async () => {
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/templates/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Erro ao buscar templates:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateSystemPrompt = () => {
        let p = `Você é um especialista em análise de ${structure.tipo_conversa}.\n`;
        p += `CONTEXTO: ${structure.contexto_aplicacao || "Geral"}\n\n`;
        p += `Sua tarefa é analisar a transcrição e gerar um relatório JSON com as seguintes chaves/seções:\n\n`;

        structure.secoes.forEach((sec, idx) => {
            const key = sec.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_');
            p += `${idx + 1}. "${key}": ${sec.expectativa} (Título no relatório: "${sec.titulo}")\n`;
        });

        if (structure.elementos_graficos) {
            p += `\nINSTRUÇÃO GRÁFICA: Identifique oportunidades para gráficos (ex: frequência cardíaca, sentimento) e adicione uma chave "sugestoes_graficas".\n`;
        }

        p += `\nIMPORTANTE: A saída deve ser APENAS o JSON válido.`;
        return p;
    };

    const handleAddSection = () => {
        setStructure(prev => ({
            ...prev,
            secoes: [...prev.secoes, { titulo: "Nova Seção", expectativa: "" }]
        }));
    };

    const handleRemoveSection = (index) => {
        setStructure(prev => ({
            ...prev,
            secoes: prev.secoes.filter((_, i) => i !== index)
        }));
    };

    const handleSectionChange = (index, field, value) => {
        const newSecoes = [...structure.secoes];
        newSecoes[index][field] = value;
        setStructure(prev => ({ ...prev, secoes: newSecoes }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = await getToken();
            const payload = {
                nome,
                descricao,
                system_prompt: manualPromptOverride ? generatedPrompt : generateSystemPrompt(),
                schema_json: structure // Salva a estrutura para reedição
            };

            const response = await fetch(`${API_URL}/api/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Modelo salvo com sucesso!' });
                fetchTemplates();
                // Reset form optionally or keep for editing
            } else {
                const err = await response.json();
                setMessage({ type: 'error', text: err.detail || 'Erro ao salvar.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: `Erro: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    const loadTemplate = (t) => {
        setNome(t.nome);
        setDescricao(t.descricao || "");
        if (t.schema_json && t.schema_json.tipo_conversa) {
            setStructure(t.schema_json);
            setManualPromptOverride(false);
        } else {
            // Legacy templates or raw prompt edits
            setManualPromptOverride(true);
            setGeneratedPrompt(t.system_prompt);
            setStructure({
                tipo_conversa: "Outro",
                contexto_aplicacao: "Modelo importado (Prompt manual)",
                elementos_graficos: false,
                secoes: []
            });
        }
    };

    // --- PREVIEW RENDERER ---
    const PreviewModal = () => (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-600" />
                        Simulação do Relatório: {nome || "Novo Modelo"}
                    </h3>
                    <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-red-500">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 font-serif text-slate-800 bg-white">
                    {/* Header Mock */}
                    <div className="border-b pb-6 mb-8 text-center">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Relatório de Análise</h1>
                        <p className="text-slate-500 italic">{structure.tipo_conversa} • {new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Dynamic Sections */}
                    <div className="space-y-8">
                        {structure.secoes.map((sec, idx) => (
                            <div key={idx} className="relative group">
                                <h2 className="text-xl font-bold text-blue-800 mb-3 border-l-4 border-blue-500 pl-3">
                                    {sec.titulo || `Seção ${idx + 1}`}
                                </h2>
                                <p className="text-slate-600 leading-relaxed text-justify">
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded inline-block mb-1 mr-2 opacity-70">
                                        Simulação (Baseado em: {sec.expectativa || "..."})
                                    </span>
                                    <br />
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Graphics Mock */}
                    {structure.elementos_graficos && (
                        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
                            <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                            <h4 className="font-semibold text-slate-600">Área de Elementos Gráficos</h4>
                            <p className="text-sm text-slate-400">Gráficos e insights visuais serão inseridos aqui pela IA.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end">
                    <button onClick={() => setPreviewOpen(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Fechar Simulação
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            {previewOpen && <PreviewModal />}

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 font-display">Crie seu modelo de relatório</h1>
                <p className="text-slate-500 mt-2 max-w-3xl leading-relaxed">
                    Defina a estrutura do seu relatório. Aqui você irá escolher o tipo de conversa (entrevista estruturada, conversa livre, reunião...),
                    quando se aplica, o que se espera obter em cada pergunta e a inclusão de elementos gráficos.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- LEFT: SIDEBAR (LIST) --- */}
                <div className="lg:col-span-3 space-y-4">
                    <button
                        onClick={() => {
                            setNome("");
                            setDescricao("");
                            setStructure({
                                tipo_conversa: "Entrevista Estruturada",
                                contexto_aplicacao: "",
                                elementos_graficos: false,
                                secoes: [{ titulo: "Introdução", expectativa: "" }]
                            });
                            setManualPromptOverride(false);
                            setMessage(null);
                        }}
                        className="w-full py-3 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition flex items-center justify-center gap-2 border border-blue-200"
                    >
                        <Plus className="w-5 h-5" /> Novo Modelo
                    </button>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Modelos Salvos
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => loadTemplate(t)}
                                    className={`p-4 cursor-pointer transition hover:bg-slate-50 ${t.nome === nome ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""}`}
                                >
                                    <div className="font-semibold text-slate-800 text-sm">{t.nome}</div>
                                    <div className="text-xs text-slate-500 mt-1 truncate">{t.descricao}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: EDITOR FORM --- */}
                <div className="lg:col-span-9">
                    <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8 relative">

                        {/* 1. BASIC INFO */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-2 border-b">
                                <LayoutTemplate className="w-5 h-5 text-blue-600" /> 1. Definições Iniciais
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Modelo</label>
                                    <input
                                        type="text" required value={nome} onChange={e => setNome(e.target.value)}
                                        placeholder="Ex: Análise Psicológica Inicial"
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Conversa</label>
                                    <select
                                        value={structure.tipo_conversa}
                                        onChange={e => setStructure({ ...structure, tipo_conversa: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        {TIPOS_CONVERSA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quando se aplica?</label>
                                <textarea
                                    rows={2}
                                    value={structure.contexto_aplicacao}
                                    onChange={e => setStructure({ ...structure, contexto_aplicacao: e.target.value })}
                                    placeholder="Descreva o contexto (ex: Pacientes com queixa de ansiedade...)"
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Curta (para a lista)</label>
                                <input
                                    type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </section>

                        {/* 2. STRUCTURE BUILDER */}
                        <section className="space-y-4">
                            <div className="flex justify-between items-end pb-2 border-b">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" /> 2. Estrutura do Relatório
                                </h2>
                                <button type="button" onClick={handleAddSection} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Adicionar Seção
                                </button>
                            </div>
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {structure.secoes.map((sec, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 group">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Seção {idx + 1}</label>
                                            <button type="button" onClick={() => handleRemoveSection(idx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-1">
                                                <input
                                                    type="text"
                                                    placeholder="Título da Seção (Ex: Diagnóstico)"
                                                    value={sec.titulo}
                                                    onChange={(e) => handleSectionChange(idx, 'titulo', e.target.value)}
                                                    className="w-full p-2 border rounded font-medium text-slate-800 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <input
                                                    type="text"
                                                    placeholder="O que se espera obter nesta pergunta/seção?"
                                                    value={sec.expectativa}
                                                    onChange={(e) => handleSectionChange(idx, 'expectativa', e.target.value)}
                                                    className="w-full p-2 border rounded text-slate-600 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. OPTIONS & PREVIEW */}
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-2 border-b">
                                <Sparkles className="w-5 h-5 text-yellow-500" /> 3. Extras e Visualização
                            </h2>
                            <div className="flex items-center gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <input
                                    type="checkbox"
                                    id="graficos"
                                    checked={structure.elementos_graficos}
                                    onChange={(e) => setStructure({ ...structure, elementos_graficos: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="graficos" className="text-slate-700 font-medium cursor-pointer select-none">
                                    Incluir Elementos Gráficos (Gráficos, Tabelas)
                                    <p className="text-xs text-slate-500 font-normal">A IA tentará gerar representações visuais dos dados.</p>
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2"
                            >
                                <Eye className="w-5 h-5" /> Ver Simulação do Relatório
                            </button>
                        </section>

                        {/* ACTIONS */}
                        {message && (
                            <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {message.text}
                            </div>
                        )}

                        <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 font-bold shadow-lg shadow-blue-200 flex items-center gap-2"
                            >
                                {saving ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Modelo</>}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
