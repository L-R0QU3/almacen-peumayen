import { errors } from '../lib/errors.js';

/** Configuración por catálogo: tabla, campos editables y campos de búsqueda. */
export const CATALOG_CONFIG = {
  categories: { table: 'categories', editable: ['name'], searchable: ['name'] },
  brands: { table: 'brands', editable: ['name'], searchable: ['name'] },
  units: { table: 'units', editable: ['name', 'abbreviation'], searchable: ['name', 'abbreviation'] },
  suppliers: {
    table: 'suppliers',
    editable: ['name', 'rut', 'contact_name', 'phone', 'email', 'address'],
    searchable: ['name', 'rut', 'phone'],
  },
};

function pick(data, keys) {
  return Object.fromEntries(keys.filter((k) => k in data && data[k] !== undefined).map((k) => [k, data[k]]));
}

export async function listCatalog(db, name, { q, isActive, offset, perPage }) {
  const { table, searchable } = CATALOG_CONFIG[name];
  const conditions = [];
  const params = [];
  let i = 1;

  if (q) {
    conditions.push(
      `(${searchable.map((f) => `${f} ILIKE '%' || $${i} || '%'`).join(' OR ')})`
    );
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
    `SELECT count(*)::int AS total FROM public.${table} ${where}`,
    params
  );
  const { rows } = await db.query(
    `SELECT * FROM public.${table} ${where} ORDER BY name LIMIT $${i} OFFSET $${i + 1}`,
    [...params, perPage, offset]
  );
  return { rows, total: countRows[0].total };
}

export async function findCatalogById(db, name, id) {
  const { table } = CATALOG_CONFIG[name];
  const { rows } = await db.query(`SELECT * FROM public.${table} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createCatalog(db, name, data) {
  const { table, editable } = CATALOG_CONFIG[name];
  const fields = pick(data, editable);
  const keys = Object.keys(fields);
  if (keys.length === 0) throw errors.badRequest('Sin campos válidos para crear');
  const cols = keys.join(', ');
  const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const { rows } = await db.query(
    `INSERT INTO public.${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function updateCatalog(db, name, id, data) {
  const { table, editable } = CATALOG_CONFIG[name];
  const fields = pick(data, editable);
  const keys = Object.keys(fields);
  if (keys.length === 0) throw errors.badRequest('Sin campos válidos para actualizar');
  const sets = keys.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const { rows } = await db.query(
    `UPDATE public.${table} SET ${sets}, updated_at = now() WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return rows[0] ?? null;
}

export async function deactivateCatalog(db, name, id) {
  const { table } = CATALOG_CONFIG[name];
  const { rows } = await db.query(
    `UPDATE public.${table} SET is_active = false WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}
