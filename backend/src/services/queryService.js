import { executeQuery } from '../config/database.js';
import { normalizeRows, dropNulls, sortRows } from './normalizeService.js';
import { SQL_QUERIES } from '../models/queries.js';

/**
 * Serviço de execução de queries
 * Centraliza a lógica de execução e processamento de queries
 */

/**
 * Executa uma query e retorna os dados processados
 * @param {string} queryName - Nome da query em SQL_QUERIES
 * @param {Object} options - Opções de processamento
 * @param {string[]} options.requiredFields - Campos obrigatórios (filtra nulos)
 * @param {string} options.sortKey - Chave para ordenação
 * @param {Object} options.params - Parâmetros para substituição na query
 * @returns {Promise<{data: Object[], meta: Object}>}
 */
export async function runQuery(queryName, options = {}) {
  const { requiredFields = [], sortKey = null, params = {} } = options;
  
  if (!SQL_QUERIES[queryName]) {
    throw new Error(`Query "${queryName}" não encontrada`);
  }
  
  let sql = SQL_QUERIES[queryName];
  
  // Substitui parâmetros na query se fornecidos
  if (Object.keys(params).length > 0) {
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (sql.includes(placeholder)) {
        sql = sql.replace(new RegExp(placeholder, 'g'), value);
      }
    });
  }
  
  const { columns, rows } = await executeQuery(sql);
  
  let data = normalizeRows(columns, rows);
  data = dropNulls(data, requiredFields);
  data = sortRows(data, sortKey);
  
  return {
    data,
    meta: {
      count: data.length,
      query: queryName,
      params: Object.keys(params).length > 0 ? params : undefined,
    },
  };
}

/**
 * Retorna todas as queries disponíveis
 * @returns {Object} - Objeto com nomes das queries
 */
export function getAvailableQueries() {
  return Object.keys(SQL_QUERIES);
}
