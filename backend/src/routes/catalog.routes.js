import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireModule } from '../middlewares/requireModule.js';
import { requirePermission } from '../middlewares/requirePermission.js';
import { validate } from '../middlewares/validate.js';
import { idParamsSchema } from '../schemas/common.js';
import { catalogSchema, catalogListQuerySchema } from '../schemas/product.schema.js';
import { createCatalogController } from '../controllers/catalogController.js';

/**
 * Fábrica de rutas para catálogos: /categories, /brands, /units, /suppliers.
 * Pertenecen al módulo products; permisos granulares {name}.{action}.
 */
export default function catalogRoutes(name) {
  const router = Router();
  const ctrl = createCatalogController(name);
  const perm = (action) => `${name}.${action}`;

  router.get(
    '/',
    auth,
    requireModule('products'),
    requirePermission(perm('read')),
    validate(catalogListQuerySchema, 'query'),
    ctrl.list
  );
  router.get(
    '/:id',
    auth,
    requireModule('products'),
    requirePermission(perm('read')),
    validate(idParamsSchema, 'params'),
    ctrl.get
  );
  router.post(
    '/',
    auth,
    requireModule('products'),
    requirePermission(perm('create')),
    validate(catalogSchema),
    ctrl.create
  );
  router.put(
    '/:id',
    auth,
    requireModule('products'),
    requirePermission(perm('update')),
    validate(idParamsSchema, 'params'),
    validate(catalogSchema.partial()),
    ctrl.update
  );
  router.delete(
    '/:id',
    auth,
    requireModule('products'),
    requirePermission(perm('delete')),
    validate(idParamsSchema, 'params'),
    ctrl.remove
  );

  return router;
}
