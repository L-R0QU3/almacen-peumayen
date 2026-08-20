import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  Spinner,
  EmptyState,
  Alert,
} from '../components/ui.jsx';

const EMPTY_FORM = { name: '', rut: '', phone: '', email: '', address: '' };

export default function CustomersPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { q: q || undefined, per_page: 50 } });
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
    load();
  }, [load]);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing('new');
  }

  function openEdit(c) {
    setForm({
      name: c.name,
      rut: c.rut ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      address: c.address ?? '',
    });
    setEditing(c);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (editing === 'new') {
        await api.post('/customers', payload);
      } else {
        await api.put(`/customers/${editing.id}`, payload);
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(c) {
    if (!window.confirm(`¿Desactivar al cliente "${c.name}"?`)) return;
    try {
      await api.delete(`/customers/${c.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="row between wrap mb-4">
        <h1 className="page-title">Clientes</h1>
        <Button onClick={openNew}>+ Nuevo cliente</Button>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <Card>
        <div className="search-box mb-4">
          <span className="search-icon">🔍</span>
          <Input placeholder="Buscar por nombre, RUT o teléfono…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon="👥" message="No hay clientes registrados." />
        ) : (
          <>
            <div className="table-wrap d-none-mobile">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>RUT</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td className="mono">{c.rut || '—'}</td>
                      <td>{c.phone || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>
                        <div className="row">
                          <Button variant="ghost" className="btn-sm" onClick={() => openEdit(c)}>Editar</Button>
                          <Button variant="danger" className="btn-sm" onClick={() => handleDeactivate(c)}>Desactivar</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-none-desktop">
              {rows.map((c) => (
                <div key={c.id} className="list-item">
                  <div>
                    <strong>{c.name}</strong>
                    <div className="small muted">{c.rut || c.phone || c.email || ''}</div>
                  </div>
                  <Button variant="ghost" className="btn-sm" onClick={() => openEdit(c)}>Editar</Button>
                </div>
              ))}
            </div>
          </>
        )}
        {meta && meta.total_pages > 1 ? <p className="small muted mt-4">{meta.total} clientes</p> : null}
      </Card>

      {editing ? (
        <Modal title={editing === 'new' ? 'Nuevo cliente' : `Editar: ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave}>
            <Field label="Nombre *">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="RUT">
              <Input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} placeholder="12.345.678-9" />
            </Field>
            <div className="row wrap">
              <div className="grow">
                <Field label="Teléfono">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
              </div>
              <div className="grow">
                <Field label="Email">
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
              </div>
            </div>
            <Field label="Dirección">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <div className="row between mt-4">
              <Button variant="secondary" type="button" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
