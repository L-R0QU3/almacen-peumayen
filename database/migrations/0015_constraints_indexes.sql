-- 0015: índices adicionales por consulta real
-- Productos
create index products_name_trgm       on public.products using gin (name gin_trgm_ops);
create index products_category_idx    on public.products (category_id);
create index products_is_active_idx   on public.products (is_active) where is_active = true;

-- Movimientos
create index movements_product_created_idx on public.inventory_movements (product_id, created_at desc);
create index movements_type_idx            on public.inventory_movements (movement_type);
create index movements_ref_idx             on public.inventory_movements (reference_type, reference_id);

-- Cotizaciones
create index quotations_customer_idx on public.quotations (customer_id);
create index quotations_status_idx   on public.quotations (status);
create index quotations_issue_idx    on public.quotations (issue_date);
create index qitems_quotation_idx    on public.quotation_items (quotation_id);

-- Clientes
create index customers_name_trgm on public.customers using gin (name gin_trgm_ops);
