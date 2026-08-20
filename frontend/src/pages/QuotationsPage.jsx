import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatCLP, formatDate, todayISO } from '../lib/format.js';
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
  StatusBadge,
} from '../components/ui.jsx';

export default function QuotationsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState(null);
  const [creating, setCreating] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productQ, setProductQ] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    customer_id: '',
    valid_until: '',
    observations: '',
    items: [],
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations', {
        params: { status: status || undefined, per_page: 25 },
      });
      setRows(res.data);
      setMeta(res.meta);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(q) {
    try {
      const res = await api.get(`/quotations/${q.id}`);
      setDetail(res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openCreate() {
    setError('');
    setCreating(true);
    try {
      const [c, p] = await Promise.all([
        api.get('/customers?per_page=100'),
        api.get('/products?per_page=100'),
      ]);
      setCustomers(c.data);
      setProducts(p.data);
      setQuoteForm({ customer_id: '', valid_until: '', observations: '', items: [] });
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  }

  function addItem(product) {
    setQuoteForm((f) => {
      const existing = f.items.find((i) => i.product_id === product.id);
      if (existing) {
        return {
          ...f,
          items: f.items.map((i) =>
            i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...f, items: [...f.items, { product_id: product.id, quantity: 1, product }] };
    });
  }

  function removeItem(productId) {
    setQuoteForm((f) => ({ ...f, items: f.items.filter((i) => i.product_id !== productId) }));
  }

  const subtotal = quoteForm.items.reduce((s, i) => s + i.quantity * i.product.sale_price, 0);

  async function submitCreate(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await api.post('/quotations', {
        customer_id: quoteForm.customer_id || null,
        valid_until: quoteForm.valid_until || null,
        observations: quoteForm.observations || null,
        items: quoteForm.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      setCreating(false);
      await load();
      setDetail(created.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(q, next) {
    try {
      await api.post(`/quotations/${q.id}/status`, { status: next });
      setDetail(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(q) {
    if (!window.confirm(`¿Eliminar la cotización ${q.number}? (solo borradores)`)) return;
    try {
      await api.delete(`/quotations/${q.id}`);
      setDetail(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function downloadPdf(q) {
    try {
      const res = await api.get(`/quotations/${q.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${q.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      !productQ ||
      p.name.toLowerCase().includes(productQ.toLowerCase()) ||
      p.sku.toLowerCase().includes(productQ.toLowerCase())
  );

  return (
    <div>
      <div className="row between wrap mb-4">
        <h1 className="page-title">Cotizaciones</h1>
        <Button onClick={openCreate}>+ Nueva cotización</Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <Card>
        <div className="row wrap mb-4">
          <Select className="grow" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="ENVIADA">Enviada</option>
            <option value="ACEPTADA">Aceptada</option>
            <option value="RECHAZADA">Rechazada</option>
            <option value="VENCIDA">Vencida</option>
          </Select>
        </div>

        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon="📄" message="No hay cotizaciones. Crea la primera." />
        ) : (
          rows.map((q) => (
            <div key={q.id} className="list-item" role="button" onClick={() => openDetail(q)}>
              <div>
                <div className="mono">
                  <strong>{q.number}</strong>
                </div>
                <div className="small muted">
                  {q.customer_name || 'Sin cliente'} · {formatDate(q.issue_date)} · {q.items_count} ítems
                </div>
              </div>
              <div className="row">
                <span className="small mono">{formatCLP(q.total)}</span>
                <StatusBadge status={q.status} />
              </div>
            </div>
          ))
        )}
        {meta && meta.total_pages > 1 ? <p className="small muted mt-4">{meta.total} cotizaciones</p> : null}
      </Card>

      {creating ? (
        <Modal title="Nueva cotización" onClose={() => setCreating(false)}>
          <form onSubmit={submitCreate}>
            <Field label="Cliente (opcional)">
              <Select value={quoteForm.customer_id} onChange={(e) => setQuoteForm({ ...quoteForm, customer_id: e.target.value })}>
                <option value="">Sin cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Vigencia (opcional)">
              <Input
                type="date"
                min={todayISO()}
                value={quoteForm.valid_until}
                onChange={(e) => setQuoteForm({ ...quoteForm, valid_until: e.target.value })}
              />
            </Field>

            <Field label="Agregar productos">
              <Input
                placeholder="Buscar por nombre o SKU…"
                value={productQ}
                onChange={(e) => setProductQ(e.target.value)}
              />
            </Field>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
              {filteredProducts.slice(0, 30).map((p) => (
                <div key={p.id} className="list-item" style={{ padding: '8px 12px' }}>
                  <div>
                    <div className="small">{p.name}</div>
                    <div className="small muted mono">{p.sku} · {formatCLP(p.sale_price)}</div>
                  </div>
                  <Button variant="secondary" className="btn-sm" onClick={() => addItem(p)}>
                    +
                  </Button>
                </div>
              ))}
            </div>

            {quoteForm.items.length > 0 ? (
              <div className="mt-4">
                <strong className="small">Ítems de la cotización</strong>
                {quoteForm.items.map((i) => (
                  <div key={i.product_id} className="list-item">
                    <div className="grow">
                      <div className="small">{i.product.name}</div>
                      <div className="small muted">
                        {i.quantity} × {formatCLP(i.product.sale_price)}
                      </div>
                    </div>
                    <span className="small mono">{formatCLP(i.quantity * i.product.sale_price)}</span>
                    <Button variant="danger" className="btn-sm" onClick={() => removeItem(i.product_id)}>
                      ✕
                    </Button>
                  </div>
                ))}
                <div className="row between mt-2">
                  <strong>Total</strong>
                  <strong className="mono">{formatCLP(subtotal)}</strong>
                </div>
              </div>
            ) : null}

            <Field label="Observaciones" className="mt-4">
              <Input
                value={quoteForm.observations}
                onChange={(e) => setQuoteForm({ ...quoteForm, observations: e.target.value })}
                placeholder="Notas para el cliente (opcional)"
              />
            </Field>

            <div className="row between mt-4">
              <Button variant="secondary" type="button" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy || quoteForm.items.length === 0}>
                {busy ? 'Creando…' : 'Crear cotización'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {detail ? (
        <Modal title={detail.number} onClose={() => setDetail(null)}>
          <div className="row between">
            <StatusBadge status={detail.status} />
            <span className="small muted">Emitida: {formatDate(detail.issue_date)}</span>
          </div>
          <p className="small muted">
            {detail.customer_name || 'Sin cliente'}
            {detail.valid_until ? ` · Vigencia: ${formatDate(detail.valid_until)}` : ''}
          </p>
          {detail.observations ? <p className="small">{detail.observations}</p> : null}

          {detail.items.map((it) => (
            <div key={it.id} className="list-item">
              <div>
                <div className="small">{it.product_name}</div>
                <div className="small muted mono">{it.sku}</div>
              </div>
              <div className="small mono">
                {it.quantity} × {formatCLP(it.unit_price)} = {formatCLP(it.subtotal)}
              </div>
            </div>
          ))}
          <div className="row between mt-2">
            <strong>Total</strong>
            <strong className="mono">{formatCLP(detail.total)}</strong>
          </div>

          <div className="row wrap mt-4">
            {detail.status === 'BORRADOR' ? (
              <Button onClick={() => changeStatus(detail, 'ENVIADA')}>Enviar</Button>
            ) : null}
            {detail.status === 'ENVIADA' ? (
              <>
                <Button onClick={() => changeStatus(detail, 'ACEPTADA')}>Aceptar</Button>
                <Button variant="danger" onClick={() => changeStatus(detail, 'RECHAZADA')}>
                  Rechazar
                </Button>
              </>
            ) : null}
            <Button variant="secondary" onClick={() => downloadPdf(detail)}>
              ⬇ PDF
            </Button>
            {detail.status === 'BORRADOR' ? (
              <Button variant="danger" onClick={() => handleDelete(detail)}>
                Eliminar borrador
              </Button>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
