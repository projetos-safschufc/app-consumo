/**
 * Serviço de batch requests
 * Permite buscar múltiplos endpoints em uma única requisição
 * Reduz número de chamadas HTTP e melhora performance
 */

import { fetchJson } from './api.js';

const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api');

/**
 * Faz uma requisição batch para múltiplos endpoints
 * @param {Array} requests - Array de objetos { endpoint: string, params?: object }
 * @returns {Promise<Object>} - Objeto com resultados indexados por endpoint
 */
export async function batchRequest(requests) {
  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    throw new Error('Requests deve ser um array não vazio');
  }

  // Limita a 10 requests por vez
  if (requests.length > 10) {
    throw new Error('Máximo de 10 requests por batch');
  }

  try {
    const response = await fetch(`${API_BASE}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `Erro HTTP ${response.status}` 
      }));
      throw new Error(error.error || error.message || `Erro ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro no batch request:', error);
    throw error;
  }
}

/**
 * Pré-carrega dados críticos do dashboard
 * @param {string} mat_codigo - Código do material (opcional)
 * @returns {Promise<Object>} - Dados pré-carregados
 */
export async function preloadData(mat_codigo = null) {
  const params = mat_codigo ? `?mat_codigo=${encodeURIComponent(mat_codigo)}` : '';
  
  try {
    const response = await fetch(`${API_BASE}/preload${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: `Erro HTTP ${response.status}` 
      }));
      throw new Error(error.error || error.message || `Erro ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro no preload:', error);
    throw error;
  }
}

/**
 * Hook helper para usar batch requests com cache
 * @param {Array} endpoints - Array de endpoints para buscar
 * @returns {Promise<Object>} - Dados de todos os endpoints
 */
export async function fetchBatch(endpoints) {
  const requests = endpoints.map(endpoint => {
    // Separa endpoint e query params
    const [path, queryString] = endpoint.split('?');
    const params = queryString 
      ? Object.fromEntries(new URLSearchParams(queryString))
      : {};
    
    return {
      endpoint: path.replace(/^\//, ''), // Remove leading slash
      params,
    };
  });

  const result = await batchRequest(requests);
  
  // Retorna dados formatados como se fossem chamadas individuais
  const formatted = {};
  Object.keys(result.results).forEach(endpoint => {
    const response = result.results[endpoint];
    if (response.success) {
      formatted[endpoint] = response.data;
    } else {
      formatted[endpoint] = { error: response.error };
    }
  });

  return formatted;
}
