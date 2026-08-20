export function getPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(query.per_page, 10) || 25));
  return { page, perPage, offset: (page - 1) * perPage };
}

export function buildMeta(page, perPage, total) {
  return { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) };
}
