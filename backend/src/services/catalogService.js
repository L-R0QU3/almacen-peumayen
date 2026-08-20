import { errors } from '../lib/errors.js';
import { withTransaction } from '../db/transactions.js';
import { pool } from '../db/pool.js';
import * as repo from '../repositories/catalog.repo.js';

function normalize(fields) {
  // '' → null para campos opcionales de texto (rut, email, phone, address...)
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = typeof v === 'string' && v.trim() === '' ? null : v;
  }
  return out;
}

export async function listCatalog(name, filters) {
  if (!repo.CATALOG_CONFIG[name]) throw errors.notFound('Catálogo desconocido');
  return repo.listCatalog(pool, name, filters);
}

export async function getCatalogItem(name, id) {
  if (!repo.CATALOG_CONFIG[name]) throw errors.notFound('Catálogo desconocido');
  const item = await repo.findCatalogById(pool, name, id);
  if (!item) throw errors.notFound('Registro no encontrado');
  return item;
}

export async function createCatalogItem(name, data) {
  if (!repo.CATALOG_CONFIG[name]) throw errors.notFound('Catálogo desconocido');
  return withTransaction(async (client) => repo.createCatalog(client, name, normalize(data)));
}

export async function updateCatalogItem(name, id, data) {
  if (!repo.CATALOG_CONFIG[name]) throw errors.notFound('Catálogo desconocido');
  return withTransaction(async (client) => {
    const existing = await repo.findCatalogById(client, name, id);
    if (!existing) throw errors.notFound('Registro no encontrado');
    return repo.updateCatalog(client, name, id, normalize(data));
  });
}

export async function deactivateCatalogItem(name, id) {
  if (!repo.CATALOG_CONFIG[name]) throw errors.notFound('Catálogo desconocido');
  return withTransaction(async (client) => {
    const existing = await repo.findCatalogById(client, name, id);
    if (!existing) throw errors.notFound('Registro no encontrado');
    if (!existing.is_active) throw errors.badRequest('El registro ya está desactivado');
    return repo.deactivateCatalog(client, name, id);
  });
}
