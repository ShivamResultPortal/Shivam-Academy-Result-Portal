import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production';
const isRailway = connectionString && (
  connectionString.includes('rlwy.net') || 
  connectionString.includes('railway') ||
  isProduction
);

const poolConfig: PoolConfig = {
  connectionString,
  ssl: isRailway ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error on idle connection:', err.message);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('Executed query:', { text, duration, rows: res.rowCount });
  }
  return res;
};

export async function testConnection(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`✅ Connected to PostgreSQL database [${res.rows[0].db_name}] at ${res.rows[0].current_time}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ Warning: PostgreSQL not reachable (${error.message}).`);
    console.warn('Check DATABASE_URL in your .env or Railway service configuration.');
    return false;
  }
}
