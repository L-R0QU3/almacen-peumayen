import { errors } from '../lib/errors.js';
import { pool } from '../db/pool.js';
import { isModuleActive } from '../repositories/modules.repo.js';

/** Bloquea endpoints de módulos desactivados (configuración de módulos). */
export function requireModule(code) {
  return async (req, res, next) => {
    try {
      const active = await isModuleActive(pool, code);
      if (!active) return next(errors.moduleDisabled(code));
      next();
    } catch (err) {
      next(err);
    }
  };
}
