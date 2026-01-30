@echo off
REM Script para iniciar backend e frontend em desenvolvimento (Windows)
REM Uso: start-dev.bat

echo 🚀 Iniciando aplicação em modo desenvolvimento...
echo.

REM Verifica se Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Por favor, instale Node.js ^>= 18.0.0
    exit /b 1
)

REM Verifica se as dependências estão instaladas
if not exist "backend\node_modules" (
    echo 📦 Instalando dependências do backend...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Instalando dependências do frontend...
    cd frontend
    call npm install
    cd ..
)

REM Verifica arquivos .env
if not exist "backend\.env" (
    echo ⚠️  Arquivo backend\.env não encontrado!
    echo    Copie backend\.env.example para backend\.env e configure as variáveis
    exit /b 1
)

if not exist "frontend\.env" (
    echo ⚠️  Arquivo frontend\.env não encontrado!
    echo    Copiando frontend\.env.example para frontend\.env...
    copy frontend\.env.example frontend\.env
)

echo.
echo ✅ Dependências verificadas!
echo.
echo 📝 Iniciando servidores...
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:5173
echo.
echo 💡 Pressione Ctrl+C para parar os servidores
echo.

REM Inicia backend em nova janela (raiz do projeto + script --prefix, evita erro "cd backend" quando já está em backend)
start "Backend - App Consumo" cmd /k "cd /d %~dp0 && npm run dev:backend"

REM Aguarda um pouco
timeout /t 2 /nobreak >nul

REM Inicia frontend em nova janela
start "Frontend - App Consumo" cmd /k "cd /d %~dp0 && npm run dev:frontend"

echo.
echo ✅ Servidores iniciados em janelas separadas!
echo.
