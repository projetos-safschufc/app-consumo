import { testConnection } from '../config/database.js';

/**
 * Controller de health check
 * Endpoints para verificar status da aplicação
 */

/**
 * Health check básico
 */
export async function getHealth(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Health check com verificação de banco de dados
 */
export async function getHealthCheck(req, res) {
  const dbConnected = await testConnection();
  
  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
}
