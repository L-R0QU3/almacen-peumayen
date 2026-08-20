# API REST — Almacén Peumayen (`/api/v1`)

Base URL (local): `http://localhost:4000/api/v1`

## Convenciones

- **Autenticación**: `Authorization: Bearer <access_token>` (Supabase Auth). El backend valida el JWT en cada request.
- **Envelope**:

```json
{ "data": {}, "meta": { "page": 1, "per_page": 25, "total": 120, "total_pages": 5 }, "error": null }
{ "data": null, "meta": null, "error": { "code": "PERMISSION_DENIED", "message": "..." } }
```

- **Paginación**: `?page=1&per_page=25` (máx. 100).
- **Filtros comunes**: `?q=` (búsqueda), `?is_active=`, rangos de fecha `?from=&to=` (ISO `YYYY-MM-DD`).
- **Errores**: `400` validación · `401` no autenticado · `403` sin permiso/módulo inactivo · `404` no existe · `409` conflicto (duplicado, stock insuficiente, transición inválida, concurrencia) · `413` payload grande · `429` rate limit · `500` error interno (sin stack).

| Código | Significado |
|---|---|
| `VALIDATION_ERROR` | Datos inválidos / campos obligatorios faltantes |
| `UNAUTHORIZED` | Token ausente o inválido |
| `PERMISSION_DENIED` | Usuario sin el permiso requerido |
| `MODULE_DISABLED` | Módulo desactivado (endpoint bloqueado) |
| `DUPLICATE` | Valor único duplicado (SKU, nombre, RUT…) |
| `FK_VIOLATION` | Operación rompe una relación |
| `STOCK_INSUFFICIENT` | Stock insuficiente para la salida |
| `SALE_UNAVAILABLE` | `SALE` / conversión a venta no disponible en el MVP |
| `INVALID_STATUS` | Estado no permite la operación |
| `INVALID_TRANSITION` | Transición de estado no permitida |
| `MODULE_DEPENDENCY` | No se puede desactivar: otros módulos dependen |
| `PAYLOAD_TOO_LARGE` | Body > 100 KB |
| `RATE_LIMITED` | Demasiadas peticiones |

## Auth

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | — | Login (Supabase). Rate limit 10/min. Body: `{ email, password }` |
| POST | `/auth/logout` | autenticado | Revoca las sesiones del usuario |
| GET | `/auth/me` | autenticado | Usuario + rol + permisos + módulos |

## Productos

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/products` | `products.read` | Listar (q, category_id, is_active, paginación) |
| GET | `/products/:id` | `products.read` | Detalle con nombres de catálogo |
| POST | `/products` | `products.create` | Crear (margen calculado) |
| PUT | `/products/:id` | `products.update` | Actualizar (margen recalculado) |
| DELETE | `/products/:id` | `products.delete` | **Desactivar** (soft delete, nunca elimina) |

Body de producto: `{ sku, name, barcode?, category_id, brand_id?, unit_id, supplier_id?, purchase_price, sale_price, min_stock }`. Precios en enteros CLP.

## Catálogos (categorías, marcas, unidades, proveedores)

Mismo patrón en `/categories`, `/brands`, `/units`, `/suppliers` (módulo products).

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/:name` | `{name}.read` |
| GET | `/:name/:id` | `{name}.read` |
| POST | `/:name` | `{name}.create` |
| PUT | `/:name/:id` | `{name}.update` |
| DELETE | `/:name/:id` | `{name}.delete` (desactiva) |

## Inventario

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/inventory` | `inventory.read` | Stock actual + alertas (`?only_alerts=true`) |
| GET | `/inventory/products/:id/movements` | `inventory.view_history` | Historial/trazabilidad del producto |
| POST | `/inventory/movements` | `inventory.create_movement` | Entrada/salida transaccional |
| POST | `/inventory/adjust` | `inventory.adjust` | Ajuste a stock objetivo |

Body de movimiento: `{ product_id, movement_type, quantity, unit_price?, notes?, reference_type?, reference_id? }`.
Tipos MVP: `PURCHASE` (+), `RETURN` (+), `ADJUSTMENT_IN` (+), `ADJUSTMENT_OUT` (−). `quantity` siempre positiva; el signo lo aplica el backend. `SALE` está reservado (400 en el MVP). Stock nunca negativo (409 `STOCK_INSUFFICIENT` + `CHECK` en BD).

Body de ajuste: `{ product_id, new_stock, notes? }` — genera `ADJUSTMENT_IN`/`ADJUSTMENT_OUT` según la diferencia.

## Clientes

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/customers` | `customers.read` |
| GET | `/customers/:id` | `customers.read` |
| POST | `/customers` | `customers.create` |
| PUT | `/customers/:id` | `customers.update` |
| DELETE | `/customers/:id` | `customers.delete` (desactiva) |

## Cotizaciones

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/quotations` | `quotations.read` | Listar (q, status, customer_id, fechas) + vencimiento lazy |
| GET | `/quotations/:id` | `quotations.read` | Detalle con ítems (snapshots) |
| POST | `/quotations` | `quotations.create` | Crear: numeración atómica + snapshots. **No toca stock** |
| PUT | `/quotations/:id` | `quotations.update` | Editar (solo BORRADOR) |
| POST | `/quotations/:id/status` | `quotations.update` | Transición de estado |
| DELETE | `/quotations/:id` | `quotations.delete` | Eliminar (solo BORRADOR) |
| GET | `/quotations/:id/pdf` | `quotations.export_pdf` | PDF (pdfmake, servidor) |

Body de creación: `{ customer_id?, valid_until?, observations?, items: [{ product_id, quantity }] }`.
Estados: `BORRADOR → ENVIADA → ACEPTADA | RECHAZADA`; `VENCIDA` automática (lazy); `CONVERTIDA_A_VENTA` reservada.

## Módulos

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/modules` | `modules.read` |
| PUT | `/modules/:code` | `modules.update` — body `{ is_active }` |

Core no desactivable (400); dependencias activas bloquean la desactivación (409 `MODULE_DEPENDENCY`).

## Configuración

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/config` | `config.read` | business / theme / inventory |
| PUT | `/config` | `config.update` | Actualización parcial (merge por clave) |
| POST | `/storage/logo/presign` | `config.update` | URL firmada para subir el logo (Supabase Storage) |

## Health

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Sin auth — status + uptime (usado por Render) |
