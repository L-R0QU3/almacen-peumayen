import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Card, Spinner, Alert } from '../components/ui.jsx';

export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/modules');
        if (active) setModules(res.data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function toggle(m) {
    setBusy(m.code);
    setError('');
    try {
      const res = await api.put(`/modules/${m.code}`, { is_active: !m.is_active });
      setModules((list) => list.map((x) => (x.code === res.data.code ? res.data : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="page-title mb-4">Módulos</h1>
      <p className="muted small mb-4">
        Desactivar un módulo no elimina datos: oculta la navegación y bloquea sus endpoints. Los módulos core no se pueden desactivar.
      </p>
      {error ? <Alert>{error}</Alert> : null}

      <Card>
        {modules.map((m) => (
          <div key={m.code} className="list-item">
            <div>
              <div>
                <strong>{m.name}</strong>{' '}
                {m.is_core ? <span className="badge badge-info">Core</span> : null}
                {m.is_active ? (
                  <span className="badge badge-success">Activo</span>
                ) : (
                  <span className="badge badge-neutral">Inactivo</span>
                )}
              </div>
              <div className="small muted">{m.description}</div>
            </div>
            {!m.is_core ? (
              <button
                type="button"
                className={`btn btn-sm ${m.is_active ? 'btn-danger' : 'btn-secondary'}`}
                disabled={busy === m.code}
                onClick={() => toggle(m)}
              >
                {busy === m.code ? '…' : m.is_active ? 'Desactivar' : 'Activar'}
              </button>
            ) : null}
          </div>
        ))}
      </Card>
    </div>
  );
}
