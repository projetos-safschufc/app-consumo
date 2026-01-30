/**
 * Middleware de cache para endpoints
 * Intercepta requisições e retorna dados do cache quando disponível
 */

import { backendCache } from '../services/cacheService.js';

/**
 * Middleware de cache para queries
 * @param {Object} options - Opções de cache
 * @param {number} options.ttl - Tempo de vida do cache em ms (default: 5 minutos)
 * @param {Function} options.getCacheKey - Função para gerar chave de cache (opcional)
 * @returns {Function} - Middleware Express
 */
export function cacheMiddleware(options = {}) {
  const { ttl = 5 * 60 * 1000, getCacheKey } = options;

  return async (req, res, next) => {
    // Apenas para GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Gera chave de cache usando path como queryName e query como params
    const queryName = getCacheKey 
      ? getCacheKey(req)
      : req.path.replace(/^\/api\//, ''); // Remove /api/ do início
    
    // Tenta obter do cache
    const cached = backendCache.get(queryName, req.query);
    
    if (cached) {
      // Adiciona header indicando que veio do cache
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Adiciona função para armazenar no cache na resposta
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Armazena no cache antes de enviar resposta
      backendCache.set(queryName, req.query, data, ttl);
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware simples de cache (usa path + query como chave)
 * @param {number} ttl - Tempo de vida em ms
 */
export function simpleCache(ttl = 5 * 60 * 1000) {
  return cacheMiddleware({ ttl });
}
