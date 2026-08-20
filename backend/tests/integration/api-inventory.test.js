import { describe, it, expect } from 'vitest';
import { api, setupIntegration, auth, TOKEN_ADMIN, createProduct } from './helpers.js';

setupIntegration();

describe('Inventario transaccional', () => {
  it('PURCHASE suma stock y registra movimiento', async () => {
    const { res } = await createProduct();
    const productId = res.body.data.id;

    const mv = await api()
      .post('/api/v1/inventory/movements')
      .set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'PURCHASE', quantity: 10 });
    expect(mv.status).toBe(201);
    expect(mv.body.data.stock).toBe(10);
    expect(mv.body.data.movement.quantity).toBe(10);
    expect(mv.body.data.movement.movement_type).toBe('PURCHASE');
  });

  it('ADJUSTMENT_OUT resta stock', async () => {
    const { res } = await createProduct();
    const productId = res.body.data.id;
    await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'PURCHASE', quantity: 10 });

    const out = await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'ADJUSTMENT_OUT', quantity: 3 });
    expect(out.status).toBe(201);
    expect(out.body.data.stock).toBe(7);
  });

  it('bloquea stock insuficiente (409 STOCK_INSUFFICIENT) sin tocar el stock', async () => {
    const { res } = await createProduct();
    const productId = res.body.data.id;

    const fail = await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'ADJUSTMENT_OUT', quantity: 99 });
    expect(fail.status).toBe(409);
    expect(fail.body.error.code).toBe('STOCK_INSUFFICIENT');

    const list = await api().get('/api/v1/inventory').set(auth(TOKEN_ADMIN));
    const p = list.body.data.find((x) => x.id === productId);
    expect(p.stock).toBe(0); // la transacción hizo ROLLBACK
  });

  it('rechaza cantidades no positivas (400)', async () => {
    const { res } = await createProduct();
    const bad = await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: res.body.data.id, movement_type: 'PURCHASE', quantity: -3 });
    expect(bad.status).toBe(400);
  });

  it('bloquea SALE en el MVP (400 por esquema)', async () => {
    const { res } = await createProduct();
    const bad = await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: res.body.data.id, movement_type: 'SALE', quantity: 1 });
    expect(bad.status).toBe(400);
  });

  it('ajusta a un stock objetivo generando el movimiento correcto', async () => {
    const { res } = await createProduct();
    const productId = res.body.data.id;
    await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'PURCHASE', quantity: 10 });

    const adj = await api().post('/api/v1/inventory/adjust').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, new_stock: 15 });
    expect(adj.status).toBe(201);
    expect(adj.body.data.stock).toBe(15);
    expect(adj.body.data.movement.movement_type).toBe('ADJUSTMENT_IN');
    expect(adj.body.data.movement.quantity).toBe(5);
  });

  it('no permite ajustar a stock negativo (400)', async () => {
    const { res } = await createProduct();
    const bad = await api().post('/api/v1/inventory/adjust').set(auth(TOKEN_ADMIN))
      .send({ product_id: res.body.data.id, new_stock: -1 });
    expect(bad.status).toBe(400);
  });

  it('historial con trazabilidad (creado por el usuario autenticado)', async () => {
    const { res } = await createProduct();
    const productId = res.body.data.id;
    await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'PURCHASE', quantity: 4 });
    await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'RETURN', quantity: 2 });

    const hist = await api().get(`/api/v1/inventory/products/${productId}/movements`).set(auth(TOKEN_ADMIN));
    expect(hist.status).toBe(200);
    expect(hist.body.data.length).toBe(2);
    expect(hist.body.data[0].created_by_name).toBe('Admin Test');
  });

  it('lista stock con alertas (is_low)', async () => {
    const { res } = await createProduct({ min_stock: 5 });
    const productId = res.body.data.id;
    await api().post('/api/v1/inventory/movements').set(auth(TOKEN_ADMIN))
      .send({ product_id: productId, movement_type: 'PURCHASE', quantity: 2 });

    const alerts = await api().get('/api/v1/inventory?only_alerts=true').set(auth(TOKEN_ADMIN));
    expect(alerts.status).toBe(200);
    const p = alerts.body.data.find((x) => x.id === productId);
    expect(p.is_low).toBe(true);
  });
});

