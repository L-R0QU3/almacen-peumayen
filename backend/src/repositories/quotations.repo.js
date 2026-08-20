/** Marca como VENCIDAS las cotizaciones BORRADOR/ENVIADA cuya vigencia expiró (lazy). */
export async function expireExpired(db) {
  const { rowCount } = await db.query(
    `UPDATE public.quotations
     SET status = 'VENCIDA', updated_at = now()
     WHERE status IN ('BORRADOR', 'ENVIADA')
       AND valid_until IS NOT NULL
       AND valid_until < current_date`
  );
  return rowCount;
}

export async function findMany(db, { q, status, customerId, from, to, offset, perPage }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (q) {
    conditions.push(`(q.number ILIKE '%' || $${i} || '%' OR q.customer_name ILIKE '%' || $${i} || '%')`);
    params.push(q);
    i += 1;
  }
  if (status) {
    conditions.push(`q.status = $${i}`);
    params.push(status);
    i += 1;
  }
  if (customerId) {
    conditions.push(`q.customer_id = $${i}`);
    params.push(customerId);
    i += 1;
  }
  if (from) {
    conditions.push(`q.issue_date >= $${i}`);
    params.push(from);
    i += 1;
  }
  if (to) {
    conditions.push(`q.issue_date <= $${i}`);
    params.push(to);
    i += 1;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows: countRows } = await db.query(
    `SELECT count(*)::int AS total FROM public.quotations q ${where}`,
    params
  );
  const { rows } = await db.query(
    `SELECT q.id, q.number, q.customer_id, q.customer_name, q.status,
            q.issue_date, q.valid_until, q.subtotal, q.total, q.created_at,
            COUNT(qi.id)::int AS items_count
     FROM public.quotations q
     LEFT JOIN public.quotation_items qi ON qi.quotation_id = q.id
     ${where}
     GROUP BY q.id
     ORDER BY q.created_at DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...params, perPage, offset]
  );
  return { rows, total: countRows[0].total };
}

export async function findById(db, id) {
  const { rows } = await db.query('SELECT * FROM public.quotations WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function lockById(db, id) {
  const { rows } = await db.query('SELECT * FROM public.quotations WHERE id = $1 FOR UPDATE', [id]);
  return rows[0] ?? null;
}

export async function findItems(db, quotationId) {
  const { rows } = await db.query(
    `SELECT id, product_id, product_name, sku, quantity, unit_price, subtotal
     FROM public.quotation_items WHERE quotation_id = $1 ORDER BY id`,
    [quotationId]
  );
  return rows;
}

export async function nextSequenceNumber(db, year) {
  await db.query(
    `INSERT INTO public.quotation_sequences (year, last_number) VALUES ($1, 0)
     ON CONFLICT (year) DO NOTHING`,
    [year]
  );
  const { rows } = await db.query(
    'SELECT last_number FROM public.quotation_sequences WHERE year = $1 FOR UPDATE',
    [year]
  );
  const nextNumber = rows[0].last_number + 1;
  await db.query('UPDATE public.quotation_sequences SET last_number = $2 WHERE year = $1', [
    year,
    nextNumber,
  ]);
  return `COT-${year}-${String(nextNumber).padStart(4, '0')}`;
}

export async function createQuotation(db, { number, customerId, customerName, issueDate, validUntil, observations, subtotal, total, createdBy }) {
  const { rows } = await db.query(
    `INSERT INTO public.quotations
       (number, customer_id, customer_name, status, issue_date, valid_until, observations, subtotal, total, created_by)
     VALUES ($1, $2, $3, 'BORRADOR', $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [number, customerId ?? null, customerName ?? null, issueDate, validUntil ?? null, observations ?? null, subtotal, total, createdBy]
  );
  return rows[0];
}

export async function createItem(db, { quotationId, productId, productName, sku, quantity, unitPrice, subtotal }) {
  const { rows } = await db.query(
    `INSERT INTO public.quotation_items
       (quotation_id, product_id, product_name, sku, quantity, unit_price, subtotal)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, product_id, product_name, sku, quantity, unit_price, subtotal`,
    [quotationId, productId, productName, sku, quantity, unitPrice, subtotal]
  );
  return rows[0];
}

export async function updateHeader(db, id, { customerId, customerName, validUntil, observations, subtotal, total }) {
  const { rows } = await db.query(
    `UPDATE public.quotations
     SET customer_id = $2, customer_name = $3, valid_until = $4, observations = $5,
         subtotal = $6, total = $7, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, customerId ?? null, customerName ?? null, validUntil ?? null, observations ?? null, subtotal, total]
  );
  return rows[0] ?? null;
}

export async function deleteItems(db, quotationId) {
  await db.query('DELETE FROM public.quotation_items WHERE quotation_id = $1', [quotationId]);
}

export async function deleteQuotation(db, id) {
  const { rows } = await db.query('DELETE FROM public.quotations WHERE id = $1 RETURNING id', [id]);
  return rows[0] ?? null;
}

export async function updateStatus(db, id, status) {
  const { rows } = await db.query(
    `UPDATE public.quotations SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return rows[0] ?? null;
}
