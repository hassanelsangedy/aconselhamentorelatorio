#!/bin/bash

# Define project root
PROJECT_ROOT=$(pwd)

echo "🚀 Iniciando Sistema Psicofisio..."
echo "📂 Diretório do Projeto: $PROJECT_ROOT"

# Trap CTRL+C to kill all background processes
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# --- CHECK ENVIRONMENT ---
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env não encontrado!"
fi

# --- START BACKEND ---
echo "🔹 Iniciando Backend (Porta 8000)..."
cd backend || exit
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
uvicorn app.main:app --host 0.0.0.0 --reload --port 8000 &
BACKEND_PID=$!
cd "$PROJECT_ROOT" || exit

# --- START FRONTEND ---
echo "🔹 Iniciando Frontend (Porta 3000)..."
cd frontend || exit
npm run dev -- --port 3000 &
FRONTEND_PID=$!
cd "$PROJECT_ROOT" || exit

echo "✅ Sistema iniciado com sucesso!"
echo "📡 API Status: http://localhost:8000"
echo "💻 Aplicação:  http://localhost:3000"
echo "📝 Logs de execução abaixo..."
echo "🔴 Pressione CTRL+C para encerrar tudo."

# Wait indefinitely
wait
