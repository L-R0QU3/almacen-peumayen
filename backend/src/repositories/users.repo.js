/**
 * Repositorio de usuarios (perfil de negocio).
 * `db` puede ser el pool o un cliente transaccional.
 */
export async function findUserWithContext(db, userId) {
  const { rows } = await db.query(
    `SELECT u.id,
            u.email::text AS email,
            u.name,
            u.is_active,
            r.code AS role,
            COALESCE(array_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
     FROM public.users u
     JOIN public.roles r ON r.id = u.role_id
     LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
     LEFT JOIN public.permissions p ON p.id = rp.permission_id
     WHERE u.id = $1
     GROUP BY u.id, r.code`,
    [userId]
  );
  return rows[0] ?? null;
}
