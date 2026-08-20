-- 0005: role_permissions — ADMIN recibe todos los permisos
create table public.role_permissions (
  role_id       uuid not null references public.roles (id)       on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'ADMIN';
