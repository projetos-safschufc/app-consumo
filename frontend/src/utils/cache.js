/**
 * Sistema de cache inteligente para requisições
 * Melhora performance evitando requisições duplicadas
 * Com TTL diferenciado por tipo de endpoint
 */

// TTL customizado por tipo de endpoint (em ms)
const ENDPOINT_TTL = {
  // Dados que mudam frequentemente
  'consumo-diario-mes-atual': 1 * 60 * 1000, // 1 minuto
  'projecao-mes-atual': 5 * 60 * 1000, // 5 minutos
  'projecao-mes-atual-filtrado': 5 * 60 * 1000, // 5 minutos
  
  // Dados históricos (mudam menos)
  'historico-consumo-mensal': 10 * 60 * 1000, // 10 minutos
  'media-ultimos-6-consumos': 10 * 60 * 1000, // 10 minutos
  
  // Dados de listagem (mudam raramente)
  'lista-materiais': 30 * 60 * 1000, // 30 minutos
  
  // Padrão
  default: 5 * 60 * 1000, // 5 minutos
};

class RequestCache {
  constructor(ttl = 60000) { // 1 minuto por padrão
    this.cache = new Map();
    this.defaultTtl = ttl;
  }

  /**
   * Obtém TTL para um endpoint específico
   * @param {string} key - Chave do cache (endpoint)
   * @returns {number} - TTL em ms
   */
  getTTL(key) {
    // Procura TTL específico para o endpoint
    for (const [endpoint, ttl] of Object.entries(ENDPOINT_TTL)) {
      if (key.includes(endpoint)) {
        return ttl;
      }
    }
    return this.defaultTtl;
  }

  /**
   * Obtém dados do cache
   * @param {string} key - Chave do cache
   * @returns {any|null} - Dados em cache ou null
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Verifica se expirou
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Armazena dados no cache
   * @param {string} key - Chave do cache
   * @param {any} data - Dados para cachear
   * @param {number} ttl - Tempo de vida em ms (opcional, usa TTL do endpoint se não fornecido)
   */
  set(key, data, ttl = null) {
    const effectiveTtl = ttl || this.getTTL(key);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + effectiveTtl,
      ttl: effectiveTtl,
    });
  }

  /**
   * Remove item do cache
   * @param {string} key - Chave do cache
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Limpa itens expirados
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Instância singleton
export const requestCache = new RequestCache(60000); // 1 minuto

// Limpeza automática a cada 5 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup();
  }, 5 * 60 * 1000);
}
