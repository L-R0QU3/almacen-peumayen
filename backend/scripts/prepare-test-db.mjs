/**
 * Prepara la base de datos de TEST: crea la BD si no existe y aplica migraciones.
 * Uso: TEST_DATABASE_URL=postgres://... node scripts/prepare-test-db.mjs
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:admin@localhost:5432/peumayen_test';

const url = new URL(TEST_DATABASE_URL);
const dbName = url.pathname.slice(1);

// Conexión al servidor (base "postgres") para crear la BD de test
const adminUrl = new URL(TEST_DATABASE_URL);
adminUrl.pathname = '/postgres';

const client = new pg.Client({ connectionString: adminUrl.toString() });
await client.connect();
try {
  // BD de test: siempre se recrea desde cero (estado determinista por corrida)
  await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  await client.query(`CREATE DATABASE "${dbName}"`);
  console.log(`✓ Base de datos de test recreada: ${dbName}`);
} finally {
  await client.end();
}

// Aplica migraciones con node-pg-migrate (paquete database/)
const databaseDir = path.resolve(fileURLToPath(new URL('../../database', import.meta.url)));
console.log('→ Aplicando migraciones…');
execSync('npm run migrate', {
  cwd: databaseDir,
  env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  stdio: 'inherit',
});
console.log('✓ Migraciones aplicadas en la base de test');
