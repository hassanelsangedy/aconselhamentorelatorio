import React from 'react';
import Dashboard from './components/Dashboard';
import { SignedIn, SignedOut, SignIn, UserButton, useUser } from "@clerk/clerk-react";

function Header() {
    const { user } = useUser();
    return (
        <header className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
                <img src="/psicofisio.png" alt="PsicoFisio" className="h-10 object-contain" />
                {/* <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">CaurnAtiva</span> */}
            </div>
            <div className="flex items-center gap-4">
                {user && <span className="text-sm text-gray-600">Olá, {user.firstName}!</span>}
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

                <h2 className="text-2xl font-bold text-gray-900">Bem-vindo ao Psicofisio</h2>
                <p className="text-gray-600">
                    Sistema Inteligente de Aconselhamento de Atividade Física. Faça login para acessar.
                </p>

                <div className="flex justify-center pt-4">
                    <SignIn
                        routing="hash"
                        appearance={{
                            elements: {
                                formButtonPrimary: 'bg-teal-600 hover:bg-teal-700 text-sm normal-case'
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
        <>
            <SignedOut>
                <WelcomeScreen />
            </SignedOut>

            <SignedIn>
                <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
                    <Header />
                    <Dashboard />
                </div>
            </SignedIn>
        </>
    );
}

export default App;
