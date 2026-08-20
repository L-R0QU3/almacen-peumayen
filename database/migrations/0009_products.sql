-- 0009: products — precios en entero (pesos CLP), stock operativo, soft delete
create table public.products (
  id             uuid primary key default gen_random_uuid(),
  sku            text not null,
  barcode        text,
  name           text not null,
  category_id    uuid not null references public.categories (id) on delete restrict,
  brand_id       uuid references public.brands (id) on delete restrict,
  unit_id        uuid not null references public.units (id) on delete restrict,
  supplier_id    uuid references public.suppliers (id) on delete restrict,  -- opcional
  purchase_price integer not null default 0 check (purchase_price >= 0),
  sale_price     integer not null default 0 check (sale_price >= 0),
  margin_pct     numeric(5, 2) not null default 0,                          -- calculado en backend
  min_stock      integer not null default 0 check (min_stock >= 0),
  stock          integer not null default 0 check (stock >= 0),             -- sin stock negativo
  is_active      boolean not null default true,                             -- soft delete
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint products_sku_uq unique (sku)
);

create unique index products_barcode_uq on public.products (barcode) where barcode is not null;
