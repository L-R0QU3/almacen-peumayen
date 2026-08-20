import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatCLP } from '../lib/format.js';
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Modal,
  Spinner,
  EmptyState,
  Alert,
} from '../components/ui.jsx';

const EMPTY_FORM = {
  sku: '',
  name: '',
  barcode: '',
  category_id: '',
  brand_id: '',
  unit_id: '',
  supplier_id: '',
  purchase_price: 0,
  sale_price: 0,
  min_stock: 0,
};

export default function ProductsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [catalogs, setCatalogs] = useState({ categories: [], brands: [], units: [], suppliers: [] });
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: { q: q || undefined, page, per_page: 25 },
      });
      setRows(res.data);
      setMeta(res.meta);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [c, b, u, s] = await Promise.all([
        api.get('/categories?per_page=100'),
        api.get('/brands?per_page=100'),
        api.get('/units?per_page=100'),
        api.get('/suppliers?per_page=100'),
      ]);
      if (active) setCatalogs({ categories: c.data, brands: b.data, units: u.data, suppliers: s.data });
    })();
    return () => {
      active = false;
    };
  }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing('new');
  }

  function openEdit(product) {
    setForm({
      sku: product.sku,
      name: product.name,
      barcode: product.barcode ?? '',
      category_id: product.category_id,
      brand_id: product.brand_id ?? '',
      unit_id: product.unit_id,
      supplier_id: product.supplier_id ?? '',
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      min_stock: product.min_stock,
    });
    setEditing(product);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        category_id: form.category_id || undefined,
        brand_id: form.brand_id || null,
        unit_id: form.unit_id || undefined,
        supplier_id: form.supplier_id || null,
        barcode: form.barcode || null,
      };
      if (editing === 'new') {
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${editing.id}`, payload);
      }
      setEditing(null);
      await load(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(product) {
    if (!window.confirm(`¿Desactivar el producto "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      await load(1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="row between wrap mb-4">
        <h1 className="page-title">Productos</h1>
        <Button onClick={openNew}>+ Nuevo producto</Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <Card>
        <div className="search-box mb-4">
          <span className="search-icon">🔍</span>
          <Input
            placeholder="Buscar por nombre, SKU o código de barras…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon="📦" message="No hay productos. Crea el primero." />
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="table-wrap d-none-mobile">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Precio venta</th>
                    <th>Margen</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <div className="small muted">{p.barcode || ''}</div>
                      </td>
                      <td className="mono">{p.sku}</td>
                      <td>{p.category_name}</td>
                      <td>
                        {p.stock} {p.unit_abbreviation}
                      </td>
                      <td className="mono">{formatCLP(p.sale_price)}</td>
                      <td className="mono">{p.margin_pct}%</td>
                      <td>
                        <div className="row">
                          <Button variant="ghost" className="btn-sm" onClick={() => openEdit(p)}>
                            Editar
                          </Button>
                          <Button variant="danger" className="btn-sm" onClick={() => handleDeactivate(p)}>
                            Desactivar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lista compacta móvil */}
            <div className="d-none-desktop">
              {rows.map((p) => (
                <div key={p.id} className="list-item">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="small muted mono">
                      {p.sku} · {p.stock} {p.unit_abbreviation} · {formatCLP(p.sale_price)}
                    </div>
                  </div>
                  <Button variant="ghost" className="btn-sm" onClick={() => openEdit(p)}>
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {meta && meta.total_pages > 1 ? (
          <div className="row between mt-4">
            <Button variant="secondary" className="btn-sm" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>
              ← Anterior
            </Button>
            <span className="small muted">
              Página {meta.page} de {meta.total_pages} · {meta.total} productos
            </span>
            <Button variant="secondary" className="btn-sm" disabled={meta.page >= meta.total_pages} onClick={() => load(meta.page + 1)}>
              Siguiente →
            </Button>
          </div>
        ) : null}
      </Card>

      {editing ? (
        <Modal title={editing === 'new' ? 'Nuevo producto' : `Editar: ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave}>
            <Field label="Nombre *">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="SKU *">
              <Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
            <Field label="Código de barras">
              <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Opcional (MVP: solo dato)" />
            </Field>
            <div className="row wrap">
              <div className="grow">
                <Field label="Categoría *">
                  <Select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Seleccionar…</option>
                    {catalogs.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grow">
                <Field label="Marca">
                  <Select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                    <option value="">Sin marca</option>
                    {catalogs.brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
            <div className="row wrap">
              <div className="grow">
                <Field label="Unidad *">
                  <Select required value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
                    <option value="">Seleccionar…</option>
                    {catalogs.units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grow">
                <Field label="Proveedor">
                  <Select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                    <option value="">Sin proveedor</option>
                    {catalogs.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
            <div className="row wrap">
              <div className="grow">
                <Field label="Precio compra (CLP)">
                  <Input type="number" min="0" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="grow">
                <Field label="Precio venta (CLP)">
                  <Input type="number" min="0" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })} />
                </Field>
              </div>
            </div>
            <Field label="Stock mínimo">
              <Input type="number" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} />
            </Field>
            <div className="row between mt-4">
              <Button variant="secondary" type="button" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
