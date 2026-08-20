/**
 * Seed de datos demo para desarrollo (idempotente).
 * Crea categorías, marcas, proveedores y productos de ejemplo, con un
 * movimiento PURCHASE inicial por producto para mantener la trazabilidad.
 *
 * Uso:
 *   DATABASE_URL=... node scripts/seed-demo.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const CATEGORIES = ['Abarrotes', 'Lácteos', 'Bebidas', 'Snacks', 'Limpieza'];
const BRANDS = ['Ideal', 'Colún', 'Coca-Cola', 'Evercrisp', 'Clorox'];
const SUPPLIERS = [
  { name: 'Distribuidora Sur SpA', rut: '76.123.456-7', phone: '+56 9 1111 1111' },
  { name: 'Alimentos del Valle Ltda', rut: '77.234.567-8', phone: '+56 9 2222 2222' },
];

const PRODUCTS = [
  { sku: 'ARR-001', name: 'Arroz Grado 2 1kg', category: 'Abarrotes', brand: 'Ideal', cost: 1100, price: 1490, stock: 50, min: 10 },
  { sku: 'ACE-001', name: 'Aceite Maravilla 1L', category: 'Abarrotes', brand: 'Ideal', cost: 2600, price: 3290, stock: 30, min: 8 },
  { sku: 'LEC-001', name: 'Leche Entera 1L', category: 'Lácteos', brand: 'Colún', cost: 900, price: 1190, stock: 40, min: 15 },
  { sku: 'QUE-001', name: 'Queso Mantecoso 250g', category: 'Lácteos', brand: 'Colún', cost: 2200, price: 2890, stock: 20, min: 5 },
  { sku: 'BEB-001', name: 'Bebida Cola 2L', category: 'Bebidas', brand: 'Coca-Cola', cost: 1700, price: 2190, stock: 60, min: 12 },
  { sku: 'BEB-002', name: 'Agua Mineral 1.5L', category: 'Bebidas', brand: 'Coca-Cola', cost: 700, price: 990, stock: 80, min: 20 },
  { sku: 'SNA-001', name: 'Papas Fritas 160g', category: 'Snacks', brand: 'Evercrisp', cost: 1200, price: 1590, stock: 35, min: 10 },
  { sku: 'LIM-001', name: 'Lavaloza 750ml', category: 'Limpieza', brand: 'Clorox', cost: 1500, price: 1990, stock: 25, min: 6 },
];

async function idByName(table, name) {
  const { rows } = await pool.query(`SELECT id FROM public.${table} WHERE name = $1`, [name]);
  return rows[0]?.id ?? null;
}

async function ensureByName(table, name, extra = '') {
  const existing = await idByName(table, name);
  if (existing) return existing;
  const { rows } = await pool.query(
    `INSERT INTO public.${table} (name ${extra ? ', ' + extra.split(':')[0] : ''})
     VALUES ($1 ${extra ? ', $2' : ''})
     ON CONFLICT (name) DO NOTHING RETURNING id`,
    extra ? [name, extra.split(':')[1]] : [name]
  );
  return rows[0]?.id ?? (await idByName(table, name));
}

async function main() {
  const { rows: admins } = await pool.query(
    `SELECT u.id FROM public.users u JOIN public.roles r ON r.id = u.role_id
     WHERE r.code = 'ADMIN' AND u.is_active ORDER BY u.created_at LIMIT 1`
  );
  if (admins.length === 0) {
    console.error('✗ No hay usuarios ADMIN. Crea el primero con: npm run create-admin');
    process.exit(1);
  }
  const adminId = admins[0].id;

  for (const name of CATEGORIES) await ensureByName('categories', name);
  for (const name of BRANDS) await ensureByName('brands', name);
  const supplierIds = {};
  for (const s of SUPPLIERS) {
    const existing = await pool.query(`SELECT id FROM public.suppliers WHERE name = $1`, [s.name]);
    if (existing.rows[0]) {
      supplierIds[s.name] = existing.rows[0].id;
    } else {
      const { rows } = await pool.query(
        `INSERT INTO public.suppliers (name, rut, phone) VALUES ($1, $2, $3) RETURNING id`,
        [s.name, s.rut, s.phone]
      );
      supplierIds[s.name] = rows[0].id;
    }
  }

  let created = 0;
  for (const p of PRODUCTS) {
    const exists = await pool.query(`SELECT id FROM public.products WHERE sku = $1`, [p.sku]);
    if (exists.rows[0]) continue;

    const categoryId = await idByName('categories', p.category);
    const brandId = await idByName('brands', p.brand);
    const unitId = await pool.query(`SELECT id FROM public.units WHERE abbreviation = 'un' LIMIT 1`);
    const margin = Math.round(((p.price - p.cost) / p.cost) * 10_000) / 100;

    const product = await pool.query(
      `INSERT INTO public.products
         (sku, name, category_id, brand_id, unit_id, purchase_price, sale_price, margin_pct, min_stock, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [p.sku, p.name, categoryId, brandId, unitId.rows[0].id, p.cost, p.price, margin, p.min, 0]
    );

    // Movimiento inicial PURCHASE (stock inicial con trazabilidad)
    await pool.query(
      `INSERT INTO public.inventory_movements (product_id, movement_type, quantity, unit_price, notes, created_by)
       VALUES ($1, 'PURCHASE', $2, $3, 'Stock inicial (demo)', $4)`,
      [product.rows[0].id, p.stock, p.cost, adminId]
    );
    await pool.query(`UPDATE public.products SET stock = stock + $2 WHERE id = $1`, [product.rows[0].id, p.stock]);

    created += 1;
  }

  console.log(`✓ Seed demo: ${created} productos creados (${PRODUCTS.length - created} ya existían)`);
  await pool.end();
}

main().catch((err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});
