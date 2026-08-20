import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { errors } from '../lib/errors.js';
import { pool } from '../db/pool.js';
import { findUserWithContext } from '../repositories/users.repo.js';

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw errors.unauthorized('Credenciales incorrectas');

  const context = await findUserWithContext(pool, data.user.id);
  if (!context) throw errors.forbidden('Usuario sin perfil en el sistema');
  if (!context.is_active) throw errors.forbidden('Usuario desactivado');

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    user: context,
  };
}

/** Revoca todas las sesiones del usuario (logout global vía service role). */
export async function logout(userId) {
  const { error } = await supabaseAdmin.auth.admin.signOut(userId);
  if (error) throw errors.internal('No se pudo cerrar la sesión');
}
