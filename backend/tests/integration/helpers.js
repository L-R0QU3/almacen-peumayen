/**
 * Helpers para tests de integración de la API.
 * - Mock de Supabase Auth (getUser) para autenticar tokens de prueba.
 * - Seeds de usuarios de prueba (ADMIN con permisos, NOBODY sin permisos).
 * - Fábrica de la app Express para Supertest.
 */
import { beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';

export const TEST_ADMIN_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_NOBODY_ID = '00000000-0000-0000-0000-000000000002';
export const TOKEN_ADMIN = 'test-token-admin';
export const TOKEN_NOBODY = 'test-token-nobody';
export const TOKEN_INVALID = 'test-token-invalid';

// Mock del módulo Supabase: el backend nunca contacta la red en tests.
vi.mock('../../src/lib/supabase.js', () => {
  const tokenToUser = new Map();
  return {
    supabase: {
      auth: {
        getUser: vi.fn(async (token) => {
          const userId = tokenToUser.get(token);
          if (!userId) {
            return { data: { user: null }, error: { message: 'Token inválido' } };
          }
          return { data: { user: { id: userId, email: 'test@peumayen.cl' } }, error: null };
        }),
        signInWithPassword: vi.fn(async () => ({
          data: {
            user: { id: '00000000-0000-0000-0000-000000000001' },
            session: {
              access_token: 'jwt-test',
              refresh_token: 'refresh-test',
              expires_in: 3600,
            },
          },
          error: null,
        })),
      },
    },
    supabaseAdmin: {
      auth: {
        admin: {
          signOut: vi.fn(async () => ({ error: null })),
          createUser: vi.fn(async () => ({ data: { id: '00000000-0000-0000-0000-000000000001' }, error: null })),
        },
      },
    },
    __setTokenUser: (token, userId) => tokenToUser.set(token, userId),
  };
});

import { __setTokenUser } from '../../src/lib/supabase.js';

export function api() {
  return request(createApp());
}

/** Registra los tokens de prueba (por archivo de test: aislamiento por worker). */
export function registerTestTokens() {
  __setTokenUser(TOKEN_ADMIN, TEST_ADMIN_ID);
  __setTokenUser(TOKEN_NOBODY, TEST_NOBODY_ID);
}

/** Inserta (idempotente) los usuarios de prueba con sus roles. */
export async function seedTestUsers() {
  await pool.query(
    `INSERT INTO public.users (id, email, name, role_id, is_active)
     SELECT $1, 'admin@test.cl', 'Admin Test', r.id, true
     FROM public.roles r WHERE r.code = 'ADMIN'
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, is_active = true`,
    [TEST_ADMIN_ID]
  );
  await pool.query(
    `INSERT INTO public.users (id, email, name, role_id, is_active)
     SELECT $1, 'nobody@test.cl', 'Sin Permisos', r.id, true
     FROM public.roles r WHERE r.code = 'MANAGER'
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, is_active = true`,
    [TEST_NOBODY_ID]
  );
}

/** beforeAll global de integración: usuarios + tokens. */
export function setupIntegration() {
  beforeAll(async () => {
    registerTestTokens();
    await seedTestUsers();
  });
  afterAll(async () => {
    await pool.end();
  });
}

export function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

/** Crea entidades base (categoría, unidad, marca) y devuelve sus ids. */
export async function createBaseCatalog(prefix = 'T') {
  const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const cat = await api().post('/api/v1/categories').set(auth(TOKEN_ADMIN)).send({ name: `${prefix} Categoría ${uniq}` });
  const unit = await api().post('/api/v1/units').set(auth(TOKEN_ADMIN)).send({ name: `Unidad ${uniq}`, abbreviation: 'un' });
  const brand = await api().post('/api/v1/brands').set(auth(TOKEN_ADMIN)).send({ name: `Marca ${uniq}` });
  return {
    categoryId: cat.body.data.id,
    unitId: unit.body.data.id,
    brandId: brand.body.data.id,
  };
}

/** Crea un producto y devuelve el body de la respuesta. */
export async function createProduct(overrides = {}) {
  const base = await createBaseCatalog('P');
  const res = await api()
    .post('/api/v1/products')
    .set(auth(TOKEN_ADMIN))
    .send({
      sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `Producto Test ${Date.now()}`,
      category_id: base.categoryId,
      unit_id: base.unitId,
      brand_id: base.brandId,
      purchase_price: 800,
      sale_price: 1000,
      min_stock: 5,
      ...overrides,
    });
  return { res, base };
}
