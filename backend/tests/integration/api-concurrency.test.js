import { describe, it, expect } from 'vitest';
import { api, setupIntegration, auth, TOKEN_ADMIN, createProduct } from './helpers.js';

setupIntegration();

/**
 * Verifica las garantías de concurrencia de la arquitectura:
 * - SELECT ... FOR UPDATE evita pérdida de stock con escritores paralelos.
 * - quotation_sequences (bloqueo por año) genera números únicos y consecutivos
 *   incluso con 10 creaciones simultáneas.
 */
describe('Concurrencia', () => {
  it('dos movimientos paralelos no pierden stock (FOR UPDATE)', async () => {
    const { res } = await createProduct();
    const productId = res.body.data.id;

    const results = await Promise.all([
      api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
        .send({ product_id: productId, movement_type: 'PURCHASE', quantity: 10 }),
      api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
        .send({ product_id: productId, movement_type: 'PURCHASE', quantity: 5 }),
    ]);

    expect(results.every((r) => r.status === 201)).toBe(true);

    const list = await api().get('/api/v1/inventory').set(auth(TOKEN_ADMIN));
    const p = list.body.data.find((x) => x.id === productId);
    expect(p.stock).toBe(15); // 10 + 5, sin carreras

    // historial íntegro: dos movimientos
    const hist = await api().get(`/api/v1/inventory/products/${productId}/movements`).set(auth(TOKEN_ADMIN));
    expect(hist.body.data.length).toBe(2);
  });

  it('salidas paralelas respetan el límite de stock (sin negativos)', async () => {
    const { res } = await createProduct();
    const productId = res.body.data.id;
    await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'PURCHASE', quantity: 10 });

    // 3 salidas de 4 en paralelo: solo 2 pueden completarse (10 = 4+4+2)
    const results = await Promise.all([
      api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
        .send({ product_id: productId, movement_type: 'ADJUSTMENT_OUT', quantity: 4 }),
      api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
        .send({ product_id: productId, movement_type: 'ADJUSTMENT_OUT', quantity: 4 }),
      api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
        .send({ product_id: productId, movement_type: 'ADJUSTMENT_OUT', quantity: 4 }),
    ]);

    const ok = results.filter((r) => r.status === 201).length;
    const blocked = results.filter((r) => r.status === 409 && r.body.error.code === 'STOCK_INSUFFICIENT').length;
    expect(ok).toBe(2);
    expect(blocked).toBe(1);

    const list = await api().get('/api/v1/inventory').set(auth(TOKEN_ADMIN));
    const p = list.body.data.find((x) => x.id === productId);
    expect(p.stock).toBe(2); // nunca negativo
  });

  it('numeración atómica: 10 cotizaciones paralelas → 10 números únicos consecutivos', async () => {
    const p = await createProduct();

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
          .send({ items: [{ product_id: p.res.body.data.id, quantity: 1 }] })
      )
    );

    expect(results.every((r) => r.status === 201)).toBe(true);
    const numbers = results.map((r) => r.body.data.number);
    expect(new Set(numbers).size).toBe(10); // sin duplicados

    const seq = numbers
      .map((n) => parseInt(n.split('-').pop(), 10))
      .sort((a, b) => a - b);
    for (let i = 0; i < seq.length - 1; i += 1) {
      expect(seq[i + 1]).toBe(seq[i] + 1); // consecutivos, sin huecos
    }
  });
});
