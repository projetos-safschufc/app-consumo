/**
 * Job agendado: envio de alertas de crescimento abrupto
 * Cron: dias 6, 16 e 25 de cada mês às 08:00 (configurável via ALERT_CRON_SCHEDULE)
 */

import cron from 'node-cron';
import { enviarAlertasCrescimentoAbrupto } from '../services/alertasConsService.js';

const CRON_SCHEDULE = process.env.ALERT_CRON_SCHEDULE || '0 8 6,16,25 * *';

function runJob() {
  const start = Date.now();
  console.log(`[Alertas] Iniciando job de crescimento abrupto em ${new Date().toISOString()}`);

  enviarAlertasCrescimentoAbrupto()
    .then((result) => {
      const elapsed = Date.now() - start;
      console.log(`[Alertas] Job concluído em ${elapsed}ms. Enviados: ${result.sent}, Falhas: ${result.failed}`);
      if (result.errors?.length) {
        result.errors.forEach((e) => console.error(`[Alertas] Erro para ${e.email}:`, e.message));
      }
    })
    .catch((err) => {
      console.error('[Alertas] Erro no job:', err.message);
      if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
      }
    });
}

/**
 * Registra o cron e opcionalmente executa uma vez ao iniciar (apenas em dev, se desejado)
 */
export function startAlertasCron() {
  if (!cron.validate(CRON_SCHEDULE)) {
    console.warn(`[Alertas] Cron inválido: ${CRON_SCHEDULE}. Use padrão: 0 8 6,16,25 * *`);
    return;
  }
  cron.schedule(CRON_SCHEDULE, runJob, {
    timezone: process.env.TZ || undefined,
  });
  console.log(`[Alertas] Cron registrado: ${CRON_SCHEDULE} (dias 6, 16 e 25 às 08:00)`);
}

export { runJob };
