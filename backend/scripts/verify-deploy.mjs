/**
 * Verifica un despliegue real (Render + Vercel) de punta a punta.
 *
 * Uso:
 *   DEPLOY_API_URL=https://<api>.onrender.com/api/v1 \
 *   DEPLOY_WEB_URL=https://<app>.vercel.app \
 *   ADMIN_EMAIL=admin@peumayen.cl \
 *   ADMIN_PASSWORD=<clave> \
 *   node scripts/verify-deploy.mjs
 *
 * Checks: health, SPA, login real, /me, flujo completo (producto → movimiento →
 * cotización → PDF), CORS desde el origen web y presign de Storage.
 * La cotización de prueba se elimina; el producto/categoría de verificación
 * quedan desactivables (o se limpian por SQL con prefijo DEP-).
 */
import 'dotenv/config';

const API = process.env.DEPLOY_API_URL;
const WEB = process.env.DEPLOY_WEB_URL;
const EMAIL = process.env.ADMIN_EMAIL || 'admin@peumayen.cl';
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!API || !WEB || !PASSWORD) {
  console.error('Faltan DEPLOY_API_URL / DEPLOY_WEB_URL / ADMIN_PASSWORD');
  process.exit(1);
}

const checks = [];
const j = async (r) => ({ status: r.status, body: await r.json().catch(() => null) });
const add = (name, pass, extra = '') => {
  checks.push({ name, pass });
  console.log(`${pass ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`);
};

// 1. Healthcheck (sin auth)
try {
  const h = await j(await fetch(`${API}/health`, { signal: AbortSignal.timeout(15000) }));
  add('health 200', h.status === 200, h.body?.data?.status ?? h.status);
} catch (e) {
  add('health 200', false, e.message);
}

// 2. SPA: la web carga el título
try {
  const w = await fetch(WEB, { signal: AbortSignal.timeout(15000) });
  const html = await w.text();
  add('SPA sirve index.html', w.status === 200 && html.includes('Almacén Peumayen'));
} catch (e) {
  add('SPA sirve index.html', false, e.message);
}

// 3. Login real (Supabase)
let token = null;
try {
  const login = await j(
    await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      signal: AbortSignal.timeout(15000),
    })
  );
  token = login.body?.data?.access_token;
  add('login 200 + token', login.status === 200 && !!token);
} catch (e) {
  add('login 200 + token', false, e.message);
}

if (token) {
  const auth = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  try {
    const me = await j(await fetch(`${API}/auth/me`, { headers: auth, signal: AbortSignal.timeout(15000) }));
    add('me rol ADMIN', me.status === 200 && me.body.data.role === 'ADMIN', me.body?.data?.role ?? me.status);
  } catch (e) {
    add('me rol ADMIN', false, e.message);
  }

  // 4. Flujo completo con limpieza de la cotización
  try {
    const units = await j(await fetch(`${API}/units?per_page=100`, { headers: auth, signal: AbortSignal.timeout(15000) }));
    const unitId = units.body.data.find((u) => u.abbreviation === 'un').id;
    const ts = Date.now();

    const cat = await j(
      await fetch(`${API}/categories`, { method: 'POST', headers: auth, body: JSON.stringify({ name: `DEPLOY Verif ${ts}` }), signal: AbortSignal.timeout(15000) })
    );
    const prod = await j(
      await fetch(`${API}/products`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ sku: `DEP-${ts}`, name: 'Verificación deploy', category_id: cat.body.data.id, unit_id: unitId, purchase_price: 1000, sale_price: 1500 }),
        signal: AbortSignal.timeout(15000),
      })
    );
    const mv = await j(
      await fetch(`${API}/inventory/movements`, { method: 'POST', headers: auth, body: JSON.stringify({ product_id: prod.body.data.id, movement_type: 'PURCHASE', quantity: 5 }), signal: AbortSignal.timeout(15000) })
    );
    add('producto + stock 5', mv.status === 201 && mv.body.data.stock === 5);

    const quo = await j(
      await fetch(`${API}/quotations`, { method: 'POST', headers: auth, body: JSON.stringify({ items: [{ product_id: prod.body.data.id, quantity: 2 }] }), signal: AbortSignal.timeout(15000) })
    );
    add('cotización COT-YYYY-NNNN', quo.status === 201 && /^COT-\d{4}-\d{4}$/.test(quo.body.data.number), quo.body?.data?.number ?? quo.status);

    const pdf = await fetch(`${API}/quotations/${quo.body.data.id}/pdf`, { headers: auth, signal: AbortSignal.timeout(20000) });
    const pdfBuf = Buffer.from(await pdf.arrayBuffer());
    add('PDF %PDF-', pdf.status === 200 && (pdf.headers.get('content-type') || '').includes('pdf') && pdfBuf.subarray(0, 5).toString() === '%PDF-');

    // limpieza: eliminar la cotización borrador
    await fetch(`${API}/quotations/${quo.body.data.id}`, { method: 'DELETE', headers: auth, signal: AbortSignal.timeout(15000) });
  } catch (e) {
    add('flujo completo', false, e.message);
  }

  // 5. CORS desde el origen web
  try {
    const pre = await fetch(`${API}/health`, {
      method: 'OPTIONS',
      headers: { Origin: WEB, 'Access-Control-Request-Method': 'GET' },
      signal: AbortSignal.timeout(15000),
    });
    add('CORS origen web', (pre.headers.get('access-control-allow-origin') || '') === WEB);
  } catch (e) {
    add('CORS origen web', false, e.message);
  }

  // 6. Storage: presign del logo (solo ADMIN)
  try {
    const pre2 = await j(await fetch(`${API}/storage/logo/presign`, { method: 'POST', headers: auth, signal: AbortSignal.timeout(15000) }));
    add('presign logo (Storage)', pre2.status === 200 && !!pre2.body?.data?.signedUrl);
  } catch (e) {
    add('presign logo (Storage)', false, e.message);
  }
}

const ok = checks.filter((c) => c.pass).length;
console.log(`\n${ok}/${checks.length} verificaciones OK`);
process.exit(ok === checks.length ? 0 : 1);
