import { ah, ok } from '../lib/response.js';
import { getPagination, buildMeta } from '../lib/pagination.js';
import * as service from '../services/customerService.js';

export const listCustomersController = ah(async (req, res) => {
  const { page, perPage, offset } = getPagination(req.query);
  const isActive = req.query.is_active === undefined ? undefined : req.query.is_active === 'true';
  const { rows, total } = await service.listCustomers({
    q: req.query.q,
    isActive,
    offset,
    perPage,
  });
  return ok(res, rows, buildMeta(page, perPage, total));
});

export const getCustomerController = ah(async (req, res) => {
  return ok(res, await service.getCustomer(req.params.id));
});

export const createCustomerController = ah(async (req, res) => {
  return ok(res, await service.createCustomer(req.body), null, 201);
});

export const updateCustomerController = ah(async (req, res) => {
  return ok(res, await service.updateCustomer(req.params.id, req.body));
});

export const deleteCustomerController = ah(async (req, res) => {
  return ok(res, await service.deactivateCustomer(req.params.id));
});
