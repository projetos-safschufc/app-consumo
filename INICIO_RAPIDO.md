# ⚡ Início Rápido - Dashboard de Consumo

Guia rápido para executar a aplicação em 5 minutos.

## 🎯 Pré-requisitos

- Node.js 18+ instalado
- Acesso ao banco PostgreSQL

## 🚀 Execução Rápida

### Windows:
```bash
start-dev.bat
```

### Linux/Mac:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

## 📝 Configuração Mínima

### 1. Backend - Criar `.env`:
```bash
cd backend
copy .env.example .env
```

Editar `backend/.env`:
```env
DB_HOST=pgpool1.ebserh
DB_PORT=5432
DB_NAME=powerbi
DB_USER=seu_usuario
DB_PASSWORD="sua_senha"
```

### 2. Frontend - Criar `.env`:
```bash
cd frontend
copy .env.example .env
```

O arquivo `frontend/.env` já está configurado por padrão.

## ✅ Verificar

1. **Backend**: http://localhost:5000/api/health
2. **Frontend**: http://localhost:5173

## 🔧 Comandos Úteis

**A partir da raiz do projeto** (evita erro "cd backend" / "cd frontend" quando o terminal já está na pasta):
```bash
npm run dev:backend   # Backend (porta 5001)
npm run dev:frontend  # Frontend (porta 5173)
```

**Dentro de cada pasta:**
```bash
# Backend
cd backend
npm install          # Instalar dependências
npm run dev          # Desenvolvimento
npm start            # Produção

# Frontend
cd frontend
npm install          # Instalar dependências
npm run dev          # Desenvolvimento
npm run build        # Build produção
```
**Dica:** Se aparecer "não é possível localizar o caminho ...\backend\backend", o terminal já está em `backend`. Rode `npm run dev` direto ou volte à raiz (`cd ..`) e use `npm run dev:backend`.

## ❌ Problemas Comuns

**Porta em uso? (EADDRINUSE)**
```bash
# Verificar processo na porta
cd backend
npm run check-port

# Encerrar processo automaticamente
npm run kill-port

# Ou altere APP_PORT no backend/.env
```

**Erro de conexão com banco?**
- Verifique credenciais no `backend/.env`
- Teste: `psql -h pgpool1.ebserh -U seu_usuario -d powerbi`

**CORS error?**
- Verifique `CORS_ORIGINS` no `backend/.env`

---

📖 **Para mais detalhes, consulte:** `GUIA_EXECUCAO.md`
