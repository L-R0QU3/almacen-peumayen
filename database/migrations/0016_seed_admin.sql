-- 0016: config inicial + función de seguridad para Storage (ADMIN dentro de RLS)
--
-- NOTA sobre el primer ADMIN: la creación del usuario en Supabase Auth NO se hace
-- por SQL (insertar en auth.users es frágil y desaconsejado). Se hace mediante el
-- script backend/scripts/create-admin.mjs (service role) tras aplicar migraciones.
-- Esta migración prepara la configuración por defecto y la función app_is_admin()
-- usada por las políticas RLS de Supabase Storage.

-- Configuración del negocio (key-value, jsonb)
create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('business', jsonb_build_object(
    'name', 'Almacén Peumayen',
    'rut', '',
    'phone', '',
    'address', '',
    'logo_url', ''
  )),
  ('theme', jsonb_build_object('mode', 'system')),
  ('inventory', jsonb_build_object('allow_negative_stock', false));

-- Función SECURITY DEFINER: valida si el usuario autenticado es ADMIN.
-- Se ejecuta con privilegios del definidor y NO activa RLS de public.users
-- (evita recursión cuando se invoca desde políticas de storage.objects).
-- En Postgres local (sin Supabase) auth.uid() no existe: se captura y retorna false.
create or replace function public.app_is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  begin
    v_uid := auth.uid();
  exception when others then
    return false;
  end;

  if v_uid is null then
    return false;
  end if;

  return exists (
    select 1
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.id = v_uid
      and r.code = 'ADMIN'
      and u.is_active = true
  );
end;
$$;

comment on function public.app_is_admin() is
  'Indica si auth.uid() corresponde a un ADMIN activo. Usada por políticas RLS de Storage.';
