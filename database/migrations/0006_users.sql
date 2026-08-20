-- 0006: users — perfil de negocio; id = auth.users.id (Supabase Auth)
create table public.users (
  id         uuid primary key,            -- = auth.users.id
  email      citext not null unique,
  name       text not null,
  role_id    uuid not null references public.roles (id) on delete restrict,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is
  'Perfil de negocio del usuario. La autenticación la maneja Supabase Auth (auth.users).';
