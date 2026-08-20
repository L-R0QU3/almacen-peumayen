import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireModule } from '../middlewares/requireModule.js';
import { requirePermission } from '../middlewares/requirePermission.js';
import { validate } from '../middlewares/validate.js';
import { PERMISSIONS } from '../lib/permissions.js';
import { idParamsSchema } from '../schemas/common.js';
import { movementSchema, adjustSchema, inventoryListQuerySchema, movementsQuerySchema } from '../schemas/inventory.schema.js';
import {
  listStockController,
  listMovementsController,
  registerMovementController,
  adjustStockController,
} from '../controllers/inventoryController.js';

const router = Router();

router.get(
  '/',
  auth,
  requireModule('inventory'),
  requirePermission(PERMISSIONS.INVENTORY_READ),
  validate(inventoryListQuerySchema, 'query'),
  listStockController
);

router.get(
  '/products/:id/movements',
  auth,
  requireModule('inventory'),
  requirePermission(PERMISSIONS.INVENTORY_VIEW_HISTORY),
  validate(idParamsSchema, 'params'),
  validate(movementsQuerySchema, 'query'),
  listMovementsController
);

router.post(
  '/movements',
  auth,
  requireModule('inventory'),
  requirePermission(PERMISSIONS.INVENTORY_CREATE_MOVEMENT),
  validate(movementSchema),
  registerMovementController
);

router.post(
  '/adjust',
  auth,
  requireModule('inventory'),
  requirePermission(PERMISSIONS.INVENTORY_ADJUST),
  validate(adjustSchema),
  adjustStockController
);

export default router;
