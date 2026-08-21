/**
 * Diagnóstico de conexión a la BD de test en CI.
 * Imprime las URLs en uso, la versión de pg y el resultado de una conexión real,
 * para localizar el 28P01 (password auth failed) que solo ocurre en CI/Linux.
 */
import pg from 'pg';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

console.log('TEST_DATABASE_URL=', process.env.TEST_DATABASE_URL);
console.log('DATABASE_URL=', process.env.DATABASE_URL);
console.log('PG_USER_ENV=', process.env.PGUSER || '(sin PGUSER)');
console.log('pg version=', require('pg/package.json').version);

const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
if (!url) {
  console.log('SIN DATABASE_URL: no se puede probar');
} else {
  try {
    const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 8000 });
    await client.connect();
    const r = await client.query('SELECT current_user AS u');
    console.log(`CONNECT OK user=${r.rows[0].u}`);
    await client.end();
  } catch (e) {
    console.log(
      `CONNECT FAIL: ${e.message} | ${JSON.stringify({ code: e.code, severity: e.severity })}`
    );
  }
}
