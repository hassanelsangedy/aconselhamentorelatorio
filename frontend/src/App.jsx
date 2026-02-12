import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TemplateEditor from './components/TemplateEditor';
import ReportPreview from './components/ReportPreview';
import { SignedIn, SignedOut, SignIn, UserButton, useUser } from "@clerk/clerk-react";
import { LayoutDashboard, BrainCircuit } from 'lucide-react';

function Header() {
    const { user } = useUser();
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? "bg-slate-100 text-blue-600" : "text-slate-600 hover:bg-slate-50";

    return (
        <header className="px-6 py-3 border-b bg-white flex justify-between items-center shadow-sm sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
                    <img src="/psicofisio.png" alt="PsicoFisio" className="h-9 object-contain" />
                    {/* <span className="font-display font-bold text-lg text-slate-700">CaurnAtiva</span> */}
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/')}`}>
                        <LayoutDashboard className="w-4 h-4" /> Painel
                    </Link>
                    <Link to="/modelos" className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/modelos')}`}>
                        <BrainCircuit className="w-4 h-4" /> Modelos IA
                    </Link>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {user && <span className="hidden sm:block text-sm text-slate-500">Olá, <strong>{user.firstName}</strong></span>}
                <UserButton showName={false} />
            </div>
        </header>
    );
}

function WelcomeScreen() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
                <div className="flex justify-center mb-6">
                    <img src="/psicofisio.png" alt="Psicofisio" className="h-28 object-contain" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Acesso Restrito</h2>
                <p className="text-gray-600 text-sm">
                    Sistema Inteligente de geração de relatórios.<br />Faça login para continuar.
                </p>

                <div className="flex justify-center pt-2">
                    <SignIn
                        routing="hash"
                        appearance={{
                            elements: {
                                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case w-full',
                                card: 'shadow-none border-none'
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

function App() {
    return (
        <BrowserRouter>
            <SignedOut>
                <WelcomeScreen />
            </SignedOut>

            <SignedIn>
                <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
                    <Header />
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/modelos" element={<TemplateEditor />} />
                        <Route path="/relatorio/:id" element={<ReportPreview />} />
                    </Routes>
                </div>
            </SignedIn>
        </BrowserRouter>
    );
}

export default App;
