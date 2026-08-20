import { errors } from '../lib/errors.js';
import { withTransaction } from '../db/transactions.js';
import { pool } from '../db/pool.js';
import * as repo from '../repositories/inventory.repo.js';

/**
 * Efecto de cada tipo de movimiento sobre products.stock.
 * quantity SIEMPRE se almacena positiva; el signo se aplica aquí (backend).
 */
export const MOVEMENT_EFFECT = {
  PURCHASE: 1,
  RETURN: 1,
  SALE: -1,
  ADJUSTMENT_IN: 1,
  ADJUSTMENT_OUT: -1,
};

/** Tipos permitidos en el MVP (SALE queda reservado para el futuro módulo de ventas). */
export const MVP_MOVEMENT_TYPES = ['PURCHASE', 'RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'];

export async function registerMovement({ productId, movementType, quantity, unitPrice = 0, notes = null, referenceType = null, referenceId = null, createdBy = null }) {
  if (!MVP_MOVEMENT_TYPES.includes(movementType)) {
    throw errors.conflict(
      'SALE_UNAVAILABLE',
      `El tipo "${movementType}" no está disponible en el MVP (requiere el módulo de ventas)`
    );
  }

  return withTransaction(async (client) => {
    const product = await repo.lockProduct(client, productId);
    if (!product) throw errors.notFound('Producto no encontrado');

    const effect = MOVEMENT_EFFECT[movementType] * quantity;
    const newStock = product.stock + effect;
    if (newStock < 0) {
      throw errors.conflict(
        'STOCK_INSUFFICIENT',
        `Stock insuficiente (disponible: ${product.stock}, requerido: ${quantity})`
      );
    }

    const movement = await repo.insertMovement(client, {
      productId,
      type: movementType,
      quantity,
      unitPrice,
      notes,
      referenceType,
      referenceId,
      createdBy,
    });
    const stock = await repo.addStock(client, productId, effect);

    return { movement, stock };
  });
}

/**
 * Ajuste a un stock objetivo: genera ADJUSTMENT_IN o ADJUSTMENT_OUT según la diferencia.
 * No permite stock negativo.
 */
export async function adjustStock({ productId, newStock, notes = null, createdBy = null }) {
  return withTransaction(async (client) => {
    const product = await repo.lockProduct(client, productId);
    if (!product) throw errors.notFound('Producto no encontrado');

    const diff = newStock - product.stock;
    if (diff === 0) throw errors.badRequest('El stock ya es igual al valor indicado');

    const type = diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    const movement = await repo.insertMovement(client, {
      productId,
      type,
      quantity: Math.abs(diff),
      unitPrice: 0,
      notes: notes ?? `Ajuste de stock a ${newStock}`,
      createdBy,
    });
    const stock = await repo.addStock(client, productId, diff);

    return { movement, stock };
  });
}

export async function listStock(filters) {
  return repo.findStockList(pool, filters);
}

export async function listMovements(productId, filters) {
  const product = await pool.query('SELECT id FROM public.products WHERE id = $1', [productId]);
  if (product.rowCount === 0) throw errors.notFound('Producto no encontrado');
  return repo.findMovementsByProduct(pool, productId, filters);
}
