import { errors } from '../lib/errors.js';
import { withTransaction } from '../db/transactions.js';
import { pool } from '../db/pool.js';
import * as repo from '../repositories/quotations.repo.js';

/** Transiciones de estado permitidas. VENCIDA y CONVERTIDA_A_VENTA son del sistema. */
export const TRANSITIONS = {
  BORRADOR: ['ENVIADA'],
  ENVIADA: ['ACEPTADA', 'RECHAZADA'],
  ACEPTADA: [],
  RECHAZADA: [],
  VENCIDA: [],
  CONVERTIDA_A_VENTA: [],
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Lee la cotización + ítems usando el db indicado (pool o cliente transaccional). */
async function readQuotation(db, id) {
  await repo.expireExpired(db);
  const quotation = await repo.findById(db, id);
  if (!quotation) throw errors.notFound('Cotización no encontrada');
  const items = await repo.findItems(db, id);
  return { ...quotation, items };
}

export async function listQuotations(filters) {
  // Materialización perezosa de vencidas antes de listar
  await repo.expireExpired(pool);
  return repo.findMany(pool, filters);
}

export async function getQuotation(id) {
  return readQuotation(pool, id);
}

/**
 * Crear una cotización NO modifica stock.
 * Numeración atómica por año (quotation_sequences + FOR UPDATE) y snapshots de precios.
 */
export async function createQuotation({ customerId, validUntil, observations, items, createdBy }) {
  return withTransaction(async (client) => {
    const year = new Date().getFullYear();
    const number = await repo.nextSequenceNumber(client, year);

    let customerName = null;
    if (customerId) {
      const { rows } = await client.query('SELECT name FROM public.customers WHERE id = $1', [customerId]);
      if (rows.length === 0) throw errors.notFound('Cliente no encontrado');
      customerName = rows[0].name;
    }

    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { rows: products } = await client.query(
      `SELECT id, name, sku, sale_price FROM public.products WHERE id = ANY($1)`,
      [productIds]
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    const detail = items.map((item) => {
      const product = byId.get(item.product_id);
      if (!product) throw errors.notFound(`Producto no encontrado: ${item.product_id}`);
      const subtotal = item.quantity * product.sale_price;
      return {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit_price: product.sale_price,
        subtotal,
      };
    });

    const subtotal = detail.reduce((sum, i) => sum + i.subtotal, 0);

    const quotation = await repo.createQuotation(client, {
      number,
      customerId,
      customerName,
      issueDate: today(),
      validUntil,
      observations,
      subtotal,
      total: subtotal,
      createdBy,
    });

    for (const item of detail) {
      await repo.createItem(client, {
        quotationId: quotation.id,
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      });
    }

    return { ...quotation, items: detail };
  });
}

/** Edición solo en BORRADOR. Re-snapshot de precios actuales. */
export async function updateQuotation(id, { customerId, validUntil, observations, items }) {
  return withTransaction(async (client) => {
    const existing = await repo.lockById(client, id);
    if (!existing) throw errors.notFound('Cotización no encontrada');
    if (existing.status !== 'BORRADOR') {
      throw errors.conflict('INVALID_STATUS', 'Solo se puede editar una cotización en BORRADOR');
    }

    let customerName = existing.customer_name;
    if (customerId !== undefined) {
      customerName = null;
      if (customerId) {
        const { rows } = await client.query('SELECT name FROM public.customers WHERE id = $1', [customerId]);
        if (rows.length === 0) throw errors.notFound('Cliente no encontrado');
        customerName = rows[0].name;
      }
    }

    let detail = null;
    if (items !== undefined) {
      const productIds = [...new Set(items.map((i) => i.product_id))];
      const { rows: products } = await client.query(
        `SELECT id, name, sku, sale_price FROM public.products WHERE id = ANY($1)`,
        [productIds]
      );
      const byId = new Map(products.map((p) => [p.id, p]));
      detail = items.map((item) => {
        const product = byId.get(item.product_id);
        if (!product) throw errors.notFound(`Producto no encontrado: ${item.product_id}`);
        const subtotal = item.quantity * product.sale_price;
        return {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unit_price: product.sale_price,
          subtotal,
        };
      });
    }

    const subtotal =
      detail !== null
        ? detail.reduce((sum, i) => sum + i.subtotal, 0)
        : existing.subtotal;

    await repo.updateHeader(client, id, {
      customerId: customerId === undefined ? existing.customer_id : customerId,
      customerName,
      validUntil: validUntil === undefined ? existing.valid_until : validUntil,
      observations: observations === undefined ? existing.observations : observations,
      subtotal,
      total: subtotal,
    });

    if (detail !== null) {
      await repo.deleteItems(client, id);
      for (const item of detail) {
        await repo.createItem(client, {
          quotationId: id,
          productId: item.product_id,
          productName: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          subtotal: item.subtotal,
        });
      }
    }

    // Lectura DENTRO de la transacción: ve los cambios aún no commiteados
    return readQuotation(client, id);
  });
}

export async function changeStatus(id, status, _userId) {
  if (status === 'CONVERTIDA_A_VENTA') {
    throw errors.conflict(
      'SALES_UNAVAILABLE',
      'La conversión a venta requiere el módulo de ventas (fase futura)'
    );
  }
  return withTransaction(async (client) => {
    const existing = await repo.lockById(client, id);
    if (!existing) throw errors.notFound('Cotización no encontrada');
    if (!TRANSITIONS[existing.status]?.includes(status)) {
      throw errors.conflict(
        'INVALID_TRANSITION',
        `Transición no permitida: ${existing.status} → ${status}`
      );
    }
    return repo.updateStatus(client, id, status);
  });
}

/** Eliminación física SOLO de borradores (nunca se publicaron; no hay valor histórico). */
export async function deleteQuotation(id) {
  return withTransaction(async (client) => {
    const existing = await repo.lockById(client, id);
    if (!existing) throw errors.notFound('Cotización no encontrada');
    if (existing.status !== 'BORRADOR') {
      throw errors.conflict(
        'INVALID_STATUS',
        'Solo se pueden eliminar cotizaciones en BORRADOR'
      );
    }
    return repo.deleteQuotation(client, id);
  });
}
