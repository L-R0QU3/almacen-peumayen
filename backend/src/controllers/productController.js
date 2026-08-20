import { ah, ok } from '../lib/response.js';
import { getPagination, buildMeta } from '../lib/pagination.js';
import * as service from '../services/productService.js';

export const listProductsController = ah(async (req, res) => {
  const { page, perPage, offset } = getPagination(req.query);
  const isActive =
    req.query.is_active === undefined ? undefined : req.query.is_active === 'true';
  const { rows, total } = await service.listProducts({
    q: req.query.q,
    categoryId: req.query.category_id,
    isActive,
    offset,
    perPage,
  });
  return ok(res, rows, buildMeta(page, perPage, total));
});

export const getProductController = ah(async (req, res) => {
  return ok(res, await service.getProduct(req.params.id));
});

export const createProductController = ah(async (req, res) => {
  const product = await service.createProduct(req.body);
  return ok(res, product, null, 201);
});

export const updateProductController = ah(async (req, res) => {
  return ok(res, await service.updateProduct(req.params.id, req.body));
});

export const deleteProductController = ah(async (req, res) => {
  return ok(res, await service.deactivateProduct(req.params.id));
});
