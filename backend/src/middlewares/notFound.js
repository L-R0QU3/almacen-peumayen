export function notFound(req, res) {
  res.status(404).json({
    data: null,
    meta: null,
    error: { code: 'NOT_FOUND', message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` },
  });
}
