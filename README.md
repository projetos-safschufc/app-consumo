# Dashboard de Consumo de Materiais

Aplicação moderna para visualização e análise de consumo de materiais, construída com **Node.js/Express** no backend e **React + Vite** no frontend.

## 🏗️ Arquitetura

### Backend (Node.js/Express)
- **Estrutura modular**: Controllers, Services, Models, Middlewares
- **Pool de conexões PostgreSQL**: Gerenciamento eficiente de conexões
- **Tratamento de erros robusto**: Middleware centralizado
- **Segurança**: Helmet, CORS, Rate Limiting
- **Validação de configuração**: Verificação de variáveis de ambiente

### Frontend (React + Vite)
- **Componentização adequada**: Componentes reutilizáveis e modulares
- **Hooks customizados**: `useApiData` para gerenciamento de estado da API
- **Build otimizado**: Code splitting e otimizações de produção
- **Performance**: Atualização automática configurável

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **PostgreSQL** (acesso ao banco de dados)
- **npm** ou **yarn**

## 🚀 Instalação e Configuração

### 1. Backend

```bash
cd backend
npm install
```

Copie o arquivo de exemplo e configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
APP_HOST=0.0.0.0
APP_PORT=5000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173

DB_HOST=seu_host
DB_PORT=5432
DB_NAME=seu_banco
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_SSLMODE=prefer
```

### 2. Frontend

```bash
cd frontend
npm install
```

Copie o arquivo de exemplo e configure a URL da API:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_API_BASE=http://localhost:5000/api
```

## 🏃 Executando a Aplicação

### Início Rápido

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Execução Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

O backend estará disponível na porta definida em `backend/.env` (`APP_PORT`, padrão 5000).  
O frontend estará disponível em `http://localhost:5173`.

Se aparecer **ECONNREFUSED** ou "proxy error": (1) inicie o backend em outro terminal (`cd backend && npm run dev`); (2) se o backend usar outra porta (ex.: `APP_PORT=5001`), defina no `frontend/.env`: `VITE_PROXY_TARGET=http://localhost:5001`.

📖 **Para instruções detalhadas, consulte:** [`GUIA_EXECUCAO.md`](GUIA_EXECUCAO.md)  
⚡ **Para início rápido:** [`INICIO_RAPIDO.md`](INICIO_RAPIDO.md)

### Produção

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Estrutura do Projeto

```
app_consumo/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (app, database)
│   │   ├── controllers/     # Controladores das rotas
│   │   ├── middlewares/     # Middlewares (error handler)
│   │   ├── models/          # Modelos (queries SQL)
│   │   ├── routes/          # Definição de rotas
│   │   ├── services/        # Lógica de negócio
│   │   └── server.js        # Ponto de entrada
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── hooks/          # Hooks customizados
│   │   ├── services/       # Serviços (API)
│   │   ├── utils/          # Utilitários
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## 🔌 Endpoints da API

### Health Check
- `GET /api/health` - Status básico
- `GET /api/health/check` - Status com verificação de banco

### Consumo
- `GET /api/consumo-mensal-material` - Consumo mensal por material
- `GET /api/media-mensal-material` - Média mensal por material
- `GET /api/consumo-mensal-grupo` - Consumo mensal por grupo
- `GET /api/consumo-por-centro` - Consumo por centro requisitante
- `GET /api/consumo-diario-mes-atual` - Consumo diário do mês atual
- `GET /api/projecao-mes-atual` - Projeção do mês atual
- `GET /api/projecao-mensal-material` - Projeção mensal por material
- `GET /api/tendencia-ultimos-6-meses` - Tendência dos últimos 6 meses
- `GET /api/crescimento-abrupto` - Materiais com crescimento abrupto
- `GET /api/consumo-zero-6-meses` - Materiais sem consumo recente (coluna `setor_controle` via merge com `ctrl.safs_catalogo`; filtro `?setor=UACE|ULOG`)
- `GET /api/consumo-por-hospital-almox` - Consumo por hospital/almoxarifado
- `GET /api/ranking-materiais-criticos` - Ranking de materiais críticos
- `GET /api/consumo-x-valor` - Consumo x valor (impacto financeiro)

## 📊 Integração SAFS (ctrl.safs_catalogo)

A tabela **"Materiais sem consumo recente"** no dashboard exibe a coluna **setor_controle** obtida por MERGE com a tabela `ctrl.safs_catalogo` no banco SAFS:

- **Condição de junção:** valor à esquerda do `-` em `v_df_movimento.mat_cod_antigo` = `ctrl.safs_catalogo.master`.
- **Coluna exibida:** `ctrl.safs_catalogo.setor_controle` (tipos tratados como String).
- **Filtro:** select-box acima da tabela (Todos, UACE, ULOG) atuando sobre `setor_controle`.

**Credenciais para acesso ao banco SAFS (schema ctrl):** o pool SAFS usa as mesmas variáveis do backend: `DB_HOST`, `DB_USER`, `DB_PASSWORD` ou `DB_PASSWORD_FILE`, e para SAFS: `DB_SAFS_PORT=5433`, `DB_SAFS_DATABASE=safs`, `DB_SCHEMA=ctrl`.

**Senha com caractere especial (#):** para evitar que o `#` seja interpretado como comentário no `.env`, use `DB_PASSWORD_FILE`: coloque a senha em um arquivo (ex.: `.env.password`) e defina `DB_PASSWORD_FILE=.env.password`, ou use o valor literal entre aspas: `DB_PASSWORD_FILE="abi123!@#qwe"` (quando o valor não for um caminho de arquivo existente, a aplicação usa o próprio valor como senha).

## 🔒 Segurança

- **Helmet**: Headers de segurança HTTP
- **CORS**: Configuração de origens permitidas
- **Rate Limiting**: Limite de requisições por IP
- **Validação de entrada**: Verificação de dados
- **Tratamento de erros**: Não exposição de informações sensíveis

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Padrões de Código

- **ESLint**: Linting para JavaScript/React
- **Nomenclatura**: camelCase para variáveis/funções, PascalCase para componentes
- **Estrutura**: Separação clara de responsabilidades
- **Documentação**: Comentários JSDoc em funções principais

## 🚀 Deploy

### Backend
1. Configure variáveis de ambiente no servidor
2. Execute `npm install --production`
3. Use um process manager como PM2: `pm2 start src/server.js`

### Frontend
1. Execute `npm run build`
2. Sirva os arquivos da pasta `dist/` com um servidor web (Nginx, Apache, etc.)

## 📄 Licença

ISC

## 👥 Contribuindo

1. Crie uma branch para sua feature
2. Faça commit das mudanças
3. Abra um Pull Request
