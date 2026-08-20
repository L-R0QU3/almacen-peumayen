import { errors } from '../lib/errors.js';
import { withTransaction } from '../db/transactions.js';
import { pool } from '../db/pool.js';
import * as repo from '../repositories/customers.repo.js';

function normalize(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = typeof v === 'string' && v.trim() === '' ? null : v;
  }
  return out;
}

export async function listCustomers(filters) {
  return repo.findMany(pool, filters);
}

export async function getCustomer(id) {
  const customer = await repo.findById(pool, id);
  if (!customer) throw errors.notFound('Cliente no encontrado');
  return customer;
}

export async function createCustomer(data) {
  return withTransaction(async (client) => repo.create(client, normalize(data)));
}

export async function updateCustomer(id, data) {
  return withTransaction(async (client) => {
    const existing = await repo.findById(client, id);
    if (!existing) throw errors.notFound('Cliente no encontrado');
    const updated = await repo.update(client, id, normalize(data));
    if (!updated) throw errors.notFound('Cliente no encontrado');
    return updated;
  });
}

/** Soft delete: is_active = false. */
export async function deactivateCustomer(id) {
  return withTransaction(async (client) => {
    const existing = await repo.findById(client, id);
    if (!existing) throw errors.notFound('Cliente no encontrado');
    if (!existing.is_active) throw errors.badRequest('El cliente ya está desactivado');
    return repo.deactivate(client, id);
  });
}
