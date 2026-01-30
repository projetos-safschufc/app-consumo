/**
 * Sistema de fila de requisições para evitar rate limiting
 * Espaça requisições para não sobrecarregar o servidor
 */

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.delayBetweenRequests = 100; // 100ms entre requisições
    this.maxConcurrent = 5; // Máximo de 5 requisições simultâneas
    this.activeRequests = 0;
  }

  /**
   * Adiciona uma requisição à fila
   * @param {Function} requestFn - Função que retorna uma Promise
   * @returns {Promise}
   */
  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject,
      });

      this.process();
    });
  }

  /**
   * Processa a fila de requisições
   */
  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const item = this.queue.shift();
      this.activeRequests++;

      try {
        const result = await item.requestFn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      } finally {
        this.activeRequests--;
        
        // Aguarda um pouco antes da próxima requisição
        if (this.queue.length > 0) {
          await this.delay(this.delayBetweenRequests);
        }
      }
    }

    this.processing = false;

    // Se ainda há itens na fila, processa novamente
    if (this.queue.length > 0) {
      setTimeout(() => this.process(), this.delayBetweenRequests);
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpa a fila
   */
  clear() {
    this.queue = [];
  }
}

// Instância singleton
export const requestQueue = new RequestQueue();
