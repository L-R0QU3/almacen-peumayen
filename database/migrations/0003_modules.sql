-- 0003: modules (catálogo de módulos activables)
create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  is_core     boolean not null default false,   -- los core no se pueden desactivar
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.modules (code, name, description, is_core, is_active, sort_order) values
  ('products',   'Productos',     'Gestión de productos y catálogo',      false, true,  10),
  ('inventory',  'Inventario',    'Stock, movimientos y alertas',         false, true,  20),
  ('customers',  'Clientes',      'Gestión de clientes',                  false, true,  30),
  ('quotations', 'Cotizaciones',  'Cotizaciones y PDF',                   false, true,  40),
  ('config',     'Configuración', 'Configuración del negocio',            true,  true,  90),
  ('modules',    'Módulos',       'Activación/desactivación de módulos',  true,  true, 100),
  ('sales',      'Ventas',        'Ventas (futuro)',                      false, false, 50),
  ('pos',        'POS',           'Punto de venta (futuro)',              false, false, 51),
  ('cash',       'Caja',          'Caja (futuro)',                        false, false, 52),
  ('purchases',  'Compras',       'Compras (futuro)',                     false, false, 60),
  ('reports',    'Reportes',      'Reportes avanzados (futuro)',          false, false, 70);
