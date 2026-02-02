/**
 * Serviço de CRUD para destinatários de alertas de consumo (ctrl.alerta_cons)
 * Usa pool SAFS (banco safs, porta 5433). Dados de consumo (crescimento abrupto) vêm do PowerBI via runQuery.
 */

import { poolSafs } from '../config/database.js';
import { runQuery } from './queryService.js';
import { sendAlertaCrescimentoAbrupto } from './emailService.js';

const SCHEMA = process.env.DB_SCHEMA || 'ctrl';
const TABLE = `${SCHEMA}.alerta_cons`;

/**
 * Lista destinatários (apenas ativos por padrão)
 * @param {{ ativo?: boolean }} options - ativo=false para listar todos
 * @returns {Promise<Array<{id_alerta, nm_destinatario, email_destinatario, ativo, created_at}>>}
 */
export async function listDestinatarios(options = {}) {
  const onlyActive = options.ativo !== false;
  const client = await poolSafs.connect();
  try {
    const sql = onlyActive
      ? `SELECT id_alerta, nm_destinatario, email_destinatario, ativo, created_at FROM ${TABLE} WHERE ativo = true ORDER BY nm_destinatario`
      : `SELECT id_alerta, nm_destinatario, email_destinatario, ativo, created_at FROM ${TABLE} ORDER BY nm_destinatario`;
    const result = await client.query(sql);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Cria um novo destinatário
 * @param {{ nm_destinatario: string, email_destinatario: string, ativo?: boolean }} data
 * @returns {Promise<{id_alerta, nm_destinatario, email_destinatario, ativo, created_at}>}
 */
export async function createDestinatario(data) {
  const { nm_destinatario, email_destinatario, ativo = true } = data;
  if (!nm_destinatario || !email_destinatario) {
    throw new Error('nm_destinatario e email_destinatario são obrigatórios');
  }
  const client = await poolSafs.connect();
  try {
    const sql = `INSERT INTO ${TABLE} (nm_destinatario, email_destinatario, ativo) VALUES ($1, $2, $3) RETURNING id_alerta, nm_destinatario, email_destinatario, ativo, created_at`;
    const result = await client.query(sql, [
      String(nm_destinatario).trim().substring(0, 255),
      String(email_destinatario).trim().toLowerCase().substring(0, 255),
      !!ativo,
    ]);
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      const e = new Error('E-mail já cadastrado');
      e.status = 409;
      throw e;
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Atualiza um destinatário
 * @param {number} id
 * @param {{ nm_destinatario?: string, email_destinatario?: string, ativo?: boolean }} data
 * @returns {Promise<{id_alerta, nm_destinatario, email_destinatario, ativo, created_at}>}
 */
export async function updateDestinatario(id, data) {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) {
    throw new Error('ID inválido');
  }
  const client = await poolSafs.connect();
  try {
    const updates = [];
    const values = [];
    let idx = 1;
    if (data.nm_destinatario !== undefined) {
      updates.push(`nm_destinatario = $${idx++}`);
      values.push(String(data.nm_destinatario).trim().substring(0, 255));
    }
    if (data.email_destinatario !== undefined) {
      updates.push(`email_destinatario = $${idx++}`);
      values.push(String(data.email_destinatario).trim().toLowerCase().substring(0, 255));
    }
    if (data.ativo !== undefined) {
      updates.push(`ativo = $${idx++}`);
      values.push(!!data.ativo);
    }
    if (updates.length === 0) {
      const sel = await client.query(`SELECT id_alerta, nm_destinatario, email_destinatario, ativo, created_at FROM ${TABLE} WHERE id_alerta = $1`, [idNum]);
      if (sel.rows.length === 0) {
        const e = new Error('Destinatário não encontrado');
        e.status = 404;
        throw e;
      }
      return sel.rows[0];
    }
    values.push(idNum);
    const sql = `UPDATE ${TABLE} SET ${updates.join(', ')} WHERE id_alerta = $${idx} RETURNING id_alerta, nm_destinatario, email_destinatario, ativo, created_at`;
    const result = await client.query(sql, values);
    if (result.rows.length === 0) {
      const e = new Error('Destinatário não encontrado');
      e.status = 404;
      throw e;
    }
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      const e = new Error('E-mail já cadastrado');
      e.status = 409;
      throw e;
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Remove um destinatário (soft-delete: ativo = false)
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteDestinatario(id) {
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) throw new Error('ID inválido');
  const client = await poolSafs.connect();
  try {
    const result = await client.query(`UPDATE ${TABLE} SET ativo = false WHERE id_alerta = $1 RETURNING id_alerta`, [idNum]);
    if (result.rows.length === 0) {
      const e = new Error('Destinatário não encontrado');
      e.status = 404;
      throw e;
    }
  } finally {
    client.release();
  }
}

/**
 * Retorna lista de e-mails ativos para envio
 * @returns {Promise<string[]>}
 */
export async function getEmailsAtivos() {
  const rows = await listDestinatarios({ ativo: true });
  return rows.map((r) => r.email_destinatario).filter(Boolean);
}

/**
 * Busca dados de crescimento abrupto (≥ 30%) para o relatório
 * @returns {Promise<Array<{material, consumo_mes_anterior, consumo_mes_atual, crescimento_percentual}>>}
 */
export async function getDadosCrescimentoAbrupto() {
  const payload = await runQuery('crescimento_abrupto', {
    requiredFields: ['material', 'crescimento_percentual'],
    sortKey: null,
  });
  return payload.data || [];
}

/**
 * Dispara envio do alerta de crescimento abrupto para todos os ativos
 * @returns {Promise<{sent: number, failed: number, errors: Array<{email, message}>}>}
 */
export async function enviarAlertasCrescimentoAbrupto() {
  const [emails, rows] = await Promise.all([
    getEmailsAtivos(),
    getDadosCrescimentoAbrupto(),
  ]);

  if (emails.length === 0) {
    return { sent: 0, failed: 0, errors: [], message: 'Nenhum destinatário ativo' };
  }

  return sendAlertaCrescimentoAbrupto(emails, rows);
}
