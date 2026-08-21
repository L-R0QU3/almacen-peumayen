/**
 * Publica el detalle del fallo de tests como commit status (contexto
 * "backend-tests-detalle"). Los commit statuses de repos públicos son
 * legibles sin autenticación, lo que permite diagnosticar el CI sin
 * descargar logs. Se ejecuta solo en fallo (if: failure()).
 */
import { readFileSync, existsSync } from 'node:fs';

const file = 'test-output.txt';
const text = existsSync(file) ? readFileSync(file, 'utf8') : '(sin salida de tests)';

const pattern = /FAIL|AssertionError|Cannot read|TypeError:|Error:|expected \d+|×|✗|Tests\s+\d+\s+failed|STDERR|ERROR/;
const lines = text.split('\n').filter((l) => pattern.test(l));
let desc = lines.slice(-6).join(' | ');
if (!desc) desc = text.split('\n').filter(Boolean).slice(-3).join(' | ');
desc = desc.replace(/\s+/g, ' ').slice(0, 140) || 'fallo sin mensaje';

const res = await fetch(
  `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/statuses/${process.env.GITHUB_SHA}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      state: 'failure',
      context: 'backend-tests-detalle',
      description: desc,
    }),
  }
);
const body = await res.json().catch(() => ({}));
console.log(`status publicado (${res.status}): ${body.message || 'OK'} → ${desc}`);
