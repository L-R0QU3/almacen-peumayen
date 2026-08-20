import { test, expect } from '@playwright/test';

// Login real contra Supabase (credenciales por variables de entorno, nunca hardcodeadas).
// Uso: E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npx playwright test login-real.spec.js
test('login real: inicia sesión y llega al dashboard', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD no definidos');

  await page.goto('/login');
  await page.getByPlaceholder('admin@peumayen.cl').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();

  // Redirige al dashboard tras autenticarse contra Supabase
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
  await expect(page.getByText(/Resumen de Almacén Peumayen/i)).toBeVisible({ timeout: 20_000 });
});

test('login real: rechaza credenciales incorrectas', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL, 'E2E_ADMIN_EMAIL no definido');

  await page.goto('/login');
  await page.getByPlaceholder('admin@peumayen.cl').fill(process.env.E2E_ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••').fill('clave-incorrecta-xyz');
  await page.getByRole('button', { name: /ingresar/i }).click();

  await expect(page.getByText('Credenciales incorrectas')).toBeVisible({ timeout: 20_000 });
});
