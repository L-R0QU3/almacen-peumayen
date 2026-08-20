-- 0017: updated_at en catálogos (categories, brands, units)
-- Los catálogos se actualizan en el backend (updated_at = now()); faltaba la columna.
alter table public.categories add column if not exists updated_at timestamptz not null default now();
alter table public.brands    add column if not exists updated_at timestamptz not null default now();
alter table public.units     add column if not exists updated_at timestamptz not null default now();
