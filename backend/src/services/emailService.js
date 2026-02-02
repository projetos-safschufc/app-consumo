/**
 * Serviço de envio de e-mail
 * Utiliza nodemailer com SMTP (Gmail). Template HTML inline para compatibilidade.
 * Suporta SMTP_PASSWORD ou SMTP_PASSWORD_FILE (caminho de arquivo ou senha literal com #, !, @).
 */

import nodemailer from 'nodemailer';
import { resolveSmtpPassword } from '../config/envPassword.js';

function getTransporter() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER != null ? String(process.env.SMTP_USER).trim() : '';
  const passRaw = resolveSmtpPassword();
  const pass = passRaw != null ? String(passRaw).trim() : '';

  if (!user) {
    throw new Error(
      'SMTP_USER deve estar definido no .env para envio de e-mails. Defina SMTP_USER=seu_email@gmail.com'
    );
  }
  if (!pass) {
    throw new Error(
      'SMTP_PASSWORD ou SMTP_PASSWORD_FILE deve estar definido no .env para envio de e-mails. ' +
      'Para senhas com caracteres especiais, use SMTP_PASSWORD_FILE (caminho ou valor entre aspas).'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * Gera o HTML do e-mail de alerta de crescimento abrupto
 * @param {Array<{material: string, consumo_mes_anterior: number, consumo_mes_atual: number, crescimento_percentual: number}>} rows
 * @returns {string} HTML
 */
export function buildAlertaCrescimentoAbruptoHtml(rows = []) {
  const dataHora = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  const rowsHtml =
    rows.length === 0
      ? `
    <tr>
      <td colspan="4" style="padding: 12px; text-align: center; color: #666;">Nenhum material com crescimento ≥ 30% no período.</td>
    </tr>
  `
      : rows
          .map((r) => {
            const pct = Number(r.crescimento_percentual);
            const isAlto = pct > 100;
            const rowStyle = isAlto
              ? 'background-color: #fff3f3;'
              : '';
            const pctStyle = isAlto
              ? 'color: #c00; font-weight: bold;'
              : '';
            return `
    <tr style="${rowStyle}">
      <td style="padding: 10px; border: 1px solid #e0e0e0;">${escapeHtml(String(r.material || ''))}</td>
      <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right;">${formatNum(r.consumo_mes_anterior)}</td>
      <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right;">${formatNum(r.consumo_mes_atual)}</td>
      <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: right; ${pctStyle}">${formatNum(pct)}%</td>
    </tr>`;
          })
          .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta SAF – Monitoramento de Materiais</title>
</head>
<body style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px;">
  <div style="max-width: 720px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1a5276 0%, #2471a3 100%); color: #fff; padding: 24px 24px 20px;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 600;">Alerta SAF – Monitoramento de Materiais</h1>
      <p style="margin: 8px 0 0; opacity: 0.95; font-size: 14px;">Materiais com crescimento abrupto (≥ 30%)</p>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px; color: #444; font-size: 14px;">
        Segue relatório com materiais que apresentaram aumento de consumo superior a 30% entre o mês anterior e o mês atual (parcial).
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left;">Material</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: right;">Mês anterior</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: right;">Mês atual</th>
            <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: right;">% Cresc.</th>
          </tr>
        </thead>
        <tbody>
${rowsHtml}
        </tbody>
      </table>
    </div>
    <div style="padding: 16px 24px; background: #f9f9f9; border-top: 1px solid #eee; font-size: 12px; color: #666;">
      <p style="margin: 0;">Gerado em: ${dataHora}</p>
      <p style="margin: 6px 0 0;">Este é um alerta automático. Não responda a este e-mail.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNum(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);
}

/**
 * Envia o alerta de crescimento abrupto para uma lista de destinatários
 * @param {string[]} to - Lista de e-mails
 * @param {Array<{material, consumo_mes_anterior, consumo_mes_atual, crescimento_percentual}>} rows
 * @returns {Promise<{sent: number, failed: number, errors: Array<{email: string, message: string}>}>}
 */
export async function sendAlertaCrescimentoAbrupto(to = [], rows = []) {
  const toList = (to || []).map((e) => (e != null ? String(e).trim() : '')).filter(Boolean);
  if (!toList.length) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const from = (process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@localhost').trim();
  const subject = 'Alerta SAF – Materiais com crescimento abrupto';
  const html = buildAlertaCrescimentoAbruptoHtml(rows);

  let transporter;
  try {
    transporter = getTransporter();
  } catch (err) {
    console.error('❌ Erro ao configurar SMTP:', err.message);
    throw err;
  }

  const result = { sent: 0, failed: 0, errors: [] };

  for (const email of toList) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      });
      result.sent++;
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 E-mail enviado para ${email}`);
      }
    } catch (err) {
      result.failed++;
      result.errors.push({ email, message: err.message || String(err) });
      console.error(`❌ Falha ao enviar para ${email}:`, err.message);
    }
  }

  return result;
}
