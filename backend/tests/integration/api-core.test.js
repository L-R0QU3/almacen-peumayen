import { describe, it, expect } from 'vitest';
import { api, setupIntegration, auth, TOKEN_ADMIN, TOKEN_NOBODY, TOKEN_INVALID, TEST_ADMIN_ID } from './helpers.js';

setupIntegration();

describe('Core de la API', () => {
  it('GET /health responde ok sin autenticación', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.error).toBeNull();
  });

  it('rechaza rutas protegidas sin token (401)', async () => {
    const res = await api().get('/api/v1/products');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rechaza tokens inválidos (401)', async () => {
    const res = await api().get('/api/v1/auth/me').set(auth(TOKEN_INVALID));
    expect(res.status).toBe(401);
  });

  it('rechaza usuarios sin permisos (403)', async () => {
    const res = await api().get('/api/v1/products').set(auth(TOKEN_NOBODY));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PERMISSION_DENIED');
  });

  it('GET /auth/me devuelve contexto con rol, permisos y módulos', async () => {
    const res = await api().get('/api/v1/auth/me').set(auth(TOKEN_ADMIN));
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('ADMIN');
    expect(res.body.data.permissions).toContain('products.create');
    expect(res.body.data.permissions).toContain('quotations.convert');
    expect(Array.isArray(res.body.data.modules)).toBe(true);
    expect(res.body.data.modules.some((m) => m.code === 'products' && m.is_active)).toBe(true);
  });

  it('POST /auth/logout revoca la sesión (200)', async () => {
    const res = await api().post('/api/v1/auth/logout').set(auth(TOKEN_ADMIN));
    expect(res.status).toBe(200);
    expect(res.body.data.loggedOut).toBe(true);
  });

  it('valida el body de login (400)', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: 'no-es-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /auth/login devuelve sesión + contexto (flujo Supabase)', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: 'admin@test.cl', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.data.access_token).toBe('jwt-test');
    expect(res.body.data.refresh_token).toBe('refresh-test');
    expect(res.body.data.user.id).toBe(TEST_ADMIN_ID);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.user.permissions).toContain('quotations.create');
  });

  it('POST /auth/login con credenciales inválidas → 401', async () => {
    const { supabase } = await import('../../src/lib/supabase.js');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });
    const res = await api().post('/api/v1/auth/login').send({ email: 'admin@test.cl', password: 'mal-clave' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Credenciales incorrectas');
  });
});

describe('Módulos activables', () => {
  it('lista los 11 módulos del catálogo', async () => {
    const res = await api().get('/api/v1/modules').set(auth(TOKEN_ADMIN));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(11);
  });

  it('no permite desactivar un módulo core (400)', async () => {
    const res = await api().put('/api/v1/modules/config').set(auth(TOKEN_ADMIN)).send({ is_active: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('no permite desactivar products si inventory/quotations dependen (409)', async () => {
    const res = await api().put('/api/v1/modules/products').set(auth(TOKEN_ADMIN)).send({ is_active: false });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('MODULE_DEPENDENCY');
  });

  it('permite activar un módulo futuro (sales)', async () => {
    const res = await api().put('/api/v1/modules/sales').set(auth(TOKEN_ADMIN)).send({ is_active: true });
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
    // restaurar para no afectar otros tests
    await api().put('/api/v1/modules/sales').set(auth(TOKEN_ADMIN)).send({ is_active: false });
  });
});

describe('Configuración', () => {
  it('GET /config devuelve la configuración por defecto', async () => {
    const res = await api().get('/api/v1/config').set(auth(TOKEN_ADMIN));
    expect(res.status).toBe(200);
    expect(res.body.data.business.name).toBe('Almacén Peumayen');
  });

  it('PUT /config actualiza y persiste', async () => {
    const put = await api()
      .put('/api/v1/config')
      .set(auth(TOKEN_ADMIN))
      .send({ business: { phone: '+56 9 1234 5678' } });
    expect(put.status).toBe(200);
    expect(put.body.data.business.phone).toBe('+56 9 1234 5678');

    const get = await api().get('/api/v1/config').set(auth(TOKEN_ADMIN));
    expect(get.body.data.business.phone).toBe('+56 9 1234 5678');
  });

  it('rechaza claves de configuración desconocidas (400)', async () => {
    const res = await api().put('/api/v1/config').set(auth(TOKEN_ADMIN)).send({ nope: { x: 1 } });
    expect(res.status).toBe(400);
  });
});
