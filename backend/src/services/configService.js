import { errors } from '../lib/errors.js';
import { pool } from '../db/pool.js';
import { getSettings, upsertSetting } from '../repositories/settings.repo.js';

export async function getConfig() {
  return getSettings(pool);
}

/** Actualiza parcialmente la configuración (merge por clave). */
export async function updateConfig(patch) {
  const current = await getSettings(pool);
  for (const key of Object.keys(patch)) {
    if (!(key in current)) {
      throw errors.badRequest(`Clave de configuración desconocida: ${key}`);
    }
    if (typeof patch[key] !== 'object' || patch[key] === null) {
      throw errors.badRequest(`La configuración "${key}" debe ser un objeto`);
    }
    await upsertSetting(pool, key, { ...current[key], ...patch[key] });
  }
  return getConfig();
}
