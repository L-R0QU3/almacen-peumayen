import { errors } from '../lib/errors.js';

const SELECT_PRODUCT = `
  SELECT p.id, p.sku, p.barcode, p.name,
         p.category_id, c.name AS category_name,
         p.brand_id, b.name AS brand_name,
         p.unit_id, u.name AS unit_name, u.abbreviation AS unit_abbreviation,
         p.supplier_id, s.name AS supplier_name,
         p.purchase_price, p.sale_price, p.margin_pct, p.min_stock, p.stock, p.is_active,
         p.created_at, p.updated_at
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  LEFT JOIN public.brands b ON b.id = p.brand_id
  LEFT JOIN public.units u ON u.id = p.unit_id
  LEFT JOIN public.suppliers s ON s.id = p.supplier_id
`;

export async function findMany(db, { q, categoryId, isActive, offset, perPage }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (q) {
    conditions.push(
      `(p.name ILIKE '%' || $${i} || '%' OR p.sku ILIKE '%' || $${i} || '%' OR p.barcode ILIKE '%' || $${i} || '%')`
    );
    params.push(q);
    i += 1;
  }
  if (categoryId) {
    conditions.push(`p.category_id = $${i}`);
    params.push(categoryId);
    i += 1;
  }
  if (isActive !== undefined) {
    conditions.push(`p.is_active = $${i}`);
    params.push(isActive);
    i += 1;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows: countRows } = await db.query(
    `SELECT count(*)::int AS total FROM public.products p ${where}`,
    params
  );
  const { rows } = await db.query(
    `${SELECT_PRODUCT} ${where} ORDER BY p.name LIMIT $${i} OFFSET $${i + 1}`,
    [...params, perPage, offset]
  );
  return { rows, total: countRows[0].total };
}

export async function findById(db, id) {
  const { rows } = await db.query(`${SELECT_PRODUCT} WHERE p.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function create(db, data) {
  const { rows } = await db.query(
    `INSERT INTO public.products
       (sku, name, barcode, category_id, brand_id, unit_id, supplier_id,
        purchase_price, sale_price, margin_pct, min_stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      data.sku,
      data.name,
      data.barcode ?? null,
      data.category_id,
      data.brand_id ?? null,
      data.unit_id,
      data.supplier_id ?? null,
      data.purchase_price ?? 0,
      data.sale_price ?? 0,
      data.margin_pct ?? 0,
      data.min_stock ?? 0,
    ]
  );
  return rows[0] ?? null;
}

const UPDATEABLE = [
  'sku',
  'name',
  'barcode',
  'category_id',
  'brand_id',
  'unit_id',
  'supplier_id',
  'purchase_price',
  'sale_price',
  'margin_pct',
  'min_stock',
];

export async function update(db, id, fields) {
  const keys = Object.keys(fields).filter((k) => UPDATEABLE.includes(k));
  if (keys.length === 0) throw errors.badRequest('Sin campos válidos para actualizar');
  const sets = keys.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
  const values = keys.map((k) => fields[k]);
  const { rows } = await db.query(
    `UPDATE public.products SET ${sets}, updated_at = now() WHERE id = $${keys.length + 1} RETURNING id`,
    [...values, id]
  );
  return rows[0] ?? null;
}

export async function deactivate(db, id) {
  const { rows } = await db.query(
    `UPDATE public.products SET is_active = false, updated_at = now() WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}
