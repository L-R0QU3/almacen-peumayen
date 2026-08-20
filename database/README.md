# Migraciones — Almacén Peumayen

Migraciones SQL con [node-pg-migrate](https://github.com/salsita/node-pg-migrate) (sin ORM).

## Uso

```bash
cp .env.example .env   # editar DATABASE_URL
npm install
npm run migrate       # aplicar migraciones pendientes (0001..0016)
npm run migrate:down  # revertir la última
```

## Orden (dependencias)

| Migración | Contenido |
|---|---|
| 0001 | Extensiones (pgcrypto, citext, pg_trgm) |
| 0002 | roles + seed |
| 0003 | modules (catálogo, core) |
| 0004 | permissions + seed |
| 0005 | role_permissions (ADMIN con todos) |
| 0006 | users (perfil, id = auth.users.id) |
| 0007 | categories / brands / units + seed |
| 0008 | suppliers |
| 0009 | products |
| 0010 | inventory_movements |
| 0011 | customers |
| 0012 | quotation_sequences (numeración atómica) |
| 0013 | quotations |
| 0014 | quotation_items (snapshots) |
| 0015 | índices |
| 0016 | app_settings + app_is_admin() (Storage RLS) |

> El primer usuario ADMIN se crea con `npm run create-admin` en `backend/` (Supabase Auth),
> no por SQL directo en `auth.users`.
