import pg from 'pg';
import dotenv from 'dotenv';
import { resolveDbPassword } from './envPassword.js';

dotenv.config();

const { Pool } = pg;

/**
 * Senha do banco: lida de DB_PASSWORD_FILE (recomendado para senhas com #, !, @)
 * ou de process.env.DB_PASSWORD. Usada em ambos os pools.
 */
const dbPassword = resolveDbPassword();

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const sslOpt = process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false;
const poolOpts = { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 };

/**
 * Pool PowerBI (consumo) – gad_dlih_safs.v_df_movimento
 * Porta 5432, database powerbi (DB_NAME / DB_DATABASE / DB_CONSUMO_DATABASE)
 */
const dbNamePowerbi = process.env.DB_NAME || process.env.DB_DATABASE || process.env.DB_CONSUMO_DATABASE || 'powerbi';
const pool = new Pool({
  host,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: dbNamePowerbi,
  user,
  password: dbPassword,
  ssl: sslOpt,
  ...poolOpts,
});

/**
 * Pool SAFS (alertas) – ctrl.alerta_cons
 * Porta 5433, database safs (DB_SAFS_DATABASE)
 */
const dbNameSafs = process.env.DB_SAFS_DATABASE || 'safs';
const poolSafs = new Pool({
  host,
  port: parseInt(process.env.DB_SAFS_PORT || '5433', 10),
  database: dbNameSafs,
  user,
  password: dbPassword,
  ssl: sslOpt,
  ...poolOpts,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool PowerBI (consumo):', err);
});

poolSafs.on('error', (err) => {
  console.error('Erro inesperado no pool SAFS (alertas):', err);
});

/**
 * Executa uma query SQL e retorna os resultados normalizados
 * @param {string} sql - Query SQL a ser executada
 * @returns {Promise<{columns: string[], rows: any[]}>}
 */
export async function executeQuery(sql) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    // result.rows já são objetos com chaves nomeadas
    // result.fields contém metadados das colunas
    const columns = result.fields.map(field => field.name);
    const rows = result.rows; // Já são objetos, não arrays
    return { columns, rows };
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Testa a conexão com o banco de dados
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    return false;
  }
}

/**
 * Garante que o schema ctrl e a tabela ctrl.alerta_cons existam no banco SAFS.
 * Usa poolSafs (safs:5433). Não usa PowerBI (sem permissão para CREATE SCHEMA).
 * @returns {Promise<void>}
 */
export async function ensureAlertasConsTable() {
  const client = await poolSafs.connect();
  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS ctrl;');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ctrl.alerta_cons (
        id_alerta         SERIAL PRIMARY KEY,
        nm_destinatario   TEXT NOT NULL,
        email_destinatario VARCHAR(255) UNIQUE NOT NULL,
        ativo             BOOLEAN DEFAULT true,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Schema ctrl e tabela ctrl.alerta_cons verificados/criados.');
    }
  } catch (err) {
    console.error('❌ Erro ao criar schema/tabela ctrl.alerta_cons:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
export { poolSafs };
