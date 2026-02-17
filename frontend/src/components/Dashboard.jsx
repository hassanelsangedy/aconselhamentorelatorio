import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileAudio, CheckCircle, AlertCircle, Eye, Loader2, LogOut, FileText, Share2 } from 'lucide-react';
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

    const navigate = useNavigate();

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

    // --- SHARE MODAL STATE ---
    const [shareModal, setShareModal] = useState({ open: false, session: null });
    const [shareEmail, setShareEmail] = useState("");
    const [shareResult, setShareResult] = useState(null); // { link: "", message: "" }
    const [sharing, setSharing] = useState(false);

    const openShareModal = (sessao) => {
        setShareModal({ open: true, session: sessao });
        setShareEmail("");
        setShareResult(null);
    };

    const closeShareModal = () => {
        setShareModal({ open: false, session: null });
    };

    const submitShare = async () => {
        if (!shareEmail) return;
        setSharing(true);
        try {
            const token = await getToken();
            const API_URL = import.meta.env.VITE_API_URL || "";
            const response = await fetch(`${API_URL}/api/sessoes/${shareModal.session.id}/compartilhar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: shareEmail })
            });

            const data = await response.json();
            if (response.ok) {
                setShareResult({
                    message: data.message,
                    link: data.link_acesso
                });
            } else {
                alert(`Erro: ${data.detail}`);
            }
        } catch (error) {
            console.error("Erro ao compartilhar:", error);
            alert("Erro de conexão.");
        } finally {
            setSharing(false);
        }
    };

    const copyLink = () => {
        if (shareResult?.link) {
            navigator.clipboard.writeText(shareResult.link);
            alert("Link copiado!");
        }
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
        <div className="container mx-auto p-6 max-w-5xl relative">

            {/* --- SHARE MODAL --- */}
            {shareModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-blue-600" />
                                Compartilhar Sessão
                            </h3>
                            <button onClick={closeShareModal} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {!shareResult ? (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600">
                                    O destinatário receberá acesso a este relatório. Se ele ainda não tiver conta, um convite será criado.
                                </p>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">E-mail do destinatário</label>
                                    <input
                                        type="email"
                                        value={shareEmail}
                                        onChange={(e) => setShareEmail(e.target.value)}
                                        placeholder="exemplo@email.com"
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={closeShareModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                    <button
                                        onClick={submitShare}
                                        disabled={!shareEmail || sharing}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Convite"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 text-center">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <h4 className="font-medium text-green-800">Convite Enviado!</h4>
                                <p className="text-sm text-slate-600">{shareResult.message}</p>

                                <div className="bg-slate-50 p-3 rounded-lg border flex items-center gap-2 text-left">
                                    <code className="text-xs text-slate-500 break-all flex-1">{shareResult.link}</code>
                                    <button onClick={copyLink} className="p-2 hover:bg-slate-200 rounded text-slate-600" title="Copiar Link">
                                        <FileText className="w-4 h-4" />
                                    </button>
                                </div>

                                <button onClick={closeShareModal} className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                                    Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-2 font-display">Painel de Análises</h1>
                <p className="text-slate-500 text-lg font-light">
                    Sistema Inteligente de geração de relatórios
                </p>
            </header>

            {/* --- SEÇÃO COMO FUNCIONA (CARDS NO TOPO) --- */}
            <section className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
                    {/* PASSO 1 */}
                    <div className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">1. Crie seu Modelo</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Defina o tipo de análise (entrevista, reunião, etc) e o que a IA deve buscar.
                        </p>
                    </div>

                    {/* SETA (Visível em Desktop) */}
                    <div className="hidden md:flex items-center justify-center">
                        <div className="w-full h-0.5 bg-slate-200 relative animate-pulse">
                            <div className="absolute right-0 -top-1.5 w-3 h-3 border-t-2 border-r-2 border-slate-300 rotate-45"></div>
                        </div>
                    </div>

                    {/* PASSO 2 */}
                    <div className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors relative">
                            <div className="absolute inset-0 rounded-full border-2 border-purple-200 animate-ping opacity-20"></div>
                            <Upload className="w-8 h-8 text-purple-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">2. Faça o Upload</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Envie o áudio da conversa. O sistema transcreve e analisa automaticamente.
                        </p>
                    </div>

                    {/* SETA */}
                    <div className="hidden md:flex items-center justify-center">
                        <div className="w-full h-0.5 bg-slate-200 relative animate-pulse delay-75">
                            <div className="absolute right-0 -top-1.5 w-3 h-3 border-t-2 border-r-2 border-slate-300 rotate-45"></div>
                        </div>
                    </div>

                    {/* PASSO 3 */}
                    <div className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">3. Relatório Pronto!</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Visualize, exporte em PDF ou compartilhe o link seguro com seus clientes.
                        </p>
                    </div>
                </div>
            </section>

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
                                                        onClick={() => openShareModal(sessao)}
                                                        className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-lg hover:bg-green-50"
                                                        title="Compartilhar"
                                                    >
                                                        <Share2 className="w-5 h-5" />
                                                    </button>
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
