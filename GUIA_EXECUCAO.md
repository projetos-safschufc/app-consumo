# 📖 Guia de Execução - Dashboard de Consumo de Materiais

Este guia fornece instruções passo a passo para executar a aplicação em diferentes ambientes.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação Inicial](#instalação-inicial)
3. [Configuração](#configuração)
4. [Execução em Desenvolvimento](#execução-em-desenvolvimento)
5. [Execução em Produção](#execução-em-produção)
6. [Verificação e Testes](#verificação-e-testes)
7. [Solução de Problemas](#solução-de-problemas)
8. [Scripts de Automação](#scripts-de-automação)

---

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

### Obrigatórios:
- **Node.js** versão 18.0.0 ou superior
- **npm** (geralmente vem com Node.js) ou **yarn**
- **Acesso ao banco de dados PostgreSQL**

### Verificar Instalação:

**Windows (PowerShell):**
```powershell
node --version    # Deve mostrar v18.0.0 ou superior
npm --version     # Deve mostrar a versão do npm
```

**Linux/Mac:**
```bash
node --version    # Deve mostrar v18.0.0 ou superior
npm --version     # Deve mostrar a versão do npm
```

### Instalar Node.js (se necessário):
- **Windows/Mac**: Baixe em [nodejs.org](https://nodejs.org/)
- **Linux**: Use o gerenciador de pacotes
  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  
  # Fedora/RHEL
  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
  sudo yum install -y nodejs
  ```

---

## 📦 Instalação Inicial

### Passo 1: Clonar/Baixar o Projeto

Se você ainda não tem o projeto:
```bash
# Navegue até o diretório do projeto
cd c:\Users\ivalnei.sena\EBSERH\PROJECTOS\TESTES\app_consumo
```

### Passo 2: Instalar Dependências do Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Aguarde a instalação concluir
```

**O que será instalado:**
- express (framework web)
- pg (cliente PostgreSQL)
- cors (controle de CORS)
- helmet (segurança HTTP)
- express-rate-limit (limite de requisições)
- dotenv (variáveis de ambiente)

### Passo 3: Instalar Dependências do Frontend

```bash
# Volte para a raiz e entre na pasta do frontend
cd ..
cd frontend

# Instale as dependências
npm install

# Aguarde a instalação concluir
```

**O que será instalado:**
- react e react-dom (biblioteca React)
- vite (build tool)
- chart.js e react-chartjs-2 (gráficos)
- Outras dependências de desenvolvimento

---

## ⚙️ Configuração

### Configuração do Backend

#### 1. Criar arquivo `.env`

```bash
# Na pasta backend
cd backend

# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

#### 2. Editar o arquivo `.env`

Abra o arquivo `backend/.env` em um editor de texto e configure:

```env
# Configuração da aplicação
APP_HOST=0.0.0.0
APP_PORT=5000
NODE_ENV=development
APP_DEBUG=false

# CORS - separar múltiplas origens por vírgula
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Configuração do banco de dados PostgreSQL
DB_HOST=pgpool1.ebserh
DB_PORT=5432
DB_NAME=powerbi
DB_USER=seu_usuario_aqui
DB_PASSWORD="sua_senha_aqui"
DB_SSLMODE=prefer
```

**⚠️ IMPORTANTE:**
- Substitua `seu_usuario_aqui` pelo seu usuário do banco
- Substitua `sua_senha_aqui` pela sua senha do banco
- **NUNCA** compartilhe ou versiona o arquivo `.env`
- O arquivo `.env` já está no `.gitignore`

### Configuração do Frontend

#### 1. Criar arquivo `.env`

```bash
# Na pasta frontend
cd frontend

# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

#### 2. Editar o arquivo `.env`

Abra o arquivo `frontend/.env` e configure:

```env
# URL base da API backend
VITE_API_BASE=http://localhost:5000/api
```

**Nota:** Se o backend estiver em outro host/porta, ajuste a URL.

---

## 🚀 Execução em Desenvolvimento

### Método 1: Scripts Automatizados (Recomendado)

#### Windows:
```bash
# Na raiz do projeto
start-dev.bat
```

Este script:
- Verifica se Node.js está instalado
- Instala dependências se necessário
- Verifica arquivos `.env`
- Inicia backend e frontend em janelas separadas

#### Linux/Mac:
```bash
# Na raiz do projeto
chmod +x start-dev.sh
./start-dev.sh
```

### Método 2: Manual (Dois Terminais)

#### Terminal 1 - Backend:

```bash
# Navegue até a pasta do backend
cd backend

# Execute em modo desenvolvimento (com watch)
npm run dev
```

**Saída esperada:**
```
🚀 Servidor rodando em http://0.0.0.0:5000
📊 Ambiente: development
🔗 API disponível em http://0.0.0.0:5000/api
```

#### Terminal 2 - Frontend:

```bash
# Navegue até a pasta do frontend
cd frontend

# Execute em modo desenvolvimento
npm run dev
```

**Saída esperada:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Acessar a Aplicação

1. **Backend API**: http://localhost:5000/api
2. **Frontend**: http://localhost:5173

---

## 🏭 Execução em Produção

### Backend em Produção

#### 1. Build e Inicialização

```bash
cd backend

# Instalar apenas dependências de produção
npm install --production

# Iniciar o servidor
npm start
```

#### 2. Usando PM2 (Recomendado para produção)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
cd backend
pm2 start src/server.js --name "app-consumo-backend"

# Ver status
pm2 status

# Ver logs
pm2 logs app-consumo-backend

# Parar aplicação
pm2 stop app-consumo-backend

# Reiniciar aplicação
pm2 restart app-consumo-backend
```

#### 3. Configuração com Nginx (Opcional)

Crie um arquivo de configuração do Nginx (`/etc/nginx/sites-available/app-consumo`):

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Frontend em Produção

#### 1. Build do Frontend

```bash
cd frontend

# Criar build de produção
npm run build
```

Isso criará a pasta `frontend/dist/` com os arquivos otimizados.

#### 2. Servir os Arquivos

**Opção A - Servidor HTTP simples:**
```bash
cd frontend/dist

# Python
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000
```

**Opção B - Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /caminho/para/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Opção C - Vite Preview:**
```bash
cd frontend
npm run preview
```

---

## ✅ Verificação e Testes

### 1. Verificar Backend

#### Health Check Básico:
```bash
curl http://localhost:5000/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T..."
}
```

#### Health Check com Banco:
```bash
curl http://localhost:5000/api/health/check
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-28T..."
}
```

### 2. Verificar Endpoints da API

Teste alguns endpoints:

```bash
# Consumo mensal por material
curl http://localhost:5000/api/consumo-mensal-material

# Média mensal
curl http://localhost:5000/api/media-mensal-material

# Tendência últimos 6 meses
curl http://localhost:5000/api/tendencia-ultimos-6-meses
```

### 3. Verificar Frontend

1. Abra o navegador em http://localhost:5173
2. Verifique se os gráficos carregam
3. Abra o Console do navegador (F12) e verifique se há erros
4. Verifique se os dados são atualizados automaticamente

---

## 🔧 Solução de Problemas

### Problema: "Cannot find module"

**Solução:**
```bash
# Remova node_modules e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Port already in use" (EADDRINUSE)

**Solução Rápida - Usar Scripts:**

```bash
# Verificar qual processo está usando a porta
cd backend
npm run check-port

# Ou especificar outra porta
npm run check-port 5001

# Encerrar processos automaticamente (use com cuidado!)
npm run kill-port

# Ou especificar porta
npm run kill-port 5001
```

**Solução Manual:**

```bash
# Windows - Encontrar processo na porta 5000
netstat -ano | findstr :5000

# Linux/Mac - Encontrar processo na porta 5000
lsof -i :5000

# Matar processo (substitua PID pelo número do processo)
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

**Alternativa - Alterar Porta:**

Altere a porta no `backend/.env`:
```env
APP_PORT=5001
```

E também atualize o `frontend/.env`:
```env
VITE_API_BASE=http://localhost:5001/api
```

**⚠️ Nota:** O servidor agora mostra mensagens de erro mais claras quando a porta está em uso, incluindo instruções específicas para sua plataforma.

### Problema: "Database connection error"

**Verificações:**
1. Confirme que as credenciais no `.env` estão corretas
2. Verifique se o banco está acessível:
   ```bash
   # Teste de conexão PostgreSQL
   psql -h pgpool1.ebserh -p 5432 -U seu_usuario -d powerbi
   ```
3. Verifique firewall/rede
4. Confirme que `DB_SSLMODE` está correto

### Problema: "CORS error" no navegador

**Solução:**
1. Verifique se `CORS_ORIGINS` no backend `.env` inclui a URL do frontend
2. Se estiver usando uma porta diferente, adicione:
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8080
   ```

### Problema: Frontend não carrega dados

**Verificações:**
1. Confirme que o backend está rodando
2. Verifique `VITE_API_BASE` no frontend `.env`
3. Abra o Console do navegador (F12) e verifique erros
4. Teste a API diretamente no navegador:
   ```
   http://localhost:5000/api/health
   ```

### Problema: Gráficos não aparecem

**Solução:**
1. Verifique se há dados retornando da API
2. Abra o Console do navegador e verifique erros
3. Verifique se Chart.js está carregando corretamente
4. Confirme que os dados estão no formato esperado

---

## 🤖 Scripts de Automação

### Scripts Disponíveis

#### Backend (`backend/package.json`):
```bash
npm start      # Inicia em modo produção
npm run dev    # Inicia em modo desenvolvimento (com watch)
```

#### Frontend (`frontend/package.json`):
```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm run preview  # Preview do build de produção
npm run lint     # Executa linter
```

### Criar Scripts Personalizados

Você pode criar scripts personalizados no `package.json`:

```json
{
  "scripts": {
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "install:all": "cd backend && npm install && cd ../frontend && npm install"
  }
}
```

---

## 📝 Checklist de Execução

Use este checklist para garantir que tudo está configurado:

### Instalação:
- [ ] Node.js 18+ instalado
- [ ] Dependências do backend instaladas (`npm install` em `backend/`)
- [ ] Dependências do frontend instaladas (`npm install` em `frontend/`)

### Configuração:
- [ ] Arquivo `backend/.env` criado e configurado
- [ ] Arquivo `frontend/.env` criado e configurado
- [ ] Credenciais do banco de dados configuradas
- [ ] URLs da API configuradas corretamente

### Execução:
- [ ] Backend iniciado e respondendo em `/api/health`
- [ ] Frontend iniciado e acessível
- [ ] Conexão com banco de dados funcionando
- [ ] Gráficos carregando dados corretamente

---

## 🆘 Suporte Adicional

### Logs Úteis

**Backend:**
- Logs aparecem no terminal onde o servidor está rodando
- Erros de banco aparecem no console

**Frontend:**
- Abra o Console do navegador (F12)
- Verifique a aba Network para requisições HTTP
- Verifique a aba Console para erros JavaScript

### Recursos

- **Documentação Node.js**: https://nodejs.org/docs/
- **Documentação Express**: https://expressjs.com/
- **Documentação React**: https://react.dev/
- **Documentação Vite**: https://vitejs.dev/

---

## 📞 Próximos Passos

Após executar a aplicação com sucesso:

1. Explore os diferentes gráficos e visualizações
2. Ajuste o intervalo de atualização se necessário
3. Configure para produção quando estiver pronto
4. Considere implementar testes automatizados
5. Configure monitoramento e logging em produção

---

**Última atualização:** Janeiro 2026  
**Versão da aplicação:** 1.0.0
