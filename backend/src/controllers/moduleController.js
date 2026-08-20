import { z } from 'zod';
import { ah, ok } from '../lib/response.js';
import { listModules, updateModuleActive } from '../services/moduleService.js';
import { errors } from '../lib/errors.js';

const moduleUpdateSchema = z.object({ is_active: z.boolean() });

const codeParamsSchema = z.object({ code: z.string().trim().min(1).max(50) });

export const listModulesController = ah(async (req, res) => {
  return ok(res, await listModules());
});

export const updateModuleController = ah(async (req, res) => {
  const params = codeParamsSchema.safeParse(req.params);
  if (!params.success) throw errors.badRequest('Código de módulo inválido');
  const body = moduleUpdateSchema.safeParse(req.body);
  if (!body.success) throw errors.badRequest('Datos inválidos', body.error.flatten().fieldErrors);
  return ok(res, await updateModuleActive(params.data.code, body.data.is_active));
});
