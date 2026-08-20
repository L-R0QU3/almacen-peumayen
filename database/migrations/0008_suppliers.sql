-- 0008: suppliers — proveedores (opcional en producto)
create table public.suppliers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  rut          text,
  contact_name text,
  phone        text,
  email        text,
  address      text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index suppliers_rut_uq on public.suppliers (rut) where rut is not null;
