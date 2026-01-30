/**
 * Serviço de cache em memória para queries do backend
 * Reduz carga no banco de dados e melhora performance
 */

class BackendCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Gera chave de cache baseada em query e parâmetros
   * @param {string} queryName - Nome da query
   * @param {Object} params - Parâmetros da query
   * @returns {string} - Chave de cache
   */
  generateKey(queryName, params = {}) {
    const paramsStr = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${queryName}${paramsStr ? `|${paramsStr}` : ''}`;
  }

  /**
   * Obtém dados do cache
   * @param {string} queryName - Nome da query
   * @param {Object} params - Parâmetros da query
   * @returns {any|null} - Dados em cache ou null
   */
  get(queryName, params = {}) {
    const key = this.generateKey(queryName, params);
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Verifica se expirou
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.data;
  }

  /**
   * Armazena dados no cache
   * @param {string} queryName - Nome da query
   * @param {Object} params - Parâmetros da query
   * @param {any} data - Dados para cachear
   * @param {number} ttl - Tempo de vida em ms (default: 5 minutos)
   */
  set(queryName, params = {}, data, ttl = 5 * 60 * 1000) {
    const key = this.generateKey(queryName, params);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
    this.stats.sets++;
  }

  /**
   * Remove item do cache
   * @param {string} queryName - Nome da query
   * @param {Object} params - Parâmetros da query (opcional, remove todos se não fornecido)
   */
  delete(queryName, params = null) {
    if (params === null) {
      // Remove todos os itens dessa query
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(queryName)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.stats.deletes++;
      });
    } else {
      const key = this.generateKey(queryName, params);
      if (this.cache.delete(key)) {
        this.stats.deletes++;
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  /**
   * Limpa itens expirados
   * @returns {number} - Número de itens removidos
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removed++;
        this.stats.deletes++;
      }
    }
    
    return removed;
  }

  /**
   * Retorna estatísticas do cache
   * @returns {Object} - Estatísticas
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      totalRequests: total,
    };
  }

  /**
   * Retorna informações sobre o cache
   * @returns {Object} - Informações do cache
   */
  getInfo() {
    return {
      size: this.cache.size,
      stats: this.getStats(),
      keys: Array.from(this.cache.keys()).slice(0, 10), // Primeiras 10 chaves
    };
  }
}

// Instância singleton
export const backendCache = new BackendCache();

// Limpeza automática a cada 10 minutos
setInterval(() => {
  const removed = backendCache.cleanup();
  if (removed > 0 && process.env.NODE_ENV === 'development') {
    console.log(`🧹 Cache cleanup: ${removed} itens expirados removidos`);
  }
}, 10 * 60 * 1000);

// Limpeza ao iniciar (remove itens expirados)
backendCache.cleanup();
