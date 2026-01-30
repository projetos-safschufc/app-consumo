/**
 * Utilitários de formatação
 */

/**
 * Formata mês/ano para exibição
 * @param {string | number} mesano - Mês/ano no formato YYYYMM ou YYYY-MM
 * @returns {string} - Mês/ano formatado (YYYY-MM)
 */
export function formatMesAno(mesano) {
  if (!mesano) return mesano;
  
  if (typeof mesano === 'string') {
    // Formato YYYYMM
    if (mesano.length === 6 && /^\d{6}$/.test(mesano)) {
      return `${mesano.slice(0, 4)}-${mesano.slice(4)}`;
    }
    // Formato YYYY-MM-DD ou YYYY-MM
    if (mesano.includes('-')) {
      return mesano.slice(0, 7);
    }
  }
  
  return String(mesano);
}

/**
 * Formata número para exibição com separadores
 * @param {number} value - Valor numérico
 * @param {number} decimals - Número de casas decimais
 * @returns {string}
 */
export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '-';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata porcentagem
 * @param {number} value - Valor numérico (0-100)
 * @param {number} decimals - Número de casas decimais
 * @returns {string}
 */
export function formatPercent(value, decimals = 2) {
  if (value == null || isNaN(value)) return '-';
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Formata data para exibição
 * @param {string} dateString - Data no formato ISO
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}
