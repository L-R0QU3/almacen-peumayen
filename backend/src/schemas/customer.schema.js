import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  rut: z.string().trim().max(20).optional().nullable().default(null),
  phone: z.string().trim().max(30).optional().nullable().default(null),
  email: z.string().trim().email().optional().nullable().or(z.literal('')),
  address: z.string().trim().max(200).optional().nullable().default(null),
});

export const customerUpdateSchema = customerSchema.partial();

export const customerListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  is_active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});
