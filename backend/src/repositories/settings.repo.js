export async function getSettings(db) {
  const { rows } = await db.query('SELECT key, value FROM public.app_settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function upsertSetting(db, key, value) {
  await db.query(
    `INSERT INTO public.app_settings (key, value, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}
