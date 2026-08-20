-- 0011: customers — clientes (soft delete con is_active)
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  rut        text,
  phone      text,
  email      text,
  address    text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_rut_uq on public.customers (rut) where rut is not null;
