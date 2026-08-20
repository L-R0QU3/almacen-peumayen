-- 0007: categorías, marcas, unidades (catálogos de productos)
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  abbreviation text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Unidades típicas de abarrotes
insert into public.units (name, abbreviation) values
  ('Unidad', 'un'),
  ('Caja', 'cj'),
  ('Kilogramo', 'kg'),
  ('Gramo', 'g'),
  ('Litro', 'L'),
  ('Bolsa', 'bls'),
  ('Paquete', 'pq'),
  ('Docena', 'doc');
