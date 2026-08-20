import { z } from 'zod';

export const MOVEMENT_TYPES = ['PURCHASE', 'RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'];
// 'SALE' se reserva para el futuro módulo de ventas (bloqueado en el MVP).

export const movementSchema = z.object({
  product_id: z.string().uuid(),
  movement_type: z.enum(MOVEMENT_TYPES),
  quantity: z.number().int().positive('La cantidad debe ser un número entero positivo'),
  unit_price: z.number().int().min(0).default(0),
  notes: z.string().trim().max(500).optional().nullable().default(null),
  reference_type: z.string().trim().max(50).optional().nullable().default(null),
  reference_id: z.string().uuid().optional().nullable().default(null),
});

export const adjustSchema = z.object({
  product_id: z.string().uuid(),
  new_stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  notes: z.string().trim().max(500).optional().nullable().default(null),
});

export const inventoryListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category_id: z.string().uuid().optional(),
  only_alerts: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

export const movementsQuerySchema = z.object({
  movement_type: z.enum([...MOVEMENT_TYPES, 'SALE']).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});
