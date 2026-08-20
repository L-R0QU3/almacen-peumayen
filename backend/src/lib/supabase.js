import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

/** Cliente público (anon): valida tokens y ejecuta operaciones de auth por sesión. */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Cliente administrativo (service role): SOLO backend, nunca expuesto al frontend. */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
