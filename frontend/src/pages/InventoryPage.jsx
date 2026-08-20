import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatCLP, formatDateTime } from '../lib/format.js';
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

const MOVEMENT_LABELS = {
  PURCHASE: 'Compra',
  RETURN: 'Devolución',
  SALE: 'Venta',
  ADJUSTMENT_IN: 'Ajuste +',
  ADJUSTMENT_OUT: 'Ajuste −',
};

export default function InventoryPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState('');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [movementTarget, setMovementTarget] = useState(null);
  const [movementForm, setMovementForm] = useState({ movement_type: 'PURCHASE', quantity: 1, notes: '' });
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ new_stock: 0, notes: '' });
  const [history, setHistory] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory', {
        params: { q: q || undefined, only_alerts: onlyAlerts || undefined, per_page: 50 },
      });
      setRows(res.data);
      setMeta(res.meta);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [q, onlyAlerts]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitMovement(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/inventory/movements', {
        product_id: movementTarget.id,
        movement_type: movementForm.movement_type,
        quantity: movementForm.quantity,
        notes: movementForm.notes || null,
      });
      setMovementTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitAdjust(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/inventory/adjust', {
        product_id: adjustTarget.id,
        new_stock: adjustForm.new_stock,
        notes: adjustForm.notes || null,
      });
      setAdjustTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(product) {
    setError('');
    try {
      const res = await api.get(`/inventory/products/${product.id}/movements?per_page=50`);
      setHistory({ product, movements: res.data });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="page-title mb-4">Inventario</h1>
      {error ? <Alert>{error}</Alert> : null}

      <Card>
        <div className="row wrap mb-4">
          <div className="search-box grow">
            <span className="search-icon">🔍</span>
            <Input
              placeholder="Buscar producto…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button
            variant={onlyAlerts ? 'primary' : 'secondary'}
            onClick={() => setOnlyAlerts(!onlyAlerts)}
          >
            ⚠️ Solo alertas
          </Button>
        </div>

        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon="📊" message="Sin productos con stock." />
        ) : (
          <>
            <div className="table-wrap d-none-mobile">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <div className="small muted mono">{p.sku}</div>
                      </td>
                      <td className="mono">
                        {p.stock} {p.unit_abbreviation}
                      </td>
                      <td className="mono">{p.min_stock}</td>
                      <td>
                        {p.is_low ? <span className="badge badge-warning">Bajo</span> : <span className="badge badge-success">OK</span>}
                      </td>
                      <td>
                        <div className="row">
                          <Button variant="ghost" className="btn-sm" onClick={() => { setMovementTarget(p); setMovementForm({ movement_type: 'PURCHASE', quantity: 1, notes: '' }); }}>
                            Movimiento
                          </Button>
                          <Button variant="ghost" className="btn-sm" onClick={() => { setAdjustTarget(p); setAdjustForm({ new_stock: p.stock, notes: '' }); }}>
                            Ajustar
                          </Button>
                          <Button variant="ghost" className="btn-sm" onClick={() => openHistory(p)}>
                            Historial
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-none-desktop">
              {rows.map((p) => (
                <div key={p.id} className="list-item" role="button" onClick={() => setMobileDetail(p)}>
                  <div>
                    <strong>{p.name}</strong>
                    <div className="small muted mono">
                      Stock {p.stock} {p.unit_abbreviation} · mín {p.min_stock}
                    </div>
                  </div>
                  <div className="row">
                    {p.is_low ? <span className="badge badge-warning">Bajo</span> : null}
                    <span className="muted">▸</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {meta && meta.total_pages > 1 ? (
          <p className="small muted mt-4">
            {meta.total} productos en stock
          </p>
        ) : null}
      </Card>

      {movementTarget ? (
        <Modal title={`Movimiento — ${movementTarget.name}`} onClose={() => setMovementTarget(null)}>
          <form onSubmit={submitMovement}>
            <Field label="Tipo">
              <Select value={movementForm.movement_type} onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}>
                <option value="PURCHASE">Compra (entrada +)</option>
                <option value="RETURN">Devolución (entrada +)</option>
                <option value="ADJUSTMENT_IN">Ajuste positivo (+)</option>
                <option value="ADJUSTMENT_OUT">Ajuste negativo (−)</option>
              </Select>
            </Field>
            <Field label="Cantidad (positiva)">
              <Input
                type="number"
                min="1"
                required
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
              />
            </Field>
            <Field label="Notas">
              <Input value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} />
            </Field>
            <div className="row between mt-4">
              <Button variant="secondary" type="button" onClick={() => setMovementTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {adjustTarget ? (
        <Modal title={`Ajuste — ${adjustTarget.name}`} onClose={() => setAdjustTarget(null)}>
          <form onSubmit={submitAdjust}>
            <Field label={`Stock actual: ${adjustTarget.stock} ${adjustTarget.unit_abbreviation}`}>
              <Input
                type="number"
                min="0"
                required
                value={adjustForm.new_stock}
                onChange={(e) => setAdjustForm({ ...adjustForm, new_stock: Number(e.target.value) })}
              />
            </Field>
            <Field label="Notas">
              <Input value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} />
            </Field>
            <div className="row between mt-4">
              <Button variant="secondary" type="button" onClick={() => setAdjustTarget(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Ajustar stock'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {history ? (
        <Modal title={`Historial — ${history.product.name}`} onClose={() => setHistory(null)}>
          {history.movements.length === 0 ? (
            <EmptyState icon="🕘" message="Sin movimientos registrados." />
          ) : (
            history.movements.map((m) => (
              <div key={m.id} className="list-item">
                <div>
                  <div>
                    <span className="badge badge-neutral">{MOVEMENT_LABELS[m.movement_type] || m.movement_type}</span>{' '}
                    <strong className="mono">+{m.quantity}</strong>
                  </div>
                  <div className="small muted">{formatDateTime(m.created_at)}</div>
                  {m.notes ? <div className="small muted">{m.notes}</div> : null}
                </div>
                {m.unit_price > 0 ? <span className="small mono">{formatCLP(m.unit_price)}</span> : null}
              </div>
            ))
          )}
        </Modal>
      ) : null}

      {mobileDetail ? (
        <Modal title={mobileDetail.name} onClose={() => setMobileDetail(null)}>
          <div className="row between mb-4">
            <div>
              <div className="mono small muted">{mobileDetail.sku}</div>
              <div className="mono">
                Stock: <strong>{mobileDetail.stock}</strong> {mobileDetail.unit_abbreviation} · mín {mobileDetail.min_stock}
              </div>
            </div>
            {mobileDetail.is_low ? <span className="badge badge-warning">Bajo</span> : null}
          </div>
          <div className="row wrap" style={{ gap: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              className="grow"
              onClick={() => {
                setMovementTarget(mobileDetail);
                setMovementForm({ movement_type: 'PURCHASE', quantity: 1, notes: '' });
                setMobileDetail(null);
              }}
            >
              + Movimiento
            </Button>
            <Button
              variant="secondary"
              className="grow"
              onClick={() => {
                setAdjustTarget(mobileDetail);
                setAdjustForm({ new_stock: mobileDetail.stock, notes: '' });
                setMobileDetail(null);
              }}
            >
              Ajustar
            </Button>
            <Button
              variant="ghost"
              className="grow"
              onClick={() => {
                setMobileDetail(null);
                openHistory(mobileDetail);
              }}
            >
              Historial
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
