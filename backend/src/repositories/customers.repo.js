import { errors } from '../lib/errors.js';

export async function findMany(db, { q, isActive, offset, perPage }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (q) {
    conditions.push(`(name ILIKE '%' || $${i} || '%' OR rut ILIKE '%' || $${i} || '%' OR phone ILIKE '%' || $${i} || '%')`);
    params.push(q);
    i += 1;
  }
  if (isActive !== undefined) {
    conditions.push(`is_active = $${i}`);
    params.push(isActive);
    i += 1;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows: countRows } = await db.query(
    `SELECT count(*)::int AS total FROM public.customers ${where}`,
    params
  );
  const { rows } = await db.query(
    `SELECT * FROM public.customers ${where} ORDER BY name LIMIT $${i} OFFSET $${i + 1}`,
    [...params, perPage, offset]
  );
  return { rows, total: countRows[0].total };
}

export async function findById(db, id) {
  const { rows } = await db.query('SELECT * FROM public.customers WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function create(db, data) {
  const { rows } = await db.query(
    `INSERT INTO public.customers (name, rut, phone, email, address)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.name, data.rut ?? null, data.phone ?? null, data.email || null, data.address ?? null]
  );
  return rows[0];
}

const UPDATEABLE = ['name', 'rut', 'phone', 'email', 'address'];

export async function update(db, id, fields) {
  const keys = Object.keys(fields).filter((k) => UPDATEABLE.includes(k));
  if (keys.length === 0) throw errors.badRequest('Sin campos válidos para actualizar');
  const sets = keys.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const { rows } = await db.query(
    `UPDATE public.customers SET ${sets}, updated_at = now() WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return rows[0] ?? null;
}

export async function deactivate(db, id) {
  const { rows } = await db.query(
    'UPDATE public.customers SET is_active = false, updated_at = now() WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] ?? null;
}
