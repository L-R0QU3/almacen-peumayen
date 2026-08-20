-- 0004: permissions (códigos granulares module.action)
create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.modules (id) on delete restrict,
  code        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

insert into public.permissions (module_id, code, description)
select m.id, p.code, p.description
from (values
  ('products',   'products.create',            'Crear productos'),
  ('products',   'products.read',              'Ver productos'),
  ('products',   'products.update',            'Actualizar productos'),
  ('products',   'products.delete',            'Desactivar productos'),
  -- Catálogos de productos (pertenecen al módulo products)
  ('products',   'categories.create',          'Crear categorías'),
  ('products',   'categories.read',            'Ver categorías'),
  ('products',   'categories.update',          'Actualizar categorías'),
  ('products',   'categories.delete',          'Desactivar categorías'),
  ('products',   'brands.create',              'Crear marcas'),
  ('products',   'brands.read',                'Ver marcas'),
  ('products',   'brands.update',              'Actualizar marcas'),
  ('products',   'brands.delete',              'Desactivar marcas'),
  ('products',   'units.create',               'Crear unidades'),
  ('products',   'units.read',                 'Ver unidades'),
  ('products',   'units.update',               'Actualizar unidades'),
  ('products',   'units.delete',               'Desactivar unidades'),
  ('products',   'suppliers.create',           'Crear proveedores'),
  ('products',   'suppliers.read',             'Ver proveedores'),
  ('products',   'suppliers.update',           'Actualizar proveedores'),
  ('products',   'suppliers.delete',           'Desactivar proveedores'),
  ('inventory',  'inventory.read',             'Ver stock'),
  ('inventory',  'inventory.create_movement',  'Registrar entradas y salidas'),
  ('inventory',  'inventory.adjust',           'Realizar ajustes de stock'),
  ('inventory',  'inventory.view_history',     'Ver historial de movimientos'),
  ('customers',  'customers.create',           'Crear clientes'),
  ('customers',  'customers.read',             'Ver clientes'),
  ('customers',  'customers.update',           'Actualizar clientes'),
  ('customers',  'customers.delete',           'Desactivar clientes'),
  ('quotations', 'quotations.create',          'Crear cotizaciones'),
  ('quotations', 'quotations.read',            'Ver cotizaciones'),
  ('quotations', 'quotations.update',          'Actualizar cotizaciones y estados'),
  ('quotations', 'quotations.delete',          'Eliminar cotizaciones en borrador'),
  ('quotations', 'quotations.convert',         'Convertir a venta (futuro)'),
  ('quotations', 'quotations.export_pdf',      'Exportar PDF'),
  ('config',     'config.read',                'Ver configuración'),
  ('config',     'config.update',              'Actualizar configuración'),
  ('modules',    'modules.read',               'Ver módulos'),
  ('modules',    'modules.update',             'Activar/desactivar módulos')
) as p (module, code, description)
join public.modules m on m.code = p.module;
