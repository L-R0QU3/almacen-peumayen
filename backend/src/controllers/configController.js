import { z } from 'zod';
import { ah, ok } from '../lib/response.js';
import { getConfig, updateConfig } from '../services/configService.js';
import { errors } from '../lib/errors.js';

const configUpdateSchema = z
  .object({
    business: z
      .object({
        name: z.string().trim().min(1).max(100).optional(),
        rut: z.string().trim().max(20).optional(),
        phone: z.string().trim().max(30).optional(),
        address: z.string().trim().max(200).optional(),
        logo_url: z.string().trim().max(500).optional(),
      })
      .optional(),
    theme: z.object({ mode: z.enum(['light', 'dark', 'system']).optional() }).optional(),
    inventory: z
      .object({ allow_negative_stock: z.boolean().optional() })
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No hay campos para actualizar' });

export const getConfigController = ah(async (req, res) => {
  return ok(res, await getConfig());
});

export const updateConfigController = ah(async (req, res) => {
  const parsed = configUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw errors.badRequest('Datos de configuración inválidos', parsed.error.flatten().fieldErrors);
  }
  return ok(res, await updateConfig(parsed.data));
});
