/**
 * Limpieza de datos de prueba E2E en Supabase (prefijos E2E-).
 * Elimina SOLO registros creados por los tests E2E: cotizaciones que referencian
 * productos E2E-, movimientos, productos y categorías con prefijo "E2E".
 *
 * Uso: DATABASE_URL=... node scripts/clean-e2e.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const ids = await pool.query(
  `SELECT id FROM public.products WHERE sku LIKE 'E2E-%'`
);
const productIds = ids.rows.map((r) => r.id);

if (productIds.length === 0) {
  console.log('✓ Sin artefactos E2E (0 productos con prefijo E2E-)');
} else {
  // cotizaciones que referencian productos E2E
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
  const cats = await pool.query(`DELETE FROM public.categories WHERE name LIKE 'E2E Categoría %' RETURNING id`);
  console.log(`✓ Limpieza E2E: ${productIds.length} productos, ${cats.rowCount} categorías y sus cotizaciones/movimientos eliminados`);
}

const check = await pool.query(`SELECT count(*)::int AS n FROM public.products WHERE sku LIKE 'E2E-%'`);
console.log('residuo de productos E2E:', check.rows[0].n);
await pool.end();
