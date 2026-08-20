import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireModule } from '../middlewares/requireModule.js';
import { requirePermission } from '../middlewares/requirePermission.js';
import { validate } from '../middlewares/validate.js';
import { PERMISSIONS } from '../lib/permissions.js';
import { idParamsSchema } from '../schemas/common.js';
import {
  quotationCreateSchema,
  quotationUpdateSchema,
  quotationStatusSchema,
  quotationListQuerySchema,
} from '../schemas/quotation.schema.js';
import {
  listQuotationsController,
  getQuotationController,
  createQuotationController,
  updateQuotationController,
  changeStatusController,
  deleteQuotationController,
} from '../controllers/quotationController.js';

const router = Router();

router.get(
  '/',
  auth,
  requireModule('quotations'),
  requirePermission(PERMISSIONS.QUOTATIONS_READ),
  validate(quotationListQuerySchema, 'query'),
  listQuotationsController
);
router.get(
  '/:id',
  auth,
  requireModule('quotations'),
  requirePermission(PERMISSIONS.QUOTATIONS_READ),
  validate(idParamsSchema, 'params'),
  getQuotationController
);
router.post(
  '/',
  auth,
  requireModule('quotations'),
  requirePermission(PERMISSIONS.QUOTATIONS_CREATE),
  validate(quotationCreateSchema),
  createQuotationController
);
router.put(
  '/:id',
  auth,
  requireModule('quotations'),
  requirePermission(PERMISSIONS.QUOTATIONS_UPDATE),
  validate(idParamsSchema, 'params'),
  validate(quotationUpdateSchema),
  updateQuotationController
);
router.post(
  '/:id/status',
  auth,
  requireModule('quotations'),
  requirePermission(PERMISSIONS.QUOTATIONS_UPDATE),
  validate(idParamsSchema, 'params'),
  validate(quotationStatusSchema),
  changeStatusController
);
router.delete(
  '/:id',
  auth,
  requireModule('quotations'),
  requirePermission(PERMISSIONS.QUOTATIONS_DELETE),
  validate(idParamsSchema, 'params'),
  deleteQuotationController
);

export default router;
