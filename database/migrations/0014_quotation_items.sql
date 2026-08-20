-- 0014: quotation_items — ítems con snapshots históricos (nombre, SKU, precio)
create table public.quotation_items (
  id           uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete restrict,
  product_name text not null,                    -- snapshot: nombre en el momento de cotizar
  sku          text not null,                    -- snapshot
  quantity     integer not null check (quantity > 0),
  unit_price   integer not null check (unit_price >= 0),  -- snapshot: precio de venta
  subtotal     integer not null check (subtotal >= 0),
  constraint quotation_items_subtotal_equals_check check (subtotal = quantity * unit_price)
);
