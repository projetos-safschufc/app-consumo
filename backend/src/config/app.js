import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuração da aplicação
 */
export const config = {
  app: {
    host: process.env.APP_HOST || '0.0.0.0',
    port: parseInt(process.env.APP_PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development',
    debug: process.env.APP_DEBUG === 'true',
  },
  cors: {
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['*'],
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    sslmode: process.env.DB_SSLMODE || 'prefer',
  },
};

/**
 * Valida se todas as variáveis de ambiente necessárias estão definidas
 */
export function validateConfig() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente faltando: ${missing.join(', ')}. ` +
      `Verifique o arquivo .env`
    );
  }
}
