-- 0010: inventory_movements — historial completo. quantity SIEMPRE positiva;
-- el signo lo aplica el backend según movement_type. Sin triggers.
create table public.inventory_movements (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete restrict,
  movement_type  text not null check (movement_type in
                   ('PURCHASE', 'RETURN', 'SALE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT')),
  quantity       integer not null check (quantity > 0),
  unit_price     integer not null default 0 check (unit_price >= 0),
  reference_type text,
  reference_id   uuid,
  notes          text,
  created_by     uuid references public.users (id) on delete restrict,
  created_at     timestamptz not null default now()
);

comment on table public.inventory_movements is
  'Historial de movimientos. La cantidad es siempre positiva; el efecto en stock
   depende de movement_type (PURCHASE/RETURN/ADJUSTMENT_IN suman; SALE/ADJUSTMENT_OUT restan).';
