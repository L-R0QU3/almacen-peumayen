import { test, expect } from '@playwright/test';

/**
 * Flujo de negocio completo por la UI contra el entorno real (Supabase).
 * - Setup por API: categoría + producto + movimiento de stock.
 * - UI: login real → Cotizaciones → crear cotización con el producto.
 * - Verificación: aparece el número COT-YYYY-NNNN.
 * - Teardown por API: elimina la cotización borrador (los productos/categoría
 *   de prueba se limpian por SQL con prefijos E2E- tras la corrida).
 */
const API = process.env.E2E_API_URL || 'http://localhost:4000/api/v1';

test('flujo completo: cotización creada desde la UI con producto real', async ({ page, request }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD no definidos');

  // ---- Setup por API ----
  const login = await (await request.post(`${API}/auth/login`, { data: { email, password } })).json();
  const token = login.data.access_token;
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const ts = Date.now();
  const units = await (await request.get(`${API}/units?per_page=100`, { headers: auth })).json();
  const unitId = units.data.find((u) => u.abbreviation === 'un').id;
  const cat = await (await request.post(`${API}/categories`, { headers: auth, data: { name: `E2E Categoría ${ts}` } })).json();
  const prod = await (await request.post(`${API}/products`, {
    headers: auth,
    data: {
      sku: `E2E-${ts}`,
      name: `Producto E2E ${ts}`,
      category_id: cat.data.id,
      unit_id: unitId,
      purchase_price: 800,
      sale_price: 1200,
      min_stock: 2,
    },
  })).json();
  await request.post(`${API}/inventory/movements`, {
    headers: auth,
    data: { product_id: prod.data.id, movement_type: 'PURCHASE', quantity: 5 },
  });

  // ---- UI: login ----
  await page.goto('/login');
  await page.getByPlaceholder('admin@peumayen.cl').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

  // ---- UI: crear cotización ----
  await page.goto('/quotations');
  await page.getByRole('button', { name: /nueva cotización/i }).click();
  await page.getByPlaceholder(/buscar por nombre o sku/i).fill(`E2E-${ts}`);
  await page.getByRole('button', { name: '+', exact: true }).first().click();
  // Selector estable: durante el submit el botón cambia a "Creando…" y el modal
  // se desmonta al completar. force=true dispara el click de inmediato.
  await page.locator('.modal button[type="submit"]').click({ force: true });

  // ---- Verificación: número COT-YYYY-NNNN en el detalle ----
  const title = page.locator('.modal-title');
  await expect(title).toContainText(/COT-\d{4}-\d{4}/, { timeout: 15_000 });
  const number = (await title.textContent()).trim();

  // ---- Teardown por API: eliminar la cotización borrador ----
  const quotes = await (await request.get(`${API}/quotations?q=${encodeURIComponent(number)}`, { headers: auth })).json();
  const mine = quotes.data.find((q) => q.number === number);
  expect(mine).toBeTruthy();
  expect(mine.status).toBe('BORRADOR');
  const del = await request.delete(`${API}/quotations/${mine.id}`, { headers: auth });
  expect(del.status()).toBe(200);
});
