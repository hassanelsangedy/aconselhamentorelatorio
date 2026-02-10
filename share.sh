#!/bin/bash

# Define project root
PROJECT_ROOT=$(pwd)

echo "🛑 Parando processos anteriores..."
# Attempt to kill processes running on ports 3000 and 8000
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

echo "🚀 Preparando Sistema para Compartilhamento..."
echo "📂 Diretório do Projeto: $PROJECT_ROOT"
echo "🌐 IP Local Detectado: 192.168.0.13"

# Trap CTRL+C
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# --- CHECK ENVIRONMENT ---
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env não encontrado!"
fi

# --- INSTALL FRONTEND DEPS (FIX BLANK PAGE) ---
echo "📦 Verificando dependências do Frontend..."
cd frontend
if [ ! -d "node_modules" ] || [ ! -d "node_modules/@clerk" ]; then
    echo "⬇️  Instalando bibliotecas (pode demorar um pouco)..."
    npm install
fi
cd "$PROJECT_ROOT"

# --- START BACKEND ---
echo "🔹 Iniciando Backend (Porta 8000)..."
cd backend || exit
source venv/bin/activate
# Install requirements if missing
pip install -r requirements.txt > /dev/null 2>&1
uvicorn app.main:app --host 0.0.0.0 --reload --port 8000 &
BACKEND_PID=$!
cd "$PROJECT_ROOT" || exit

# --- START FRONTEND ---
echo "🔹 Iniciando Frontend (Porta 3000)..."
cd frontend || exit
# Ensure we bind to host
npm run dev -- --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
cd "$PROJECT_ROOT" || exit

echo "✅ SISTEMA NO AR!"
echo "---------------------------------------------------"
echo "🏠 Acesso Local (Você):     http://localhost:3000"
echo "📡 Acesso Externo (Outros): http://192.168.0.13:3000"
echo "---------------------------------------------------"
echo "📝 Logs de execução abaixo..."
echo "🔴 Pressione CTRL+C para encerrar tudo."

wait
