# Guía de Despliegue — Almacén Peumayen

Pasos exactos para publicar el sistema en **Vercel** (frontend) y **Render** (backend) usando
**Supabase** (ya conectado: base de datos, Auth y Storage configurados con las migraciones 1–17).

---

## 0. Requisitos

- Cuenta en [github.com](https://github.com), [vercel.com](https://vercel.com) y [render.com](https://render.com).
- Proyecto Supabase **con las migraciones ya aplicadas** (hecho: `rzlboctwmlnaszbhnywz`).

> **Seguridad**: los archivos `.env` con credenciales están en `.gitignore` y **no** se suben a GitHub.
> Las variables se cargan directamente en Vercel/Render.

---

## 1. Crear el repositorio en GitHub y subir el código

1. En GitHub → **New repository** → nombre `almacen-peumayen` (privado recomendado) → **Create**.
2. Desde la carpeta del proyecto (local):

```bash
git remote add origin https://github.com/<tu-usuario>/almacen-peumayen.git
git push -u origin main
```

3. Verificar que el CI corre en GitHub Actions (pestaña **Actions**): el workflow valida
   migraciones sobre PostgreSQL, lint + tests del backend (con base de test) y build del frontend.
   En esta máquina ya se verificó que un clon limpio compila (frontend build ✓, backend lint ✓).

---

## 2. Backend en Render

**Opción A — Blueprint (recomendado)**: al conectar el repo, Render detecta `render.yaml`
(raíz del repo) y crea el servicio `peumayen-api` con root `backend`, build
`npm install --omit=dev`, start `npm start` y healthcheck `/api/v1/health`.

**Opción B — Manual**: New → Web Service → repo → **Root Directory `backend`** (IMPORTANTE:
sin esto Render corre en la raíz del repo, donde no hay `package.json` y el deploy
falla con ENOENT) → Build `npm install --omit=dev` → Start `npm start` →
Health Check Path `/api/v1/health`.

> Si por algún motivo el servicio queda con root en la raíz del repo, ya funciona igual:
> el `package.json` raíz delega (`start`/`build`/`postinstall` → `backend/`).

**Variables de entorno** (Settings → Environment):

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | **dejar vacía** — Render la inyecta automáticamente |
| `DATABASE_URL` | `postgresql://postgres.rzlboctwmlnaszbhnywz:<password-del-pooler>@aws-0-us-east-1.pooler.supabase.com:5432/postgres` |
| `SUPABASE_URL` | `https://rzlboctwmlnaszbhnywz.supabase.co` |
| `SUPABASE_ANON_KEY` | *(anon key del proyecto)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(service role key — SOLO backend)* |
| `FRONTEND_URL` | `https://<tu-app>.vercel.app` (URL final de Vercel) |
| `RATE_LIMIT_MAX` | `300` |

> **Importante**: `FRONTEND_URL` debe ser la URL exacta de Vercel (sin `/` final).
> CORS solo permite ese origen. Sin estas variables el backend no arranca
> (validación de entorno al boot).

---

## 3. Frontend en Vercel

1. **Add New → Project** → importar `almacen-peumayen` → Framework preset **Vite** → Root Directory `frontend`.
2. `vercel.json` (ya en el repo) añade los rewrites SPA.
3. **Variables de entorno**:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://<tu-api>.onrender.com/api/v1` (URL de Render + `/api/v1`) |
| `VITE_SUPABASE_URL` | `https://rzlboctwmlnaszbhnywz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(anon key — es pública por diseño)* |

4. **Deploy**. Tras publicar, actualizar `FRONTEND_URL` en Render con la URL de Vercel y re-deployar el backend si hace falta.

---

## 4. Primer ingreso y verificación

1. Ingresar con el ADMIN creado: `admin@peumayen.cl` (la contraseña fue entregada al conectar el proyecto).
2. **Cambiar la contraseña** (quedó expuesta en el canal de chat): Supabase → Authentication →
   Users → `admin@peumayen.cl` → reset de contraseña (o flujo de "olvidé mi contraseña").
3. Verificaciones post-deploy:
   - `GET <render>/api/v1/health` → `{"data":{"status":"ok",...}}`.
   - Login en la web → dashboard con "Resumen de Almacén Peumayen".
   - Configuración → subir el **logo** (usa Storage con políticas RLS de ADMIN).
   - Crear un producto → movimiento de inventario → cotización → descargar PDF.

---

## 5. Datos iniciales (opcional)

Con el backend desplegado y `DATABASE_URL` apuntando a Supabase, se puede sembrar datos demo:

```bash
cd backend
npm run create-admin -- --email=admin@peumayen.cl --password='<nueva-clave>' --name='Administrador'
npm run seed-demo
```

> `create-admin` ya se ejecutó al conectar el proyecto; solo se repite si se desea otro usuario.

---

## Troubleshooting rápido

| Síntoma | Causa probable |
|---|---|
| Login dice "Credenciales incorrectas" | Email/contraseña mal escritos, o el usuario está desactivado |
| CORS error en consola del navegador | `FRONTEND_URL` en Render no coincide exactamente con la URL de Vercel |
| `/api/v1/health` responde pero la web no carga datos | `VITE_API_URL` mal formada (falta `/api/v1` o `https://`) |
| Subida de logo 403 | Políticas RLS de `company-assets` o `app_is_admin()` (revisar migración 0016) |
| El CI falla | Revisar Actions → ejecutar los jobs localmente con `npm test` (backend) y `npm run build` (frontend) |
