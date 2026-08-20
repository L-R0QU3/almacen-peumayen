/** Respuesta exitosa con envelope estándar: { data, meta, error } */
export function ok(res, data, meta = null, status = 200) {
  return res.status(status).json({ data, meta, error: null });
}

/** Envuelve un handler async para propagar errores a Express */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
