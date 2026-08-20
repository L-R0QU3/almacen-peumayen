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

## Testing

- Unit / Component: Vitest (+ Testing Library)
- Integración API: Supertest
- E2E: Playwright (única herramienta E2E)

## Roadmap (estimación flexible)

Ver sección 24 de la arquitectura. Prioridad: integridad de datos → seguridad → calidad → UX → funcionalidad → tiempo.
