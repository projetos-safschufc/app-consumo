# 🔧 Troubleshooting - Erros Comuns

Este documento detalha soluções para erros comuns encontrados durante a execução do backend.

## ❌ Erro: EADDRINUSE - Porta já em uso

### Sintoma:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```

### Causa:
Outro processo já está usando a porta 5000 (ou a porta configurada).

### Soluções:

#### 1. Usar Scripts Automatizados (Recomendado)

```bash
# Verificar qual processo está usando a porta
npm run check-port

# Encerrar processos automaticamente
npm run kill-port
```

#### 2. Solução Manual - Windows

```powershell
# 1. Encontrar o processo
netstat -ano | findstr :5000

# 2. Identificar o PID (última coluna)
# Exemplo de saída:
# TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    12345

# 3. Encerrar o processo (substitua 12345 pelo PID real)
taskkill /PID 12345 /F
```

#### 3. Solução Manual - Linux/Mac

```bash
# 1. Encontrar o processo
lsof -i :5000

# 2. Identificar o PID
# Exemplo de saída:
# COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node    12345 user   23u  IPv4  12345      0t0  TCP *:5000 (LISTEN)

# 3. Encerrar o processo (substitua 12345 pelo PID real)
kill -9 12345
```

#### 4. Alterar a Porta (Alternativa)

Se não conseguir encerrar o processo, altere a porta:

**backend/.env:**
```env
APP_PORT=5001
```

**frontend/.env:**
```env
VITE_API_BASE=http://localhost:5001/api
```

### Prevenção:

- Sempre encerre o servidor corretamente (Ctrl+C)
- Use `npm run kill-port` antes de iniciar se tiver dúvidas
- Considere usar portas diferentes para diferentes ambientes

---

## ❌ Erro: Variáveis de ambiente faltando

### Sintoma:
```
Error: Variáveis de ambiente faltando: DB_HOST, DB_USER...
```

### Causa:
Arquivo `.env` não existe ou está incompleto.

### Solução:

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o `.env` e preencha todas as variáveis obrigatórias:
```env
DB_HOST=pgpool1.ebserh
DB_PORT=5432
DB_NAME=powerbi
DB_USER=seu_usuario
DB_PASSWORD="sua_senha"
```

---

## ❌ Erro: Conexão com banco de dados falhou

### Sintoma:
```
Error: connect ECONNREFUSED
Error: password authentication failed
```

### Causa:
- Credenciais incorretas
- Banco de dados inacessível
- Firewall bloqueando conexão

### Solução:

1. **Verificar credenciais no `.env`**
   - Confirme usuário e senha
   - Verifique se há aspas desnecessárias

2. **Testar conexão manualmente:**
```bash
# Windows
psql -h pgpool1.ebserh -p 5432 -U seu_usuario -d powerbi

# Linux/Mac
psql -h pgpool1.ebserh -p 5432 -U seu_usuario -d powerbi
```

3. **Verificar SSL:**
   - Se necessário, altere `DB_SSLMODE=require` no `.env`

4. **Verificar rede/firewall:**
   - Confirme que o host está acessível
   - Verifique regras de firewall

---

## ❌ Erro: CORS no navegador

### Sintoma:
```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

### Causa:
Frontend não está na lista de origens permitidas.

### Solução:

Edite `backend/.env`:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8080
```

Certifique-se de incluir todas as URLs que você usa para acessar o frontend.

---

## ❌ Erro: Módulo não encontrado

### Sintoma:
```
Error: Cannot find module 'express'
Error: Cannot find module './config/app.js'
```

### Causa:
Dependências não instaladas ou caminho incorreto.

### Solução:

1. **Reinstalar dependências:**
```bash
# Remover node_modules e lock file
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

2. **Verificar se está na pasta correta:**
```bash
# Deve estar em backend/
pwd  # Linux/Mac
cd   # Windows PowerShell
```

---

## ❌ Erro: SyntaxError ou erro de importação

### Sintoma:
```
SyntaxError: Cannot use import statement outside a module
```

### Causa:
Arquivo não está sendo tratado como módulo ES.

### Solução:

1. Verifique se `package.json` tem:
```json
{
  "type": "module"
}
```

2. Use extensão `.js` (não `.cjs`) para arquivos que usam `import`

---

## 📊 Verificação de Saúde do Sistema

Execute estes comandos para verificar se tudo está configurado:

```bash
# 1. Verificar Node.js
node --version  # Deve ser >= 18.0.0

# 2. Verificar dependências
npm list --depth=0

# 3. Verificar porta
npm run check-port

# 4. Testar conexão com banco (se psql estiver instalado)
psql -h pgpool1.ebserh -U seu_usuario -d powerbi -c "SELECT 1;"

# 5. Verificar variáveis de ambiente
node -e "require('dotenv').config(); console.log(process.env.DB_HOST)"
```

---

## 🆘 Ainda com problemas?

1. **Verifique os logs:**
   - Logs aparecem no terminal onde o servidor está rodando
   - Procure por mensagens de erro específicas

2. **Modo debug:**
   - Ative `APP_DEBUG=true` no `.env` para mais informações

3. **Limpeza completa:**
```bash
# Remover tudo e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar configuração
cat .env
```

4. **Verificar documentação:**
   - Consulte `GUIA_EXECUCAO.md` para instruções detalhadas
   - Consulte `README.md` para visão geral

---

**Última atualização:** Janeiro 2026
