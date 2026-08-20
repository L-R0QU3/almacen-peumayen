/** Bloquea la fila del producto para escritura dentro de una transacción. */
export async function lockProduct(db, id) {
  const { rows } = await db.query('SELECT stock FROM public.products WHERE id = $1 FOR UPDATE', [id]);
  return rows[0] ?? null;
}

export async function insertMovement(db, { productId, type, quantity, unitPrice, notes, referenceType, referenceId, createdBy }) {
  const { rows } = await db.query(
    `INSERT INTO public.inventory_movements
       (product_id, movement_type, quantity, unit_price, notes, reference_type, reference_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [productId, type, quantity, unitPrice, notes ?? null, referenceType ?? null, referenceId ?? null, createdBy ?? null]
  );
  return rows[0];
}

/** Aplica el efecto (positivo o negativo) al stock operativo. */
export async function addStock(db, productId, effect) {
  const { rows } = await db.query(
    `UPDATE public.products SET stock = stock + $2, updated_at = now() WHERE id = $1 RETURNING stock`,
    [productId, effect]
  );
  return rows[0]?.stock;
}

export async function findStockList(db, { q, categoryId, onlyAlerts, offset, perPage }) {
  const conditions = ['p.is_active = true'];
  const params = [];
  let i = 1;

  if (q) {
    conditions.push(`(p.name ILIKE '%' || $${i} || '%' OR p.sku ILIKE '%' || $${i} || '%' OR p.barcode ILIKE '%' || $${i} || '%')`);
    params.push(q);
    i += 1;
  }
  if (categoryId) {
    conditions.push(`p.category_id = $${i}`);
    params.push(categoryId);
    i += 1;
  }
  if (onlyAlerts) {
    conditions.push(`p.stock <= p.min_stock`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows: countRows } = await db.query(
    `SELECT count(*)::int AS total FROM public.products p ${where}`,
    params
  );
  const { rows } = await db.query(
    `SELECT p.id, p.sku, p.barcode, p.name, p.stock, p.min_stock, p.sale_price,
            u.abbreviation AS unit_abbreviation, c.name AS category_name,
            (p.stock <= p.min_stock) AS is_low
     FROM public.products p
     LEFT JOIN public.units u ON u.id = p.unit_id
     LEFT JOIN public.categories c ON c.id = p.category_id
     ${where}
     ORDER BY (p.stock <= p.min_stock) DESC, p.name
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, perPage, offset]
  );
  return { rows, total: countRows[0].total };
}

export async function findMovementsByProduct(db, productId, { type, from, to, offset, perPage }) {
  const conditions = ['m.product_id = $1'];
  const params = [productId];
  let i = 2;

  if (type) {
    conditions.push(`m.movement_type = $${i}`);
    params.push(type);
    i += 1;
  }
  if (from) {
    conditions.push(`m.created_at::date >= $${i}`);
    params.push(from);
    i += 1;
  }
  if (to) {
    conditions.push(`m.created_at::date <= $${i}`);
    params.push(to);
    i += 1;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const { rows: countRows } = await db.query(
    `SELECT count(*)::int AS total FROM public.inventory_movements m ${where}`,
    params
  );
  const { rows } = await db.query(
    `SELECT m.id, m.product_id, m.movement_type, m.quantity, m.unit_price,
            m.reference_type, m.reference_id, m.notes, m.created_at,
            u.name AS created_by_name
     FROM public.inventory_movements m
     LEFT JOIN public.users u ON u.id = m.created_by
     ${where}
     ORDER BY m.created_at DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, perPage, offset]
  );
  return { rows, total: countRows[0].total };
}
