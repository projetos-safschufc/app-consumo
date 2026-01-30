/**
 * Serviço de API
 * Centraliza todas as chamadas HTTP para o backend
 */

// Em desenvolvimento, usa o proxy do Vite (/api)
// Em produção, usa a URL completa da variável de ambiente
const isDev = import.meta.env.DEV;
const API_BASE_ENV = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';
const API_BASE = isDev ? '/api' : API_BASE_ENV;

const DEFAULT_TIMEOUT_MS = 30000;

// Log da configuração (apenas em desenvolvimento)
if (isDev) {
  console.log('🔧 API Config:', {
    mode: isDev ? 'development (proxy)' : 'production',
    apiBase: API_BASE,
    envValue: API_BASE_ENV,
  });
}

/**
 * Faz uma requisição HTTP para a API
 * @param {string} endpoint - Endpoint da API (sem /api)
 * @param {Object} options - Opções da requisição
 * @param {boolean} options.useCache - Usa cache se disponível (default: true)
 * @param {boolean} options.useQueue - Usa fila de requisições (default: true)
 * @returns {Promise<any>}
 */
export async function fetchJson(endpoint, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, useQueue = true, useCache = true, ...fetchOptions } = options;
  
  // Verifica cache primeiro
  if (useCache) {
    const { requestCache } = await import('../utils/cache.js');
    const cached = requestCache.get(endpoint);
    if (cached) {
      if (isDev) {
        console.log(`💾 Cache hit: ${endpoint}`);
      }
      return cached;
    }
  }
  
  const makeRequest = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const url = `${API_BASE}${endpoint}`;

    try {
      if (isDev) {
        console.log(`📡 Fetching: ${url}`);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      // Tratamento especial para erro 429 (Too Many Requests)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        const errorData = await response.json().catch(() => ({ 
          error: 'Muitas requisições',
          message: 'Limite de requisições excedido. Aguarde um momento.',
        }));
        
        const error = new Error(
          errorData.message || `Erro HTTP 429: Too Many Requests. Aguarde ${retryAfter} segundos.`
        );
        error.status = 429;
        error.retryAfter = parseInt(retryAfter, 10);
        throw error;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          error: `Erro HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(error.error || error.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Armazena no cache
      if (useCache) {
        const { requestCache } = await import('../utils/cache.js');
        requestCache.set(endpoint, data);
      }
      
      if (isDev) {
        console.log(`✅ Response from ${url}:`, data);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout: A requisição demorou muito para responder');
      }
      
      // Melhor tratamento de erros de rede
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const friendlyError = new Error(
          `Não foi possível conectar ao backend. ` +
          `Verifique se o servidor está rodando em ${isDev ? 'http://localhost:5001' : API_BASE_ENV}`
        );
        friendlyError.originalError = error;
        throw friendlyError;
      }
      
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Usa fila para requisições que não são críticas (health check não usa fila)
  if (useQueue && !endpoint.includes('/health')) {
    const { requestQueue } = await import('../utils/requestQueue.js');
    return requestQueue.add(makeRequest);
  }

  return makeRequest();
}

/**
 * Health check da API
 */
export async function checkHealth() {
  return fetchJson('/health');
}
