import { describe, it, expect } from 'vitest';
import { api, setupIntegration, auth, TOKEN_ADMIN, createProduct } from './helpers.js';
import { pool } from '../../src/db/pool.js';

setupIntegration();

async function createCustomer(name) {
  const res = await api().post('/api/v1/customers').set(auth(TOKEN_ADMIN)).send({ name });
  expect(res.status).toBe(201);
  return res.body.data;
}

function quotePayload(items, extra = {}) {
  return { items, ...extra };
}

describe('Cotizaciones', () => {
  it('crea una cotización con numeración atómica COT-YYYY-0001 y snapshots', async () => {
    const a = await createProduct({ sale_price: 1000 });
    const b = await createProduct({ sale_price: 2000 });

    const res = await api()
      .post('/api/v1/quotations')
      .set(auth(TOKEN_ADMIN))
      .send(
        quotePayload([
          { product_id: a.res.body.data.id, quantity: 2 },
          { product_id: b.res.body.data.id, quantity: 1 },
        ])
      );

    expect(res.status).toBe(201);
    // Formato COT-YYYY-NNNN (la secuencia la garantiza quotation_sequences; el número
    // absoluto depende del orden de ejecución de la suite)
    expect(res.body.data.number).toMatch(/^COT-\d{4}-\d{4}$/);
    expect(res.body.data.status).toBe('BORRADOR');
    expect(res.body.data.subtotal).toBe(4000);
    expect(res.body.data.total).toBe(4000);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items[0].product_name).toBe(a.res.body.data.name);
    expect(res.body.data.items[0].sku).toBe(a.res.body.data.sku);
    expect(res.body.data.items[0].unit_price).toBe(1000);
  });

  it('incrementa la secuencia por año (0002, 0003…)', async () => {
    const p = await createProduct();
    const mk = () =>
      api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
        .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 1 }]));

    const q1 = await mk();
    const q2 = await mk();
    const q3 = await mk();
    const seq = (number) => parseInt(number.split('-').pop(), 10);
    expect(q1.status).toBe(201);
    expect(seq(q2.body.data.number)).toBe(seq(q1.body.data.number) + 1);
    expect(seq(q3.body.data.number)).toBe(seq(q2.body.data.number) + 1);
    // Formato COT-YYYY-NNNN
    expect(q3.body.data.number).toMatch(/^COT-\d{4}-\d{4}$/);
  });

  it('acepta cliente opcional y guarda snapshot del nombre', async () => {
    const p = await createProduct();
    const customer = await createCustomer('Cliente Snapshot');
    const res = await api()
      .post('/api/v1/quotations')
      .set(auth(TOKEN_ADMIN))
      .send(
        quotePayload([{ product_id: p.res.body.data.id, quantity: 1 }], {
          customer_id: customer.id,
        })
      );
    expect(res.status).toBe(201);
    expect(res.body.data.customer_name).toBe('Cliente Snapshot');
  });

  it('preserva precios históricos aunque el producto cambie después', async () => {
    const p = await createProduct({ sale_price: 1500 });
    const created = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 1 }]));
    const quotationId = created.body.data.id;

    // El producto sube de precio
    await api().put(`/api/v1/products/${p.res.body.data.id}`).set(auth(TOKEN_ADMIN))
      .send({ sale_price: 5000 });

    const detail = await api().get(`/api/v1/quotations/${quotationId}`).set(auth(TOKEN_ADMIN));
    expect(detail.body.data.items[0].unit_price).toBe(1500);
    expect(detail.body.data.total).toBe(1500);
  });

  it('solo permite editar en BORRADOR', async () => {
    const p = await createProduct();
    const created = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 1 }]));
    const id = created.body.data.id;

    const sent = await api().post(`/api/v1/quotations/${id}/status`).set(auth(TOKEN_ADMIN))
      .send({ status: 'ENVIADA' });
    expect(sent.status).toBe(200);
    expect(sent.body.data.status).toBe('ENVIADA');

    const edit = await api().put(`/api/v1/quotations/${id}`).set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 5 }]));
    expect(edit.status).toBe(409);
    expect(edit.body.error.code).toBe('INVALID_STATUS');
  });

  it('actualiza una cotización en BORRADOR: reemplaza ítems, recalcula totales y mantiene el número', async () => {
    const a = await createProduct({ sale_price: 1000 });
    const b = await createProduct({ sale_price: 2000 });
    const created = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: a.res.body.data.id, quantity: 2 }]));
    const id = created.body.data.id;
    expect(created.body.data.total).toBe(2000);
    expect(created.body.data.items).toHaveLength(1);

    const up = await api().put(`/api/v1/quotations/${id}`).set(auth(TOKEN_ADMIN)).send({
      items: [
        { product_id: a.res.body.data.id, quantity: 1 },
        { product_id: b.res.body.data.id, quantity: 1 },
      ],
      observations: 'Actualizada',
    });

    expect(up.status).toBe(200);
    expect(up.body.data.total).toBe(3000); // 1×1000 + 1×2000
    expect(up.body.data.items).toHaveLength(2);
    expect(up.body.data.observations).toBe('Actualizada');
    expect(up.body.data.number).toBe(created.body.data.number); // la numeración no cambia
  });

  it('valida transiciones de estado', async () => {
    const p = await createProduct();
    const created = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 1 }]));
    const id = created.body.data.id;

    // BORRADOR → ACEPTADA no permitido
    const skip = await api().post(`/api/v1/quotations/${id}/status`).set(auth(TOKEN_ADMIN))
      .send({ status: 'ACEPTADA' });
    expect(skip.status).toBe(409);
    expect(skip.body.error.code).toBe('INVALID_TRANSITION');

    // BORRADOR → ENVIADA → ACEPTADA ✓
    await api().post(`/api/v1/quotations/${id}/status`).set(auth(TOKEN_ADMIN)).send({ status: 'ENVIADA' });
    const accepted = await api().post(`/api/v1/quotations/${id}/status`).set(auth(TOKEN_ADMIN))
      .send({ status: 'ACEPTADA' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.status).toBe('ACEPTADA');
  });

  it('bloquea CONVERTIDA_A_VENTA sin módulo de ventas (409)', async () => {
    const p = await createProduct();
    const created = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 1 }]));
    const res = await api().post(`/api/v1/quotations/${created.body.data.id}/status`)
      .set(auth(TOKEN_ADMIN)).send({ status: 'CONVERTIDA_A_VENTA' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SALES_UNAVAILABLE');
  });

  it('marca VENCIDA de forma perezosa al listar', async () => {
    const p = await createProduct();
    const created = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 1 }]));
    const id = created.body.data.id;

    // Simular vigencia vencida directamente en BD (la API valida valid_until >= issue_date,
    // por lo que se retrocede issue_date junto con valid_until)
    await pool.query(
      `UPDATE public.quotations
       SET issue_date = current_date - 10, valid_until = current_date - 1
       WHERE id = $1`,
      [id]
    );

    const list = await api().get('/api/v1/quotations').set(auth(TOKEN_ADMIN));
    const q = list.body.data.find((x) => x.id === id);
    expect(q.status).toBe('VENCIDA');
  });

  it('solo permite eliminar cotizaciones en BORRADOR', async () => {
    const p = await createProduct();
    const created = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 1 }]));
    const id = created.body.data.id;

    const del = await api().delete(`/api/v1/quotations/${id}`).set(auth(TOKEN_ADMIN));
    expect(del.status).toBe(200);

    const get = await api().get(`/api/v1/quotations/${id}`).set(auth(TOKEN_ADMIN));
    expect(get.status).toBe(404);
  });

  it('rechaza cotización sin ítems (400) y con producto inexistente (404)', async () => {
    const noItems = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([]));
    expect(noItems.status).toBe(400);

    const badProduct = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: '00000000-0000-0000-0000-00000000dead', quantity: 1 }]));
    expect(badProduct.status).toBe(404);
  });

  it('exporta el PDF de la cotización (application/pdf)', async () => {
    const p = await createProduct({ sale_price: 1200 });
    const created = await api().post('/api/v1/quotations').set(auth(TOKEN_ADMIN))
      .send(quotePayload([{ product_id: p.res.body.data.id, quantity: 3 }]));
    const id = created.body.data.id;

    const pdf = await api()
      .get(`/api/v1/quotations/${id}/pdf`)
      .set(auth(TOKEN_ADMIN))
      .buffer(true)
      .parse((res, cb) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });

    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    expect(pdf.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.body.length).toBeGreaterThan(1000);
  });
});
