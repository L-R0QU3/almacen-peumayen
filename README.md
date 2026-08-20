# Almacén Peumayen — Sistema Modular de Gestión

Sistema web profesional para **Almacén Peumayen** (abarrotes y consumo cotidiano).

- **Arquitectura**: Monolito Modular + API REST + PostgreSQL (ver [`docs/ARQUITECTURA DEFINITIVA FINAL — ALMACÉN PEUMAYEN.md`](docs/ARQUITECTURA%20DEFINITIVA%20FINAL%20—%20ALMACÉN%20PEUMAYEN.md)).
- **MVP**: Productos · Inventario · Clientes · Cotizaciones · Configuración · Roles/Permisos · Módulos activables.
- **Futuro**: Ventas · POS · Código de barras (hardware) · Caja · Compras · Reportes.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + React Router + Axios (Mobile First, Light/Dark/System) |
| Backend | Node.js + Express (`/api/v1`) |
| Datos | Supabase PostgreSQL + `pg` (transacciones, `SELECT FOR UPDATE`) |
| Auth | Supabase Auth |
| Archivos | Supabase Storage |
| Deploy | Vercel (frontend) · Render (backend) |

## Estructura

```text
almacen-peumayen/
├── backend/     # API Express /api/v1
├── frontend/    # SPA React (Vite)
├── database/    # Migraciones node-pg-migrate (SQL)
├── e2e/         # Playwright
└── docs/        # Arquitectura definitiva
```

## Requisitos

- Node.js ≥ 20
- PostgreSQL ≥ 15 (local) o proyecto Supabase

## Puesta en marcha (desarrollo local)

### 1. Base de datos

```bash
cd database
cp .env.example .env        # editar DATABASE_URL
npm install
npm run migrate             # aplica migraciones 0001..0016
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # completar Supabase y DATABASE_URL
npm install
npm run dev                 # http://localhost:4000/api/v1
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL, VITE_SUPABASE_*
npm install
npm run dev                 # http://localhost:5173
```

### 4. Primer usuario ADMIN

```bash
cd backend
npm run create-admin -- --email=admin@peumayen.cl --password='<clave>' --name='Admin'
```

> El registro público está deshabilitado en el MVP; los usuarios los crea el ADMIN.

## API

Todas las rutas bajo `/api/v1` (auth, products, categories, brands, units, suppliers, inventory, customers, quotations, modules, config, storage, health). Envelope estándar: `{ data, meta, error }`.

## Despliegue (Vercel + Render + Supabase)

### 1. Supabase (crear proyecto)

1. Crear proyecto en [supabase.com](https://supabase.com).
2. **Auth**: habilitar proveedor Email (Settings → Authentication → Providers). En producción, restringir sitios permitidos.
3. **Storage**: crear bucket `company-assets` (público de lectura) y aplicar políticas RLS:

```sql
-- Solo ADMIN sube/reemplaza/elimina; lectura pública
create policy "logo publico lectura" on storage.objects for select using (bucket_id = 'company-assets');
create policy "logo subida admin" on storage.objects for insert to authenticated using (bucket_id = 'company-assets' and public.app_is_admin());
create policy "logo reemplazo admin" on storage.objects for update to authenticated using (bucket_id = 'company-assets' and public.app_is_admin());
create policy "logo borrado admin" on storage.objects for delete to authenticated using (bucket_id = 'company-assets' and public.app_is_admin());
```

> La función `public.app_is_admin()` se crea en la migración 0016.

4. Anotar `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (Settings → API).

### 2. Backend (Render)

Opción A (blueprint): subir el repo a GitHub y conectar Render usando `render.yaml` (raíz del repo). Completar las variables `sync: false` en el dashboard.

Opción B (manual): nuevo Web Service → repo → root `backend` → build `npm install --omit=dev` → start `npm start` → healthcheck `/api/v1/health`. Variables: `DATABASE_URL` (pooler de Supabase), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` (URL de Vercel), `NODE_ENV=production`.

### 3. Frontend (Vercel)

Importar el repo → root `frontend` → framework Vite. Variables: `VITE_API_URL` (URL de Render + `/api/v1`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. El `vercel.json` incluye los rewrites SPA.

### 4. Primer usuario ADMIN

```bash
cd backend
npm run create-admin -- --email=admin@peumayen.cl --password='<clave-fuerte>' --name='Admin'
```

Opcional, datos demo:

```bash
npm run seed-demo
```

## Testing

- Unit / Component: Vitest (+ Testing Library)
- Integración API: Supertest contra PostgreSQL real (`npm test` en `backend/`; prepara y migra `peumayen_test` automáticamente)
- E2E: Playwright (única herramienta E2E) — `npm test` en `e2e/` (requiere `npm run build` previo en `frontend/`)

## Estado actual

El MVP está **implementado y verificado de punta a punta**:

- **Base de datos**: migraciones 1–17 aplicadas en Supabase (PostgreSQL 17.6).
- **Supabase conectado**: Auth (login/logout reales verificados), Storage (`company-assets` + políticas RLS de ADMIN), DB (numeración atómica `COT-2026-0001` verificada en producción).
- **Testing**: backend 71/71 (unit + integración + concurrencia + seguridad), frontend 16/16, E2E Playwright 12/12 (incluye login real y flujo de negocio completo por la UI), cobertura ~80%.
- **Despliegue**: ver [`docs/DEPLOY.md`](docs/DEPLOY.md) (GitHub + Render + Vercel paso a paso).

## Roadmap (estimación flexible)

Ver sección 24 de la arquitectura. Prioridad: integridad de datos → seguridad → calidad → UX → funcionalidad → tiempo.
