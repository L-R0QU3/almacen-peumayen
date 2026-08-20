import { z } from 'zod';

export const idParamsSchema = z.object({ id: z.string().uuid() });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

export const booleanQuerySchema = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));
