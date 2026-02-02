/**
 * Controller de alertas de consumo (destinatários CRUD + envio manual)
 */

import {
  listDestinatarios,
  createDestinatario,
  updateDestinatario,
  deleteDestinatario,
  enviarAlertasCrescimentoAbrupto,
} from '../services/alertasConsService.js';

/**
 * GET /api/alertas-cons
 * Lista destinatários. Query: ?ativo=false para incluir inativos.
 */
export async function getAlertasCons(req, res, next) {
  try {
    const ativo = req.query.ativo === 'false' ? false : true;
    const rows = await listDestinatarios({ ativo });
    res.json({ data: rows, meta: { count: rows.length } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/alertas-cons
 * Cria novo destinatário. Body: { nm_destinatario, email_destinatario, ativo? }
 */
export async function postAlertasCons(req, res, next) {
  try {
    const created = await createDestinatario(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/alertas-cons/:id
 * Atualiza destinatário. Body: { nm_destinatario?, email_destinatario?, ativo? }
 */
export async function putAlertasCons(req, res, next) {
  try {
    const updated = await updateDestinatario(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/alertas-cons/:id
 * Soft-delete (ativo = false)
 */
export async function deleteAlertasCons(req, res, next) {
  try {
    await deleteDestinatario(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/alertas/enviar-manual
 * Dispara envio do alerta de crescimento abrupto para todos ativos
 */
export async function postEnviarManual(req, res, next) {
  try {
    const result = await enviarAlertasCrescimentoAbrupto();
    res.json({
      ok: result.failed === 0,
      sent: result.sent ?? 0,
      failed: result.failed ?? 0,
      errors: result.errors ?? [],
      message: result.message ?? (result.sent > 0 ? `Enviados: ${result.sent}` : undefined),
    });
  } catch (err) {
    next(err);
  }
}
