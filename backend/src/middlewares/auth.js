import { supabase } from '../lib/supabase.js';
import { errors } from '../lib/errors.js';
import { pool } from '../db/pool.js';
import { findUserWithContext } from '../repositories/users.repo.js';

/**
 * Autenticación: valida el JWT de Supabase en cada request y carga
 * el contexto de usuario (id, email, rol, permisos) en req.auth.
 */
export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw errors.unauthorized();

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw errors.unauthorized();

    const context = await findUserWithContext(pool, data.user.id);
    if (!context) throw errors.forbidden('Usuario sin perfil en el sistema');
    if (!context.is_active) throw errors.forbidden('Usuario desactivado');

    req.auth = {
      userId: data.user.id,
      email: data.user.email,
      name: context.name,
      role: context.role,
      permissions: context.permissions,
    };
    next();
  } catch (err) {
    next(err);
  }
}
