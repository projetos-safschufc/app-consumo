/**
 * Serviço de catálogo (ctrl.safs_catalogo) no banco SAFS.
 * Fornece o mapeamento master -> setor_controle para MERGE com dados de
 * gad_dlih_safs.v_df_movimento (código único = parte de mat_cod_antigo antes do '-').
 *
 * Requisitos: master e setor_controle tratados como String para consistência no MERGE.
 * Conexão SAFS: poolSafs (DB_HOST, DB_SAFS_PORT, DB_SAFS_DATABASE, DB_USER, DB_PASSWORD).
 */

import { poolSafs } from '../config/database.js';

const SCHEMA = process.env.DB_SCHEMA || 'ctrl';
const TABLE_CATALOGO = `${SCHEMA}.safs_catalogo`;

/**
 * Retorna mapa master (string) -> setor_controle (string) a partir de ctrl.safs_catalogo.
 * Garante tipos String via CAST e TRIM para compatibilidade no MERGE com id_material.
 *
 * @returns {Promise<Map<string, string>>}
 */
export async function getSetorControleByMasterMap() {
  const client = await poolSafs.connect();
  try {
    const result = await client.query(
      `SELECT
        TRIM(CAST(master AS TEXT)) AS master,
        TRIM(CAST(setor_controle AS TEXT)) AS setor_controle
       FROM ${TABLE_CATALOGO}
       WHERE master IS NOT NULL AND setor_controle IS NOT NULL
         AND TRIM(CAST(master AS TEXT)) <> ''
         AND TRIM(CAST(setor_controle AS TEXT)) <> ''`
    );
    const map = new Map();
    for (const row of result.rows || []) {
      const master = String(row.master ?? '').trim();
      const setor = String(row.setor_controle ?? '').trim();
      if (master) map.set(master, setor);
    }
    return map;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CatalogService] Erro ao carregar catálogo (tabela pode não existir):', err.message);
    }
    return new Map();
  } finally {
    client.release();
  }
}

/**
 * Valores permitidos para o filtro de setor na interface (Todos, UACE, ULOG).
 */
export const SETORES_FILTRO = Object.freeze(['Todos', 'UACE', 'ULOG']);
