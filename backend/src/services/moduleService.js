import { errors } from '../lib/errors.js';
import { pool } from '../db/pool.js';
import {
  findAllModules,
  findModuleByCode,
  isModuleActive,
  setModuleActive,
} from '../repositories/modules.repo.js';

/** Mapa de dependencias entre módulos: dependiente → módulos que requiere. */
export const DEPENDENCIES = {
  quotations: ['products', 'customers'],
  inventory: ['products'],
  sales: ['products', 'customers'],
  pos: ['sales'],
  cash: ['sales'],
  purchases: ['products', 'suppliers'],
  reports: ['sales'],
};

export async function listModules() {
  return findAllModules(pool);
}

export async function updateModuleActive(code, isActive) {
  const module = await findModuleByCode(pool, code);
  if (!module) throw errors.notFound(`Módulo no encontrado: ${code}`);

  if (module.is_core && !isActive) {
    throw errors.badRequest(`El módulo "${module.name}" es core y no puede desactivarse`);
  }

  if (!isActive) {
    const blockers = [];
    for (const [dependent, deps] of Object.entries(DEPENDENCIES)) {
      if (deps.includes(code) && (await isModuleActive(pool, dependent))) {
        blockers.push(dependent);
      }
    }
    if (blockers.length > 0) {
      throw errors.conflict(
        'MODULE_DEPENDENCY',
        `No se puede desactivar "${module.name}": dependen de él ${blockers.join(', ')}`
      );
    }
  }

  return setModuleActive(pool, code, isActive);
}
