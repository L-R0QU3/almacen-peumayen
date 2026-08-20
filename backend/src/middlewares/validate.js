import { errors } from '../lib/errors.js';

/**
 * Valida req[source] (default 'body') con un esquema zod.
 * Si es válido, reemplaza req[source] por los datos parseados.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        errors.badRequest('Datos inválidos', result.error.flatten().fieldErrors)
      );
    }
    req[source] = result.data;
    next();
  };
}
