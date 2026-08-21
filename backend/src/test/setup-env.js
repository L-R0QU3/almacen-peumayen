// Variables mínimas para ejecutar tests del backend sin servidor real.
// TEST_DATABASE_URL (CI) → fallback local (dev de esta máquina).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:admin@localhost:5432/peumayen_test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-test';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-test';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
