import { test, expect } from '@playwright/test';

// Smoke test: la app carga y, sin sesión, redirige al login.
test('la app carga y redirige a /login sin sesión', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /almacén peumayen/i })).toBeVisible();
});

test('la página de login muestra el formulario', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByPlaceholder('admin@peumayen.cl')).toBeVisible();
  await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();
});
