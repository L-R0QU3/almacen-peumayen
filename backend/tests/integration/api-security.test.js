import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { api, setupIntegration, auth, TOKEN_ADMIN } from './helpers.js';

setupIntegration();

describe('Seguridad de la API', () => {
  it('envía cabeceras de seguridad (helmet)', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-download-options']).toBe('noopen');
  });

  it('no expone x-powered-by', async () => {
    const res = await api().get('/api/v1/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('CORS: permite solo el origen configurado', async () => {
    const allowed = await api().get('/api/v1/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const denied = await api().get('/api/v1/health').set('Origin', 'https://evil.example.com');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rechaza payloads mayores a 100kb (413)', async () => {
    const big = { name: 'x'.repeat(200_000) };
    const res = await api().post('/api/v1/products').set(auth(TOKEN_ADMIN)).send(big);
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rechaza JSON mal formado (400)', async () => {
    const res = await api()
      .post('/api/v1/products')
      .set(auth(TOKEN_ADMIN))
      .set('Content-Type', 'application/json')
      .send('{"no es json"');
    expect(res.status).toBe(400);
  });

  it('aplica rate limit en /auth/login (429 tras 10 intentos)', async () => {
    const app = createApp();
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'x@x.cl', password: '123456' });
    }
    expect(last.status).toBe(429);
    expect(last.body.error.code).toBe('RATE_LIMITED');
  });
});
