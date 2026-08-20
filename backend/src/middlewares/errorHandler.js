import { AppError } from '../lib/errors.js';

/** Manejo central de errores. Nunca expone stack traces en producción. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Errores controlados de la aplicación
  if (err instanceof AppError) {
    return res.status(err.status).json({
      data: null,
      meta: null,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Errores de PostgreSQL comunes
  if (err.code === '23505') {
    return res.status(409).json({
      data: null,
      meta: null,
      error: { code: 'DUPLICATE', message: 'Registro duplicado: ya existe un valor único en uso' },
    });
  }
  if (err.code === '23514') {
    return res.status(409).json({
      data: null,
      meta: null,
      error: { code: 'CONSTRAINT_VIOLATION', message: 'La operación viola una regla de integridad' },
    });
  }
  if (err.code === '23503') {
    return res.status(409).json({
      data: null,
      meta: null,
      error: { code: 'FK_VIOLATION', message: 'La operación viola una relación con otros registros' },
    });
  }
  if (err.code === '23502') {
    return res.status(400).json({
      data: null,
      meta: null,
      error: { code: 'VALIDATION_ERROR', message: 'Faltan campos obligatorios' },
    });
  }
  if (err.code === '40P01' || err.code === '40001') {
    return res.status(409).json({
      data: null,
      meta: null,
      error: { code: 'CONCURRENCY', message: 'Conflicto de concurrencia: reintente la operación' },
    });
  }

  // Log del lado servidor (nunca se expone al cliente)
  console.error(err);
  return res.status(500).json({
    data: null,
    meta: null,
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
  });
}
