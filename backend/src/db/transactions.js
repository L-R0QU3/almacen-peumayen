import { pool } from './pool.js';

/**
 * Ejecuta `fn(client)` dentro de una transacción PostgreSQL.
 * BEGIN → fn → COMMIT, o ROLLBACK ante cualquier error.
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // si el ROLLBACK falla, el pool la descartará igualmente
    }
    throw err;
  } finally {
    client.release();
  }
}
