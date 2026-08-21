/**
 * Limpieza de datos de prueba en Supabase (prefijos E2E- y DEP-).
 * Elimina SOLO registros creados por los tests E2E o el verificador de deploy:
 * cotizaciones que referencian esos productos, movimientos, productos y
 * categorías con prefijo "E2E"/"DEPLOY".
 *
 * Uso: DATABASE_URL=... node scripts/clean-e2e.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const ids = await pool.query(
  `SELECT id FROM public.products WHERE sku LIKE 'E2E-%' OR sku LIKE 'DEP-%'`
);
const productIds = ids.rows.map((r) => r.id);

if (productIds.length === 0) {
  console.log('✓ Sin artefactos E2E/DEPLOY (0 productos con prefijo E2E-/DEP-)');
} else {
  // cotizaciones que referencian productos de prueba
  await pool.query(
    `DELETE FROM public.quotation_items
     WHERE quotation_id IN (
       SELECT DISTINCT quotation_id FROM public.quotation_items WHERE product_id = ANY($1)
     )`,
    [productIds]
  );
  await pool.query(
    `DELETE FROM public.quotations
     WHERE id IN (
       SELECT DISTINCT quotation_id FROM public.quotation_items WHERE product_id = ANY($1)
     )`,
    [productIds]
  );
  await pool.query(`DELETE FROM public.inventory_movements WHERE product_id = ANY($1)`, [productIds]);
  await pool.query(`DELETE FROM public.products WHERE id = ANY($1)`, [productIds]);
  const cats = await pool.query(
    `DELETE FROM public.categories WHERE name LIKE 'E2E Categoría %' OR name LIKE 'DEPLOY Verif %' RETURNING id`
  );
  console.log(`✓ Limpieza: ${productIds.length} productos, ${cats.rowCount} categorías y sus cotizaciones/movimientos eliminados`);
}

const check = await pool.query(`SELECT count(*)::int AS n FROM public.products WHERE sku LIKE 'E2E-%' OR sku LIKE 'DEP-%'`);
console.log('residuo de productos de prueba:', check.rows[0].n);
await pool.end();
