# 🔧 Troubleshooting Frontend - Problemas de Conexão

## ❌ Erro: "NetworkError when attempting to fetch resource"

### Sintoma:
Todos os cards mostram: "Erro ao carregar dados: NetworkError when attempting to fetch resource"

### Causas Possíveis:

#### 1. Backend não está rodando

**Verificação:**
```bash
# Verificar se o backend está rodando
curl http://localhost:5001/api/health
```

**Solução:**
```bash
cd backend
npm run dev
```

#### 2. Porta incorreta

**Verificação:**
- Verifique `backend/.env` - qual porta está configurada?
- Verifique `frontend/.env` - a URL da API está correta?

**Solução:**
- Se backend está na porta 5001:
  - `frontend/.env`: `VITE_API_BASE=http://localhost:5001/api`
  - `vite.config.js`: proxy target deve ser `http://localhost:5001`

#### 3. CORS bloqueando requisições

**Verificação:**
- Abra o Console do navegador (F12)
- Procure por erros de CORS

**Solução:**
- Verifique `backend/.env`:
  ```env
  CORS_ORIGINS=http://localhost:5173,http://localhost:3000,*
  ```

#### 4. Proxy do Vite não configurado corretamente

**Verificação:**
- O `vite.config.js` tem o proxy configurado?
- A porta do proxy corresponde à porta do backend?

**Solução:**
```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001', // Mesma porta do backend
      changeOrigin: true,
    },
  },
}
```

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar Backend

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Deve mostrar:
# 🚀 Servidor rodando em http://0.0.0.0:5001
```

### 2. Testar API Diretamente

**No navegador:**
```
http://localhost:5001/api/health
```

**Deve retornar:**
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 3. Verificar Frontend

```bash
# Terminal 2 - Frontend
cd frontend
npm run dev

# Deve mostrar:
# ➜  Local:   http://localhost:5173/
```

### 4. Verificar Console do Navegador

1. Abra http://localhost:5173
2. Pressione F12
3. Aba Console - verifique erros
4. Aba Network - verifique requisições

**Requisições devem aparecer como:**
- `/api/health` - Status 200
- `/api/consumo-mensal-material` - Status 200

### 5. Verificar Variáveis de Ambiente

**frontend/.env:**
```env
VITE_API_BASE=http://localhost:5001/api
```

**backend/.env:**
```env
APP_PORT=5001
CORS_ORIGINS=http://localhost:5173,*
```

## 🛠️ Soluções Rápidas

### Solução 1: Reiniciar Tudo

```bash
# Parar todos os processos
# Windows: Ctrl+C nos terminais
# Linux/Mac: Ctrl+C nos terminais

# Reiniciar backend
cd backend
npm run dev

# Em outro terminal, reiniciar frontend
cd frontend
npm run dev
```

### Solução 2: Limpar Cache do Navegador

1. Pressione Ctrl+Shift+Delete
2. Limpe cache e cookies
3. Recarregue a página (Ctrl+F5)

### Solução 3: Verificar Firewall

- Windows: Verifique se a porta 5001 não está bloqueada
- Linux: `sudo ufw allow 5001`

### Solução 4: Usar IP em vez de localhost

Se `localhost` não funcionar, tente:

**frontend/.env:**
```env
VITE_API_BASE=http://127.0.0.1:5001/api
```

**vite.config.js:**
```javascript
target: 'http://127.0.0.1:5001'
```

## 📊 Componente de Diagnóstico

O frontend agora inclui um componente `ApiStatus` que:
- Verifica automaticamente a conexão com o backend
- Mostra alerta no topo da página se houver problemas
- Atualiza a cada 10 segundos

Se você ver o alerta:
1. Verifique se o backend está rodando
2. Verifique as portas configuradas
3. Verifique o Console do navegador para mais detalhes

## 🔍 Logs Úteis

### Backend (Terminal):
```
🚀 Servidor rodando em http://0.0.0.0:5001
📊 Ambiente: development
🔗 API disponível em http://0.0.0.0:5001/api
```

### Frontend (Console do Navegador):
```
🔧 API Config: { mode: 'development (proxy)', apiBase: '/api', ... }
📡 Fetching: /api/health
✅ Response from /api/health: { status: 'ok', ... }
```

## ✅ Checklist de Verificação

- [ ] Backend está rodando na porta correta
- [ ] Frontend está rodando na porta 5173
- [ ] `frontend/.env` tem a URL correta da API
- [ ] `vite.config.js` proxy aponta para a porta correta
- [ ] `backend/.env` CORS_ORIGINS inclui localhost:5173
- [ ] Console do navegador não mostra erros de CORS
- [ ] Requisições aparecem na aba Network do DevTools
- [ ] Backend responde em http://localhost:5001/api/health

## 🆘 Ainda com Problemas?

1. **Verifique os logs:**
   - Backend: Terminal onde está rodando
   - Frontend: Console do navegador (F12)

2. **Teste a API diretamente:**
   ```bash
   curl http://localhost:5001/api/health
   ```

3. **Verifique se há outros processos usando as portas:**
   ```bash
   # Backend
   cd backend
   npm run check-port
   
   # Frontend (porta 5173)
   # Windows
   netstat -ano | findstr :5173
   # Linux/Mac
   lsof -i :5173
   ```

---

**Última atualização:** Janeiro 2026
