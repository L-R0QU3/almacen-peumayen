import { z } from 'zod';

export const productCreateSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  barcode: z.string().trim().max(50).optional().nullable().default(null),
  category_id: z.string().uuid(),
  brand_id: z.string().uuid().optional().nullable().default(null),
  unit_id: z.string().uuid(),
  supplier_id: z.string().uuid().optional().nullable().default(null),
  purchase_price: z.number().int().min(0).default(0),
  sale_price: z.number().int().min(0).default(0),
  min_stock: z.number().int().min(0).default(0),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category_id: z.string().uuid().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});

export const catalogSchema = z.object({
  name: z.string().trim().min(1).max(100),
  abbreviation: z.string().trim().max(10).optional(),
  rut: z.string().trim().max(20).optional(),
  contact_name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  address: z.string().trim().max(200).optional(),
});

export const catalogListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  is_active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().optional(),
  per_page: z.coerce.number().int().positive().max(100).optional(),
});
