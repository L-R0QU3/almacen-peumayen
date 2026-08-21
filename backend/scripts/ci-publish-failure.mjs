/**
 * Publica el detalle del fallo de tests como commit statuses legibles
 * (contextos "backend-tests-detalle-N"). Los statuses de repos públicos se
 * consultan sin autenticación → permite leer el error real del CI.
 * Prioriza las anotaciones ::error de vitest (contienen el mensaje exacto).
 */
import { readFileSync, existsSync } from 'node:fs';

const file = 'test-output.txt';
const text = existsSync(file) ? readFileSync(file, 'utf8') : '(sin salida de tests)';

const errorLines = [];
for (const line of text.split('\n')) {
  const m = line.match(/^::error[^:]*::(.*)$/);
  if (m) {
    errorLines.push(`ERR: ${m[1]}`);
    continue;
  }
  if (/FAIL|AssertionError|Cannot read|TypeError:|Error:|expected \d+|×|✗|Tests\s+\d+\s+failed|STDERR/.test(line)) {
    errorLines.push(line.trim());
  }
}

let full = errorLines.slice(-12).join('\n') || text.split('\n').filter(Boolean).slice(-5).join('\n');
full = full.replace(/\r/g, '');

const chunks = [];
for (let i = 0; i < full.length; i += 130) chunks.push(full.slice(i, i + 130));

const base = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/statuses/${process.env.GITHUB_SHA}`;
let published = 0;
for (let i = 0; i < Math.min(chunks.length, 8); i += 1) {
  const description = (chunks[i].replace(/\s+/g, ' ').slice(0, 140) || '…');
  const res = await fetch(base, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state: 'failure',
      context: `backend-tests-detalle-${i + 1}`,
      description,
    }),
  });
  if (res.ok) published += 1;
}
console.log(`statuses publicados: ${published}/${Math.min(chunks.length, 8)}`);
