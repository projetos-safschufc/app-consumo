#!/bin/bash

# Script para iniciar backend e frontend em desenvolvimento
# Uso: ./start-dev.sh

echo "🚀 Iniciando aplicação em modo desenvolvimento..."
echo ""

# Verifica se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js >= 18.0.0"
    exit 1
fi

# Verifica se as dependências estão instaladas
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependências do backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    cd frontend && npm install && cd ..
fi

# Verifica arquivos .env
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Arquivo backend/.env não encontrado!"
    echo "   Copie backend/.env.example para backend/.env e configure as variáveis"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Arquivo frontend/.env não encontrado!"
    echo "   Copiando frontend/.env.example para frontend/.env..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "✅ Dependências verificadas!"
echo ""
echo "📝 Iniciando servidores..."
echo "   Backend: http://localhost:5000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "💡 Pressione Ctrl+C para parar os servidores"
echo ""

# Inicia backend em background
cd backend && npm run dev &
BACKEND_PID=$!

# Aguarda um pouco para o backend iniciar
sleep 2

# Inicia frontend
cd ../frontend && npm run dev &
FRONTEND_PID=$!

# Aguarda sinais de interrupção
trap "echo ''; echo '🛑 Parando servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Aguarda processos
wait
