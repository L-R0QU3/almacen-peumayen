import { errors } from '../lib/errors.js';

/** Verifica que el usuario autenticado tenga el permiso (código) requerido. */
export function requirePermission(code) {
  return (req, res, next) => {
    if (!req.auth) return next(errors.unauthorized());
    if (!req.auth.permissions?.includes(code)) {
      return next(errors.forbidden(`Permiso requerido: ${code}`));
    }
    next();
  };
}
