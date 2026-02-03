.venv# Execução em ambiente de produção – Windows Server (IP 10.28.0.124)

Este documento descreve como executar a aplicação **Dashboard de Consumo de Materiais** em ambiente de produção em um servidor Windows com o endereço **http://10.28.0.124/**.

---

## 1. Visão geral

A aplicação é composta por:

- **Backend (Node.js/Express):** API REST na porta configurável (ex.: 5001). Precisa ficar em execução continuamente.
- **Frontend (React/Vite):** após o build, vira arquivos estáticos (pasta `dist/`). Devem ser servidos por um servidor web (IIS, ou outro) no IP do servidor (ex.: porta 80 em http://10.28.0.124/).

O frontend em produção chama a API usando a URL configurada no build (ex.: `http://10.28.0.124:5001/api`).

---

## 2. Pré-requisitos no servidor Windows

- **Node.js** 18 ou superior ([nodejs.org](https://nodejs.org)).
- **npm** (já vem com o Node.js).
- Acesso ao servidor (RDP, SSH ou físico) para copiar arquivos e executar comandos.
- Conexão dos bancos de dados (PowerBI e SAFS) acessível a partir do servidor (host, porta, firewall).
- (Opcional) **IIS** com módulo de conteúdo estático, ou outro servidor web, para servir a pasta do frontend na porta 80.

Verifique o Node no PowerShell:

```powershell
node -v
npm -v
```

---

## 3. Preparar os arquivos no servidor

1. Copie o projeto completo para o servidor (ex.: `C:\app_consumo` ou `D:\apps\app_consumo`).
2. Ou clone o repositório no servidor, se usar controle de versão.

Estrutura esperada:

```
C:\app_consumo\
├── backend\
│   ├── src\
│   ├── .env          (configuração de produção – ver seção 4)
│   ├── package.json
│   └── ...
├── frontend\
│   ├── src\
│   ├── .env.production  (opcional – ver seção 5)
│   ├── package.json
│   └── ...
└── PRODUCAO_WINDOWS.md
```

---

## 4. Configurar e executar o Backend

### 4.1. Instalar dependências

Abra **PowerShell** ou **Prompt de comando** e execute:

```powershell
cd C:\app_consumo\backend
npm install --production
```

### 4.2. Arquivo `.env` de produção

Crie ou edite o arquivo `backend\.env` com as variáveis de produção. Exemplo para o servidor **10.28.0.124**:

```env
APP_HOST=0.0.0.0
APP_PORT=5001
NODE_ENV=production
APP_DEBUG=false
CORS_ORIGINS=http://10.28.0.124,http://10.28.0.124:80,http://10.28.0.124:5001

DB_HOST=pgpool1.ebserh
DB_PORT=5432
DB_NAME=powerbi
DB_USER=seu_usuario
DB_PASSWORD_FILE=.env.password
DB_SSLMODE=prefer
DB_SCHEMA=ctrl

DB_SAFS_PORT=5433
DB_SAFS_DATABASE=safs
```

- **APP_HOST=0.0.0.0** – faz o servidor aceitar conexões em qualquer interface (incluindo pelo IP 10.28.0.124).
- **APP_PORT=5001** – porta da API (pode ser outra, ex.: 5002; se mudar, use a mesma porta no build do frontend).
- **CORS_ORIGINS** – inclua todas as URLs em que o frontend será acessado (com e sem porta, se necessário).

Configure também as demais variáveis (banco PowerBI, SAFS, SMTP, etc.) conforme o ambiente. Para senha com `#` ou caracteres especiais, use `DB_PASSWORD_FILE` apontando para um arquivo com a senha.

### 4.3. Iniciar o backend

```powershell
cd C:\app_consumo\backend
npm start
```

Você deve ver algo como:

```
Servidor rodando em http://0.0.0.0:5001
API disponível em http://0.0.0.0:5001/api
```

### 4.4. Manter o backend rodando (recomendado para produção)

Para que o backend não pare ao fechar o PowerShell:

- **Opção A – NSSM (serviço Windows):** use o NSSM para instalar `node src/server.js` como serviço do Windows (diretório de trabalho: `C:\app_consumo\backend`).
- **Opção B – PM2 (Node):** instale o PM2 globalmente (`npm install -g pm2`) e execute:  
  `pm2 start src/server.js --name app-consumo-api --cwd C:\app_consumo\backend`  
  e configure o PM2 para iniciar no boot, se desejar.

---

## 5. Build e publicação do Frontend

O frontend precisa ser buildado **com a URL da API** que será usada em produção. Essa URL é definida pela variável **VITE_API_BASE** no momento do build.

### 5.1. Definir a URL da API

No servidor, antes do build, defina a URL completa da API (incluindo a porta do backend). Exemplo para API em **10.28.0.124:5001**:

**PowerShell:**

```powershell
cd C:\app_consumo\frontend
$env:VITE_API_BASE="http://10.28.0.124:5001/api"
npm run build
```

**Prompt de comando (cmd):**

```cmd
cd C:\app_consumo\frontend
set VITE_API_BASE=http://10.28.0.124:5001/api
npm run build
```

Ou crie o arquivo **`frontend\.env.production`** com o conteúdo:

```env
VITE_API_BASE=http://10.28.0.124:5001/api
```

Depois execute apenas:

```powershell
cd C:\app_consumo\frontend
npm install
npm run build
```

A pasta **`frontend\dist`** será gerada com os arquivos estáticos (HTML, JS, CSS).

### 5.2. Servir o frontend no endereço http://10.28.0.124/

Você precisa expor o conteúdo da pasta **`frontend\dist`** na porta 80 (ou outra) do IP 10.28.0.124.

**Opção A – IIS (Windows):**

1. Abra o **Gerenciador do IIS**.
2. Crie um novo site (ou um aplicativo em um site existente).
3. Defina o **caminho físico** como `C:\app_consumo\frontend\dist`.
4. Associe o site ao IP 10.28.0.124 e à porta 80 (ou à porta desejada).
5. Garanta que o documento padrão inclua `index.html` e que a extensão `.html` e o fallback para SPA (rewrite para `index.html`) estejam configurados, se o IIS exigir.

**Opção B – Servir com Node (teste ou ambiente simples):**

Se tiver um pacote como `serve` instalado globalmente:

```powershell
npm install -g serve
cd C:\app_consumo\frontend\dist
serve -s . -l 80
```

(O servidor precisará ser executado com permissão para usar a porta 80, ou use outra porta, ex.: 8080, e acesse http://10.28.0.124:8080.)

---

## 6. Firewall do Windows

Para o backend ser acessível na rede (ex.: na porta 5001), libere a porta no Firewall do Windows:

1. **Painel de Controle** → **Sistema e Segurança** → **Firewall do Windows** → **Configurações avançadas**.
2. **Regras de Entrada** → **Nova Regra**.
3. Tipo: **Porta** → TCP → Portas específicas: **5001** (ou a porta que usar em `APP_PORT`).
4. Permitir a conexão e aplique à rede desejada (Domínio, Privada, Pública).
5. Nomeie a regra (ex.: "App Consumo API").

Ou via PowerShell (executar como Administrador):

```powershell
New-NetFirewallRule -DisplayName "App Consumo API" -Direction Inbound -Protocol TCP -LocalPort 5001 -Action Allow
```

Se o frontend for servido por outro serviço (IIS, etc.), a porta 80 (ou a que usar) já costuma estar liberada para o IIS.

---

## 7. Verificação

1. **Backend:** no navegador ou no PowerShell:
   ```powershell
   Invoke-WebRequest -Uri "http://10.28.0.124:5001/api/health" -UseBasicParsing
   ```
   Deve retornar status 200 e um JSON com status da API.

2. **Frontend:** abra no navegador **http://10.28.0.124/** (ou http://10.28.0.124:80). O dashboard deve carregar e, ao usar as funcionalidades, as chamadas devem ir para **http://10.28.0.124:5001/api**.

3. **CORS:** se o frontend estiver em `http://10.28.0.124` (porta 80) e a API em `http://10.28.0.124:5001`, o `CORS_ORIGINS` no `backend\.env` deve incluir `http://10.28.0.124` e `http://10.28.0.124:80` (conforme exemplo na seção 4.2).

---

## 8. Resumo dos endereços

| Componente | URL de acesso (exemplo) |
|------------|--------------------------|
| Frontend (usuário) | http://10.28.0.124/ (porta 80) ou a porta configurada no IIS/servidor web |
| API (backend) | http://10.28.0.124:5001/api |

---

## 9. Uso de outra porta para a API (ex.: 5002)

Se quiser usar a porta **5002** em vez de 5001:

1. No **backend\.env**, defina `APP_PORT=5002`.
2. Ao fazer o build do frontend, use:  
   `VITE_API_BASE=http://10.28.0.124:5002/api`
3. No firewall, libere a porta **5002** em vez de 5001.
4. A API ficará em **http://10.28.0.124:5002/api**.

---

## 10. Referências no projeto

- **README.md** – visão geral do projeto e variáveis de ambiente.
- **backend\.env.example** – exemplo de variáveis do backend.
- **frontend\.env.example** – exemplo de variáveis do frontend (incluindo `VITE_API_BASE`).

Este guia deve ser suficiente para colocar a aplicação em produção no Windows no endereço http://10.28.0.124/. Para detalhes de banco de dados, SMTP ou cron de alertas, consulte o README e os arquivos `.env.example` do backend.
