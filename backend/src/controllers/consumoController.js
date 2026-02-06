import { runQuery } from '../services/queryService.js';
import { getSetorControleByMasterMap } from '../services/catalogService.js';

/**
 * Controller de consumo
 * Gerencia os endpoints relacionados a consumo de materiais
 */

/** Valores permitidos para filtro por setor_controle (evita valores arbitrários). */
const SETORES_FILTRO_VALIDOS = new Set(['UACE', 'ULOG']);

/**
 * Formata valor de data para exibição MM/YYYY (ex.: 2023-06-01 -> "06/2023").
 * @param {string|Date|null|undefined} value - Data ISO ou Date
 * @returns {string|null} - "MM/YYYY" ou null se inválido
 */
function toMMYYYY(value) {
  if (value == null) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear();
  return `${String(month).padStart(2, '0')}/${year}`;
}

/**
 * Projeção do mês atual
 */
export async function getProjecaoMesAtual(req, res, next) {
  try {
    const payload = await runQuery('projecao_mes_atual', {
      requiredFields: ['consumo_ate_hoje', 'consumo_projetado_mes'],
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

/**
 * Crescimento abrupto: mês anterior (consolidado) vs mês atual (parcial).
 * Variação % = ((atual - anterior) / anterior) * 100; exibe apenas quando > 30%.
 * MERGE com ctrl.safs_catalogo: mat_codigo = master -> setor_controle.
 * Filtro opcional: ?setor=UACE|ULOG atua sobre a coluna setor_controle.
 */
export async function getCrescimentoAbrupto(req, res, next) {
  try {
    const payload = await runQuery('crescimento_abrupto', {
      requiredFields: ['material', 'crescimento_percentual'],
      sortKey: null,
    });
    const data = payload.data || [];
    const setorFilter = req.query.setor != null ? String(req.query.setor).trim() : '';

    const map = await getSetorControleByMasterMap();
    const enriched = data.map((row) => {
      const id = row.mat_codigo != null ? String(row.mat_codigo).trim() : '';
      const setorControle = (id && map.get(id)) || null;
      return { ...row, setor_controle: setorControle };
    });

    let filtered = enriched;
    if (setorFilter && SETORES_FILTRO_VALIDOS.has(setorFilter)) {
      filtered = enriched.filter((row) => row.setor_controle === setorFilter);
    }

    res.json({
      data: filtered,
      meta: {
        count: filtered.length,
        query: 'crescimento_abrupto',
        setor_filter: setorFilter || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Materiais sem consumo nos últimos 6 meses (dados a partir de 2023; ordenado pelos que estão há mais tempo sem consumo).
 * ultimo_mes_consumo é formatado como MM/YYYY para exibição.
 */
export async function getConsumoZero6Meses(req, res, next) {
  try {
    const payload = await runQuery('consumo_zero_6_meses', {
      requiredFields: ['material', 'ultimo_mes_consumo'],
      sortKey: null,
    });
    const data = (payload.data || []).map((row) => ({
      ...row,
      ultimo_mes_consumo: toMMYYYY(row.ultimo_mes_consumo) ?? row.ultimo_mes_consumo,
    }));
    res.json({ ...payload, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Consumo por hospital/almoxarifado (filtro opcional por mat_codigo)
 */
export async function getConsumoPorHospitalAlmox(req, res, next) {
  try {
    const { mat_codigo } = req.query;
    const params = {};

    if (mat_codigo && mat_codigo !== 'all' && mat_codigo !== '') {
      const sanitized = sanitizeIntegerValue(mat_codigo);
      if (sanitized) {
        params.FILTER_MATERIAL = `AND TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) = '${sanitized}'`;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 [consumo-por-hospital-almox] Filtro código único (mat_cod_antigo): "${mat_codigo}" → ${sanitized}`);
        }
      } else {
        params.FILTER_MATERIAL = '';
      }
    } else {
      params.FILTER_MATERIAL = '';
    }

    const payload = await runQuery('consumo_por_hospital_almox', {
      requiredFields: ['centro_requisitante', 'media_consumo_6_meses'],
      sortKey: null, // Ordem definida no SQL: ORDER BY media_consumo_6_meses DESC
      params,
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

/**
 * Ranking de materiais críticos
 */
export async function getRankingMateriaisCriticos(req, res, next) {
  try {
    const payload = await runQuery('ranking_materiais_criticos', {
      requiredFields: ['material', 'media_mensal_consumo'],
      sortKey: 'media_mensal_consumo',
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

/**
 * Consumo x valor (impacto financeiro)
 */
export async function getConsumoXValor(req, res, next) {
  try {
    const payload = await runQuery('consumo_x_valor', {
      requiredFields: ['material', 'consumo_total', 'valor_total'],
      sortKey: 'valor_total',
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

/**
 * Sanitiza um valor para uso em SQL (prevenção básica de SQL injection)
 * Para valores numéricos, valida se é um número válido
 */
function sanitizeSqlValue(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  // Remove caracteres perigosos e limita tamanho
  const cleaned = value
    .replace(/['";\\]/g, '')
    .substring(0, 100)
    .trim();
  
  // Valida se é um número válido (inteiro ou decimal)
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

/**
 * Converte valor para inteiro seguro para uso em SQL
 * Como mat_codigo é INTEGER (int4) no banco, converte qualquer tipo para inteiro
 * @param {string|number} value - Valor a ser convertido
 * @returns {string|null} - Valor convertido para inteiro ou null se inválido
 */
function sanitizeIntegerValue(value) {
  // Se for null, undefined ou string vazia, retorna null
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Se já for número, valida e retorna
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return null;
    }
    // Converte para inteiro (trunca decimais)
    const intValue = Math.trunc(value);
    return String(intValue);
  }
  
  // Converte para string e limpa
  const strValue = String(value).trim();
  
  // Se for vazio após trim, retorna null
  if (strValue === '' || strValue === 'null' || strValue === 'undefined' || strValue === 'NaN') {
    return null;
  }
  
  // Remove caracteres não numéricos (exceto sinal negativo no início e ponto decimal)
  let cleaned = strValue.replace(/[^\d.-]/g, '');
  
  // Se não tiver nenhum dígito, retorna null
  if (!cleaned || cleaned === '' || cleaned === '-') {
    return null;
  }
  
  // Se tiver ponto decimal, remove a parte decimal (trunca para inteiro)
  if (cleaned.includes('.')) {
    cleaned = cleaned.split('.')[0];
    // Se ficou vazio após remover decimal, retorna null
    if (!cleaned || cleaned === '-') {
      return null;
    }
  }
  
  // Valida se é um número inteiro válido
  if (!/^-?\d+$/.test(cleaned)) {
    return null;
  }
  
  // Converte para inteiro e valida range
  const intValue = parseInt(cleaned, 10);
  if (isNaN(intValue) || !isFinite(intValue)) {
    return null;
  }
  
  // Valida range do int4 (PostgreSQL: -2147483648 a 2147483647)
  if (intValue < -2147483648 || intValue > 2147483647) {
    return null;
  }
  
  // Retorna como string para uso seguro em SQL (sem aspas, será usado como número)
  return String(intValue);
}

/**
 * Histórico de consumo mensal (filtro opcional por código único: trecho à esquerda do '-' em mat_cod_antigo)
 */
export async function getHistoricoConsumoMensal(req, res, next) {
  try {
    const { mat_codigo } = req.query;
    const params = {};

    if (mat_codigo && mat_codigo !== 'all' && mat_codigo !== '') {
      const sanitized = sanitizeIntegerValue(mat_codigo);
      if (sanitized) {
        params.FILTER_MATERIAL = `AND TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) = '${sanitized}'`;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Filtro código único (mat_cod_antigo): "${mat_codigo}" → ${sanitized}`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Valor inválido para mat_codigo: "${mat_codigo}"`);
        }
        params.FILTER_MATERIAL = '';
      }
    } else {
      params.FILTER_MATERIAL = '';
    }

    const payload = await runQuery('historico_consumo_mensal', {
      requiredFields: ['mesano', 'consumo_mensal'],
      sortKey: 'mesano',
      params,
    });
    
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

/**
 * Projeção do mês atual (filtro opcional por código único: trecho à esquerda do '-' em mat_cod_antigo)
 */
export async function getProjecaoMesAtualFiltrado(req, res, next) {
  try {
    const { mat_codigo } = req.query;
    const params = {};

    if (mat_codigo && mat_codigo !== 'all' && mat_codigo !== '') {
      const sanitized = sanitizeIntegerValue(mat_codigo);
      if (sanitized) {
        params.FILTER_MATERIAL = `AND TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) = '${sanitized}'`;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Filtro código único (mat_cod_antigo): "${mat_codigo}" → ${sanitized}`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Valor inválido para mat_codigo: "${mat_codigo}"`);
        }
        params.FILTER_MATERIAL = '';
      }
    } else {
      params.FILTER_MATERIAL = '';
    }

    const payload = await runQuery('projecao_mes_atual_filtrado', {
      requiredFields: ['consumo_ate_hoje', 'consumo_projetado_mes'],
      params,
    });
    
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

/**
 * Lista de materiais disponíveis para filtro
 */
export async function getListaMateriais(req, res, next) {
  try {
    const payload = await runQuery('lista_materiais', {
      requiredFields: ['mat_codigo', 'material'],
      sortKey: 'material',
    });
    
    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('Lista de materiais retornada:', {
        count: payload.data?.length || 0,
        sample: payload.data?.slice(0, 3),
      });
    }
    
    res.json(payload);
  } catch (error) {
    console.error('Erro ao buscar lista de materiais:', error);
    next(error);
  }
}

/**
 * Média dos últimos 6 consumos mensais, excluindo o mês atual (apenas meses fechados).
 * Filtro opcional por código único: trecho à esquerda do '-' em mat_cod_antigo.
 */
export async function getMediaUltimos6Consumos(req, res, next) {
  try {
    const { mat_codigo } = req.query;
    const params = {};

    if (mat_codigo && mat_codigo !== 'all' && mat_codigo !== '') {
      const sanitized = sanitizeIntegerValue(mat_codigo);
      if (sanitized) {
        params.FILTER_MATERIAL = `AND TRIM(SPLIT_PART(COALESCE(mat_cod_antigo, ''), '-', 1)) = '${sanitized}'`;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Filtro código único (mat_cod_antigo): "${mat_codigo}" → ${sanitized}`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Valor inválido para mat_codigo: "${mat_codigo}"`);
        }
        params.FILTER_MATERIAL = '';
      }
    } else {
      params.FILTER_MATERIAL = '';
    }

    const payload = await runQuery('media_ultimos_6_consumos', {
      requiredFields: ['media_ultimos_6_consumos'],
      params,
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
}
