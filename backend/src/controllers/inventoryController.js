import { ah, ok } from '../lib/response.js';
import { getPagination, buildMeta } from '../lib/pagination.js';
import * as service from '../services/inventoryService.js';

export const listStockController = ah(async (req, res) => {
  const { page, perPage, offset } = getPagination(req.query);
  const { rows, total } = await service.listStock({
    q: req.query.q,
    categoryId: req.query.category_id,
    onlyAlerts: req.query.only_alerts === 'true',
    offset,
    perPage,
  });
  return ok(res, rows, buildMeta(page, perPage, total));
});

export const listMovementsController = ah(async (req, res) => {
  const { page, perPage, offset } = getPagination(req.query);
  const { rows, total } = await service.listMovements(req.params.id, {
    type: req.query.movement_type,
    from: req.query.from,
    to: req.query.to,
    offset,
    perPage,
  });
  return ok(res, rows, buildMeta(page, perPage, total));
});

export const registerMovementController = ah(async (req, res) => {
  const result = await service.registerMovement({
    productId: req.body.product_id,
    movementType: req.body.movement_type,
    quantity: req.body.quantity,
    unitPrice: req.body.unit_price ?? 0,
    notes: req.body.notes,
    referenceType: req.body.reference_type,
    referenceId: req.body.reference_id,
    createdBy: req.auth.userId,
  });
  return ok(res, result, null, 201);
});

export const adjustStockController = ah(async (req, res) => {
  const result = await service.adjustStock({
    productId: req.body.product_id,
    newStock: req.body.new_stock,
    notes: req.body.notes,
    createdBy: req.auth.userId,
  });
  return ok(res, result, null, 201);
});
