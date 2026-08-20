import { test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots');

test('captura la página de login', async ({ page }, testInfo) => {
  mkdirSync(outDir, { recursive: true });
  await page.goto('/login');
  await page.screenshot({
    path: path.join(outDir, `login-${testInfo.project.name}.png`),
    fullPage: true,
  });
});
