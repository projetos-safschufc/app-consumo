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
    name: process.env.DB_NAME || process.env.DB_DATABASE || process.env.DB_CONSUMO_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    sslmode: process.env.DB_SSLMODE || 'prefer',
    safsPort: parseInt(process.env.DB_SAFS_PORT || '5433', 10),
    safsDatabase: process.env.DB_SAFS_DATABASE || 'safs',
  },
};

/**
 * Valida se todas as variáveis de ambiente necessárias estão definidas.
 * DB_PASSWORD ou DB_PASSWORD_FILE (arquivo com a senha) é aceito para evitar problemas com # no .env.
 */
export function validateConfig() {
  const required = ['DB_HOST', 'DB_USER'];
  const missing = required.filter((key) => !process.env[key]);
  const hasDbName = (process.env.DB_NAME != null && process.env.DB_NAME !== '') ||
    (process.env.DB_DATABASE != null && process.env.DB_DATABASE !== '');
  const hasPassword = process.env.DB_PASSWORD != null && process.env.DB_PASSWORD !== '';
  const hasPasswordFile = process.env.DB_PASSWORD_FILE != null && process.env.DB_PASSWORD_FILE.trim() !== '';

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente faltando: ${missing.join(', ')}. Verifique o arquivo .env`
    );
  }
  if (!hasDbName) {
    throw new Error(
      'DB_NAME, DB_DATABASE ou DB_CONSUMO_DATABASE deve estar definido no .env (banco PowerBI/consumo).'
    );
  }
  if (!hasPassword && !hasPasswordFile) {
    throw new Error(
      'Defina DB_PASSWORD ou DB_PASSWORD_FILE no .env. Para senhas com # ou caracteres especiais, use DB_PASSWORD_FILE.'
    );
  }
}
