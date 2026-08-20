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

const RETRYABLE_CODES = new Set(['40P01', '40001']); // deadlock / serialización

/**
 * Igual que withTransaction, pero reintenta automáticamente ante deadlocks
 * o errores de serialización (estrategia de concurrencia, punto 17 de la
 * arquitectura): hasta 3 intentos con backoff exponencial + jitter.
 */
export async function withTransactionRetry(fn, { maxRetries = 3 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await withTransaction(fn);
    } catch (err) {
      lastError = err;
      if (!RETRYABLE_CODES.has(err.code)) throw err;
      if (attempt >= maxRetries) throw err;
      const delay = 50 * 2 ** (attempt - 1) + Math.floor(Math.random() * 50);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
