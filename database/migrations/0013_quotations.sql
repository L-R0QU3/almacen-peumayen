-- 0013: quotations — cotizaciones con precios históricos y estados
create table public.quotations (
  id            uuid primary key default gen_random_uuid(),
  number        text not null unique,            -- COT-2026-0001 (secuencia atómica)
  customer_id   uuid references public.customers (id) on delete restrict,  -- cliente opcional
  customer_name text,                            -- snapshot histórico del cliente
  status        text not null default 'BORRADOR' check (status in
                  ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA', 'CONVERTIDA_A_VENTA')),
  issue_date    date not null default current_date,
  valid_until   date,                            -- vigencia
  observations  text,
  subtotal      integer not null default 0 check (subtotal >= 0),
  total         integer not null default 0 check (total >= 0),
  created_by    uuid not null references public.users (id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint quotations_valid_until_gte_issue check (valid_until is null or valid_until >= issue_date)
);
