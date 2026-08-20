import { z } from 'zod';

export const QUOTATION_STATUSES = [
  'BORRADOR',
  'ENVIADA',
  'ACEPTADA',
  'RECHAZADA',
  'VENCIDA',
  'CONVERTIDA_A_VENTA',
];

export const quotationItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive('La cantidad debe ser un número entero positivo'),
});

export const quotationCreateSchema = z.object({
  customer_id: z.string().uuid().optional().nullable().default(null),
  valid_until: z.string().date().optional().nullable().default(null),
  observations: z.string().trim().max(2000).optional().nullable().default(null),
  items: z.array(quotationItemSchema).min(1, 'La cotización debe tener al menos un ítem').max(200),
});

export const quotationUpdateSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  valid_until: z.string().date().optional().nullable(),
  observations: z.string().trim().max(2000).optional().nullable(),
  items: z.array(quotationItemSchema).min(1).max(200).optional(),
});

export const quotationStatusSchema = z.object({
  status: z.enum(QUOTATION_STATUSES),
});

export const quotationListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(QUOTATION_STATUSES).optional(),
  customer_id: z.string().uuid().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});
