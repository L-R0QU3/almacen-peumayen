import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireModule } from '../middlewares/requireModule.js';
import { requirePermission } from '../middlewares/requirePermission.js';
import { validate } from '../middlewares/validate.js';
import { PERMISSIONS } from '../lib/permissions.js';
import { idParamsSchema } from '../schemas/common.js';
import {
  productCreateSchema,
  productUpdateSchema,
  productListQuerySchema,
} from '../schemas/product.schema.js';
import {
  listProductsController,
  getProductController,
  createProductController,
  updateProductController,
  deleteProductController,
} from '../controllers/productController.js';

const router = Router();

router.get(
  '/',
  auth,
  requireModule('products'),
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  validate(productListQuerySchema, 'query'),
  listProductsController
);
router.get(
  '/:id',
  auth,
  requireModule('products'),
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  validate(idParamsSchema, 'params'),
  getProductController
);
router.post(
  '/',
  auth,
  requireModule('products'),
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  validate(productCreateSchema),
  createProductController
);
router.put(
  '/:id',
  auth,
  requireModule('products'),
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  validate(idParamsSchema, 'params'),
  validate(productUpdateSchema),
  updateProductController
);
router.delete(
  '/:id',
  auth,
  requireModule('products'),
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  validate(idParamsSchema, 'params'),
  deleteProductController
);

export default router;
