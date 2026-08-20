export class AppError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const errors = {
  unauthorized: (msg = 'No autenticado') => new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'Sin permisos para esta operación') => new AppError(403, 'PERMISSION_DENIED', msg),
  moduleDisabled: (module) =>
    new AppError(403, 'MODULE_DISABLED', `El módulo "${module}" está desactivado`),
  notFound: (msg = 'Recurso no encontrado') => new AppError(404, 'NOT_FOUND', msg),
  conflict: (code, msg) => new AppError(409, code, msg),
  badRequest: (msg = 'Solicitud inválida', details) =>
    new AppError(400, 'VALIDATION_ERROR', msg, details),
  internal: (msg = 'Error interno del servidor') => new AppError(500, 'INTERNAL_ERROR', msg),
};
