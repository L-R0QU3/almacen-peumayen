import { ah, ok } from '../lib/response.js';
import { getPagination, buildMeta } from '../lib/pagination.js';
import * as service from '../services/catalogService.js';

export function createCatalogController(name) {
  return {
    list: ah(async (req, res) => {
      const { page, perPage, offset } = getPagination(req.query);
      const isActive =
        req.query.is_active === undefined ? undefined : req.query.is_active === 'true';
      const { rows, total } = await service.listCatalog(name, {
        q: req.query.q,
        isActive,
        offset,
        perPage,
      });
      return ok(res, rows, buildMeta(page, perPage, total));
    }),

    get: ah(async (req, res) => {
      return ok(res, await service.getCatalogItem(name, req.params.id));
    }),

    create: ah(async (req, res) => {
      return ok(res, await service.createCatalogItem(name, req.body), null, 201);
    }),

    update: ah(async (req, res) => {
      return ok(res, await service.updateCatalogItem(name, req.params.id, req.body));
    }),

    remove: ah(async (req, res) => {
      return ok(res, await service.deactivateCatalogItem(name, req.params.id));
    }),
  };
}
