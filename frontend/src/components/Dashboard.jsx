import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileAudio, CheckCircle, AlertCircle, Eye, Loader2, LogOut, FileText } from 'lucide-react';
import Dropzone from './Dropzone';
import { generateHTMLReport } from '../utils/reportGenerator';
import { useAuth } from '@clerk/clerk-react';

export default function Dashboard() {
    const [sessoes, setSessoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth(); // Clerk Auth Token

    const fetchSessoes = async () => {
        try {
            const token = await getToken();
            const API_URL = import.meta.env.VITE_API_URL || "";
            const response = await fetch(`${API_URL}/api/sessoes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    setSessoes(data.sort((a, b) => new Date(b.data_upload) - new Date(a.data_upload)));
                } catch (e) {
                    console.error("Erro ao fazer parse da resposta das sessões:", e, text);
                }
            } else {
                console.error("Falha ao buscar sessões:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Erro ao buscar sessões:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessoes();
        // Auto-refresh a cada 5 segundos para atualizar status
        const interval = setInterval(fetchSessoes, 5000);
        return () => clearInterval(interval);
    }, []);

    const navigate = useNavigate(); // Add hook

    const handleReport = (sessao) => {
        if (!sessao.analise_json) {
            alert("Análise ainda não concluída.");
            return;
        }
        // Generate HTML Report URL
        const html = generateHTMLReport(sessao.analise_json, null, window.location.origin + '/logos/caurnpersonaldigital.jpeg', window.location.origin + '/psicofisio.png');
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const handleDownloadPDF = (sessao) => {
        if (!sessao.analise_json) {
            alert("Análise ainda não concluída.");
            return;
        }
        const html = generateHTMLReport(sessao.analise_json, null, window.location.origin + '/logos/caurnpersonaldigital.jpeg', window.location.origin + '/psicofisio.png');

        // Inject auto-download script
        const autoDownloadScript = `
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        if(typeof downloadPDF === 'function') {
                            downloadPDF();
                        } else {
                            console.error('Função downloadPDF não encontrada');
                        }
                    }, 1000); // Wait for resources
                }
            </script>
        `;

        const finalHtml = html.replace('</body>', `${autoDownloadScript}</body>`);
        const blob = new Blob([finalHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Open in new tab which will auto-download
        window.open(url, '_blank');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONCLUIDO': return 'bg-green-100 text-green-800 border-green-200';
            case 'ERRO': return 'bg-red-100 text-red-800 border-red-200';
            case 'PROCESSANDO_AUDIO': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-2 font-display">Painel de Análises</h1>
                <p className="text-slate-500 text-lg font-light">
                    Sistema Inteligente de geração de relatórios
                </p></header>

            <section className="mb-12">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <Dropzone onUploadSuccess={fetchSessoes} />
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-700">Histórico de Processamento</h2>
                    <button onClick={fetchSessoes} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <Loader2 className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="p-4 border-b border-slate-200">Participante</th>
                                <th className="p-4 border-b border-slate-200">Modelo</th>
                                <th className="p-4 border-b border-slate-200">Data Upload</th>
                                <th className="p-4 border-b border-slate-200">Status</th>
                                <th className="p-4 border-b border-slate-200 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sessoes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">
                                        Nenhuma sessão encontrada. Faça um upload para começar.
                                    </td>
                                </tr>
                            ) : (
                                sessoes.map((sessao) => (
                                    <tr key={sessao.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-700 font-medium">
                                            {sessao.participante ? sessao.participante.nome_codigo : `Sessão #${sessao.id}`}
                                        </td>
                                        <td className="p-4 text-slate-600 text-sm">
                                            {sessao.modelo_nome || "Padrão"}
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">
                                            {new Date(sessao.data_upload).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(sessao.status)}`}>
                                                {sessao.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {sessao.status === 'CONCLUIDO' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleReport(sessao)}
                                                        className="text-primary hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                                                        title="Ver Relatório"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadPDF(sessao)}
                                                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                        title="Baixar PDF"
                                                    >
                                                        <FileText className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
