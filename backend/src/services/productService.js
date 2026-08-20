import { errors } from '../lib/errors.js';
import { withTransaction } from '../db/transactions.js';
import { pool } from '../db/pool.js';
import * as repo from '../repositories/products.repo.js';

/** Margen sobre el precio de compra, en porcentaje (2 decimales). */
export function calcMargin(purchasePrice, salePrice) {
  if (!purchasePrice || purchasePrice <= 0) return 0;
  return Math.round(((salePrice - purchasePrice) / purchasePrice) * 10_000) / 100;
}

export async function listProducts(filters) {
  return repo.findMany(pool, filters);
}

export async function getProduct(id) {
  const product = await repo.findById(pool, id);
  if (!product) throw errors.notFound('Producto no encontrado');
  return product;
}

export async function createProduct(data) {
  return withTransaction(async (client) => {
    const created = await repo.create(client, {
      ...data,
      margin_pct: calcMargin(data.purchase_price, data.sale_price),
    });
    return repo.findById(client, created.id);
  });
}

export async function updateProduct(id, data) {
  return withTransaction(async (client) => {
    const existing = await repo.findById(client, id);
    if (!existing) throw errors.notFound('Producto no encontrado');

    const purchase = data.purchase_price ?? existing.purchase_price;
    const sale = data.sale_price ?? existing.sale_price;
    const updated = await repo.update(client, id, {
      ...data,
      margin_pct: calcMargin(purchase, sale),
    });
    if (!updated) throw errors.notFound('Producto no encontrado');
    return repo.findById(client, id);
  });
}

/** Soft delete: is_active = false. Nunca se elimina físicamente. */
export async function deactivateProduct(id) {
  return withTransaction(async (client) => {
    const existing = await repo.findById(client, id);
    if (!existing) throw errors.notFound('Producto no encontrado');
    if (!existing.is_active) throw errors.badRequest('El producto ya está desactivado');
    return repo.deactivate(client, id);
  });
}
