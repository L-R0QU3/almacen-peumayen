import { ah, ok } from '../lib/response.js';
import { getPagination, buildMeta } from '../lib/pagination.js';
import * as service from '../services/quotationService.js';
import { getConfig } from '../services/configService.js';
import { buildQuotationPdf } from '../services/pdfService.js';

export const listQuotationsController = ah(async (req, res) => {
  const { page, perPage, offset } = getPagination(req.query);
  const { rows, total } = await service.listQuotations({
    q: req.query.q,
    status: req.query.status,
    customerId: req.query.customer_id,
    from: req.query.from,
    to: req.query.to,
    offset,
    perPage,
  });
  return ok(res, rows, buildMeta(page, perPage, total));
});

export const getQuotationController = ah(async (req, res) => {
  return ok(res, await service.getQuotation(req.params.id));
});

export const createQuotationController = ah(async (req, res) => {
  const quotation = await service.createQuotation({
    customerId: req.body.customer_id,
    validUntil: req.body.valid_until,
    observations: req.body.observations,
    items: req.body.items,
    createdBy: req.auth.userId,
  });
  return ok(res, quotation, null, 201);
});

export const updateQuotationController = ah(async (req, res) => {
  return ok(
    res,
    await service.updateQuotation(req.params.id, {
      customerId: req.body.customer_id,
      validUntil: req.body.valid_until,
      observations: req.body.observations,
      items: req.body.items,
    })
  );
});

export const changeStatusController = ah(async (req, res) => {
  return ok(
    res,
    await service.changeStatus(req.params.id, req.body.status, req.auth.userId)
  );
});

export const deleteQuotationController = ah(async (req, res) => {
  return ok(res, await service.deleteQuotation(req.params.id));
});

export const quotationPdfController = ah(async (req, res) => {
  const quotation = await service.getQuotation(req.params.id);
  const config = await getConfig();
  const pdf = await buildQuotationPdf({
    quotation,
    items: quotation.items,
    business: config.business || {},
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${quotation.number}.pdf"`);
  return res.send(pdf);
});
