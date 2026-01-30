/**
 * Serviço de normalização de dados
 * Converte tipos de dados do PostgreSQL para formatos JSON compatíveis
 */

/**
 * Normaliza um valor individual
 * @param {any} value - Valor a ser normalizado
 * @returns {any} - Valor normalizado
 */
export function normalizeValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Decimal/BigNumber do PostgreSQL
  if (typeof value === 'object' && value.constructor && value.constructor.name === 'BigNumber') {
    return parseFloat(value.toString());
  }
  
  // Date
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
  // Buffer (bytes)
  if (Buffer.isBuffer(value)) {
    return value.toString('utf-8');
  }
  
  return value;
}

/**
 * Normaliza um array de linhas do banco de dados
 * O PostgreSQL retorna objetos diretamente em result.rows
 * @param {string[]} columns - Nomes das colunas (opcional, usado apenas para validação)
 * @param {any[]} rows - Linhas retornadas do banco (objetos ou arrays)
 * @returns {Object[]} - Array de objetos normalizados
 */
export function normalizeRows(columns, rows) {
  return rows.map(row => {
    // Se row já é um objeto (caso comum com pg)
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      const normalized = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[key] = normalizeValue(value);
      }
      return normalized;
    }
    
    // Se row é um array (fallback)
    const normalized = {};
    columns.forEach((col, index) => {
      normalized[col] = normalizeValue(row[index]);
    });
    return normalized;
  });
}

/**
 * Remove linhas que têm campos obrigatórios nulos
 * @param {Object[]} rows - Array de objetos
 * @param {string[]} requiredFields - Campos obrigatórios
 * @returns {Object[]} - Array filtrado
 */
export function dropNulls(rows, requiredFields = []) {
  if (!requiredFields || requiredFields.length === 0) {
    return rows;
  }
  
  return rows.filter(row => {
    return requiredFields.every(field => row[field] != null);
  });
}

/**
 * Ordena um array de objetos por uma chave específica
 * @param {Object[]} rows - Array de objetos
 * @param {string} sortKey - Chave para ordenação
 * @returns {Object[]} - Array ordenado
 */
export function sortRows(rows, sortKey) {
  if (!sortKey) {
    return rows;
  }
  
  return [...rows].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal);
    }
    
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
}
