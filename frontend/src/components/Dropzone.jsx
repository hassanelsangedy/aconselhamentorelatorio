import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

export default function Dropzone({ onUploadSuccess }) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const { getToken } = useAuth(); // Clerk Token

    // Fetch Templates on Mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const token = await getToken();
                const API_URL = import.meta.env.VITE_API_URL || "";
                const res = await fetch(`${API_URL}/api/templates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data);
                    if (data.length > 0) setSelectedTemplate(data[0].id); // Select first by default
                }
            } catch (err) {
                console.error("Erro ao carregar templates:", err);
            }
        };
        fetchTemplates();
    }, [getToken]);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await uploadFile(files[0]);
        }
    };

    const handleChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            await uploadFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file) => {
        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);
        if (selectedTemplate) {
            formData.append('modelo_id', selectedTemplate);
        }

        try {
            const token = await getToken();
            const API_URL = import.meta.env.VITE_API_URL || "";
            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erro no upload');
            }

            const data = await response.json();
            setMessage({ type: 'success', text: `Upload concluído! Processando...` });
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error("Upload error:", error);
            setMessage({ type: 'error', text: `Falha: ${error.message}` });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Template Selector */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Modelo de Análise:</label>
                <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    disabled={uploading}
                >
                    {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                    {templates.length === 0 && <option>Carregando modelos...</option>}
                </select>
                <span className="text-xs text-slate-400 hidden sm:inline-block">
                    {templates.find(t => t.id == selectedTemplate)?.descricao || ""}
                </span>
            </div>

            {/* Drop Zone */}
            <div
                className={`
                    border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer relative
                    ${dragging ? 'border-teal-500 bg-teal-50 scale-[1.01]' : 'border-slate-300 hover:border-teal-300 hover:bg-slate-50'}
                    ${uploading ? 'opacity-80 pointer-events-none' : ''}
                `}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
            >
                <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    onChange={handleChange}
                    accept="audio/*"
                />

                <div className="flex flex-col items-center justify-center gap-4">
                    {uploading ? (
                        <div className="animate-pulse flex flex-col items-center">
                            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
                            <p className="text-slate-600 font-medium">Enviando arquivo...</p>
                        </div>
                    ) : (
                        <>
                            <div className={`p-4 rounded-full ${dragging ? 'bg-teal-100' : 'bg-slate-100'}`}>
                                <Upload className={`w-8 h-8 ${dragging ? 'text-teal-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-slate-700">Arraste e solte seus áudios aqui</p>
                                <p className="text-sm text-slate-500 mt-1">Ou clique para selecionar arquivos do computador</p>
                            </div>
                        </>
                    )}
                </div>

                {message && (
                    <div className={`mt-6 p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
