import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireModule } from '../middlewares/requireModule.js';
import { requirePermission } from '../middlewares/requirePermission.js';
import { validate } from '../middlewares/validate.js';
import { PERMISSIONS } from '../lib/permissions.js';
import { idParamsSchema } from '../schemas/common.js';
import { customerSchema, customerUpdateSchema, customerListQuerySchema } from '../schemas/customer.schema.js';
import {
  listCustomersController,
  getCustomerController,
  createCustomerController,
  updateCustomerController,
  deleteCustomerController,
} from '../controllers/customerController.js';

const router = Router();

router.get(
  '/',
  auth,
  requireModule('customers'),
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  validate(customerListQuerySchema, 'query'),
  listCustomersController
);
router.get(
  '/:id',
  auth,
  requireModule('customers'),
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  validate(idParamsSchema, 'params'),
  getCustomerController
);
router.post(
  '/',
  auth,
  requireModule('customers'),
  requirePermission(PERMISSIONS.CUSTOMERS_CREATE),
  validate(customerSchema),
  createCustomerController
);
router.put(
  '/:id',
  auth,
  requireModule('customers'),
  requirePermission(PERMISSIONS.CUSTOMERS_UPDATE),
  validate(idParamsSchema, 'params'),
  validate(customerUpdateSchema),
  updateCustomerController
);
router.delete(
  '/:id',
  auth,
  requireModule('customers'),
  requirePermission(PERMISSIONS.CUSTOMERS_DELETE),
  validate(idParamsSchema, 'params'),
  deleteCustomerController
);

export default router;
