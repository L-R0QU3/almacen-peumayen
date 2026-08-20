/**
 * Bootstrap del primer usuario ADMIN (Supabase Auth + perfil public.users).
 *
 * Uso:
 *   npm run create-admin -- --email=admin@peumayen.cl --password='clave' --name='Admin'
 *
 * Requiere en .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

async function main() {
  const { email, password, name } = parseArgs(process.argv.slice(2));
  if (!email || !password || !name) {
    console.error('Uso: node scripts/create-admin.mjs --email=... --password=... --name=...');
    process.exit(1);
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.DATABASE_URL) {
    console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL en el entorno.');
    process.exit(1);
  }

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  console.log(`→ Creando usuario en Supabase Auth: ${email}`);
  const { data: user, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (createError) {
    // Si el usuario ya existe, lo recuperamos
    if (createError.code === 'user_already_exists' || /already registered/i.test(createError.message)) {
      console.log('→ El usuario ya existe en Supabase Auth; se usará su id.');
    } else {
      throw createError;
    }
  }

  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let userId = user?.id;
  if (!userId) {
    const found = existing.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error('No se pudo resolver el usuario en Supabase Auth');
    userId = found.id;
  }

  const { rows: roles } = await pool.query(
    `SELECT id FROM public.roles WHERE code = 'ADMIN' AND is_active = true LIMIT 1`
  );
  if (roles.length === 0) throw new Error('No existe el rol ADMIN en la base de datos');
  const roleId = roles[0].id;

  await pool.query(
    `INSERT INTO public.users (id, email, name, role_id, is_active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role_id = EXCLUDED.role_id, is_active = true`,
    [userId, email.toLowerCase(), name, roleId]
  );

  console.log(`✓ ADMIN creado: ${email} (id ${userId})`);
  await pool.end();
}

main().catch((err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});
