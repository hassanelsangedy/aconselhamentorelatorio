import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Save, Plus, AlertCircle, CheckCircle } from 'lucide-react';

export default function TemplateEditor() {
    const { getToken } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");

    // Status Message
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    const API_URL = import.meta.env.VITE_API_URL || "";

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

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        console.log("Saving model...", { nome, API_URL });

        try {
            const token = await getToken();
            const payload = {
                nome,
                descricao,
                system_prompt: systemPrompt,
                schema_json: {} // Empty for now, can be expanded later
            };

            const response = await fetch(`${API_URL}/api/templates/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Modelo salvo com sucesso!' });
                setNome("");
                setDescricao("");
                setSystemPrompt("");
                fetchTemplates(); // Refresh list
            } else {
                let errorText = 'Erro ao salvar modelo.';
                const responseText = await response.text(); // Read once
                console.error("Server Error Response:", responseText); // Log raw response

                try {
                    const err = JSON.parse(responseText);
                    errorText = err.detail || errorText;
                } catch (jsonError) {
                    // Not JSON, likely HTML (404/500)
                    errorText = `Erro ${response.status}: O servidor retornou uma resposta inesperada.`;
                }
                setMessage({ type: 'error', text: errorText });
            }
        } catch (error) {
            console.error("Erro Fatal no Save:", error);
            setMessage({ type: 'error', text: `Erro de conexão: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 font-display">Editor de Modelos (Prompts)</h1>
                <p className="text-slate-500">Crie e gerencie as personalidades da IA.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* FORMULÁRIO */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" /> Novo Modelo
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Modelo</label>
                                <input
                                    type="text"
                                    required
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: Treinador Iniciante"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Curta</label>
                                <input
                                    type="text"
                                    required
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                    placeholder="Ex: Focado em motivação e adaptação"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Prompt do Sistema (Instruções da IA)</label>
                                <textarea
                                    required
                                    rows={10}
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="Você é um especialista em educação física..."
                                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                <p className="text-xs text-slate-400 mt-1">Defina aqui como a IA deve se comportar e analisar o áudio.</p>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                                >
                                    {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Modelo</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* LISTA LATERAL */}
                <div className="md:col-span-1">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-full">
                        <h3 className="font-semibold text-slate-700 mb-4">Modelos Existentes</h3>

                        {loading ? (
                            <p className="text-slate-400 text-sm">Carregando...</p>
                        ) : (
                            <div className="space-y-3">
                                {templates.map(t => (
                                    <div key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition cursor-pointer">
                                        <div className="font-medium text-slate-800">{t.nome}</div>
                                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.descricao}</div>
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <p className="text-sm text-slate-400">Nenhum modelo criado.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
