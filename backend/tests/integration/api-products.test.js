import { describe, it, expect } from 'vitest';
import {
  api,
  setupIntegration,
  auth,
  TOKEN_ADMIN,
  createBaseCatalog,
  createProduct,
} from './helpers.js';

setupIntegration();

describe('Catálogos (categorías, marcas, unidades, proveedores)', () => {
  it('crea y lista categorías', async () => {
    const created = await api().post('/api/v1/categories').set(auth(TOKEN_ADMIN)).send({ name: `Cat ${Date.now()}` });
    expect(created.status).toBe(201);
    expect(created.body.data.name).toBeTruthy();

    const list = await api().get('/api/v1/categories').set(auth(TOKEN_ADMIN));
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it('rechaza nombres duplicados (409 DUPLICATE)', async () => {
    const name = `Dupe ${Date.now()}`;
    await api().post('/api/v1/categories').set(auth(TOKEN_ADMIN)).send({ name });
    const res = await api().post('/api/v1/categories').set(auth(TOKEN_ADMIN)).send({ name });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
  });

  it('actualiza un registro de catálogo', async () => {
    const created = await api().post('/api/v1/units').set(auth(TOKEN_ADMIN))
      .send({ name: `Unidad ${Date.now()}`, abbreviation: 'un' });
    const id = created.body.data.id;

    const up = await api().put(`/api/v1/units/${id}`).set(auth(TOKEN_ADMIN))
      .send({ abbreviation: 'u' });
    expect(up.status).toBe(200);
    expect(up.body.data.abbreviation).toBe('u');
    expect(up.body.data.name).toBe(created.body.data.name);
  });

  it('404 para catálogo inexistente', async () => {
    const res = await api()
      .put('/api/v1/units/00000000-0000-0000-0000-00000000dead')
      .set(auth(TOKEN_ADMIN))
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('desactiva en lugar de eliminar (soft delete)', async () => {
    const created = await api().post('/api/v1/brands').set(auth(TOKEN_ADMIN)).send({ name: `Marca ${Date.now()}` });
    const id = created.body.data.id;
    const del = await api().delete(`/api/v1/brands/${id}`).set(auth(TOKEN_ADMIN));
    expect(del.status).toBe(200);
    expect(del.body.data.is_active).toBe(false);

    const get = await api().get(`/api/v1/brands/${id}`).set(auth(TOKEN_ADMIN));
    expect(get.status).toBe(200); // sigue existiendo
  });

  it('valida los campos de entrada (400)', async () => {
    const res = await api().post('/api/v1/suppliers').set(auth(TOKEN_ADMIN)).send({ name: '' });
    expect(res.status).toBe(400);
  });
});

describe('Productos', () => {
  it('crea un producto con margen calculado', async () => {
    const { res, base } = await createProduct({ purchase_price: 800, sale_price: 1000 });
    expect(res.status).toBe(201);
    expect(res.body.data.margin_pct).toBe(25);
    expect(res.body.data.stock).toBe(0);
    expect(res.body.data.category_name).toBeTruthy();
    expect(res.body.data.unit_abbreviation).toBeTruthy();
    expect(base.categoryId).toBeTruthy();
  });

  it('lista productos con búsqueda por SKU', async () => {
    const { res } = await createProduct();
    const sku = res.body.data.sku;
    const list = await api().get(`/api/v1/products?q=${sku}`).set(auth(TOKEN_ADMIN));
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBe(1);
    expect(list.body.data[0].sku).toBe(sku);
  });

  it('recalcula el margen al actualizar precios', async () => {
    const { res } = await createProduct({ purchase_price: 1000, sale_price: 1100 });
    const id = res.body.data.id;
    const up = await api()
      .put(`/api/v1/products/${id}`)
      .set(auth(TOKEN_ADMIN))
      .send({ sale_price: 1500 });
    expect(up.status).toBe(200);
    expect(up.body.data.margin_pct).toBe(50);
  });

  it('rechaza SKU duplicado (409)', async () => {
    const { res } = await createProduct();
    const sku = res.body.data.sku;
    const dup = await api()
      .post('/api/v1/products')
      .set(auth(TOKEN_ADMIN))
      .send({
        sku,
        name: 'Otro producto',
        category_id: res.body.data.category_id,
        unit_id: res.body.data.unit_id,
      });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('DUPLICATE');
  });

  it('soft delete: desactiva pero no elimina físicamente', async () => {
    const { res } = await createProduct();
    const id = res.body.data.id;
    const del = await api().delete(`/api/v1/products/${id}`).set(auth(TOKEN_ADMIN));
    expect(del.status).toBe(200);
    expect(del.body.data.is_active).toBe(false);

    const get = await api().get(`/api/v1/products/${id}`).set(auth(TOKEN_ADMIN));
    expect(get.status).toBe(200);
    expect(get.body.data.is_active).toBe(false);
  });

  it('no permite desactivar dos veces (400)', async () => {
    const { res } = await createProduct();
    const id = res.body.data.id;
    await api().delete(`/api/v1/products/${id}`).set(auth(TOKEN_ADMIN));
    const again = await api().delete(`/api/v1/products/${id}`).set(auth(TOKEN_ADMIN));
    expect(again.status).toBe(400);
  });

  it('valida datos inválidos (400)', async () => {
    const res = await api().post('/api/v1/products').set(auth(TOKEN_ADMIN)).send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('404 para producto inexistente', async () => {
    const res = await api()
      .get('/api/v1/products/00000000-0000-0000-0000-00000000dead')
      .set(auth(TOKEN_ADMIN));
    expect(res.status).toBe(404);
  });
});

