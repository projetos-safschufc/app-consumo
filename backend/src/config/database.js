import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * Pool de conexões PostgreSQL
 * Gerencia conexões de forma eficiente e escalável
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Tratamento de erros do pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
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

export default pool;
