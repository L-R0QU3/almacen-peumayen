export async function findAllModules(db) {
  const { rows } = await db.query(
    `SELECT id, code, name, description, is_core, is_active, sort_order
     FROM public.modules
     ORDER BY sort_order, name`
  );
  return rows;
}

export async function findModuleByCode(db, code) {
  const { rows } = await db.query(
    `SELECT id, code, name, description, is_core, is_active, sort_order
     FROM public.modules WHERE code = $1`,
    [code]
  );
  return rows[0] ?? null;
}

export async function isModuleActive(db, code) {
  const { rows } = await db.query(
    `SELECT EXISTS (SELECT 1 FROM public.modules WHERE code = $1 AND is_active) AS active`,
    [code]
  );
  return rows[0]?.active ?? false;
}

export async function setModuleActive(db, code, isActive) {
  const { rows } = await db.query(
    `UPDATE public.modules SET is_active = $2 WHERE code = $1 RETURNING id, code, name, is_core, is_active, sort_order`,
    [code, isActive]
  );
  return rows[0] ?? null;
}
