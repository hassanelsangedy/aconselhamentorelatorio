import React from 'react'

// DEBUG MOBILE
// DEBUG MOBILE
console.log("JS Principal Carregou! (main.jsx)");
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

// Import CLERK_KEY
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key from .env.local")
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} debug={true}>
            <App />
        </ClerkProvider>
    </React.StrictMode>,
)

// Global Error Handler for Mobile Debugging
window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `<h3>Erro Detectado:</h3><p>${message}</p><p>${source}:${lineno}</p>`;
    document.body.appendChild(errorDiv);
};
