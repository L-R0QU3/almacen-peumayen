-- 0002: roles
create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Catálogo inicial: MVP usa solo ADMIN; los demás quedan preparados para el futuro.
insert into public.roles (code, name, description) values
  ('ADMIN',     'Administrador', 'Control total del sistema'),
  ('MANAGER',   'Gerente',       'Gestión operativa y reportes (futuro)'),
  ('SELLER',    'Vendedor',      'Ventas y cotizaciones (futuro)'),
  ('WAREHOUSE', 'Bodeguero',     'Inventario y productos (futuro)');
