import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatCLP } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Spinner, Button, StatusBadge } from '../components/ui.jsx';
import './HomePage.css';

export default function HomePage() {
  const { user, moduleActive } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [inv, prods, quotes] = await Promise.all([
          api.get('/inventory?only_alerts=true&per_page=5'),
          api.get('/products?per_page=1'),
          api.get('/quotations?per_page=3'),
        ]);
        if (!active) return;
        setAlerts(inv.data);
        setRecent(quotes.data);
        setStats({
          products: prods.meta?.total ?? 0,
          lowStock: inv.meta?.total ?? 0,
          quotations: quotes.meta?.total ?? 0,
        });
      } catch {
        // silencioso: el dashboard se muestra parcial
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (!stats) return <Spinner />;

  return (
    <div className="home">
      <h1 className="page-title">Hola, {user?.name} 👋</h1>
      <p className="muted">Resumen de Almacén Peumayen</p>

      <div className="stat-grid">
        <Card className="stat-card" title="Productos">
          <div className="stat-value">{stats.products}</div>
          <Button variant="ghost" className="btn-sm" onClick={() => navigate('/products')}>
            Ver productos →
          </Button>
        </Card>
        <Card className="stat-card" title="Stock bajo">
          <div className="stat-value stat-danger">{stats.lowStock}</div>
          <Button variant="ghost" className="btn-sm" onClick={() => navigate('/inventory')}>
            Ver inventario →
          </Button>
        </Card>
        <Card className="stat-card" title="Cotizaciones">
          <div className="stat-value">{stats.quotations}</div>
          <Button variant="ghost" className="btn-sm" onClick={() => navigate('/quotations')}>
            Ver cotizaciones →
          </Button>
        </Card>
      </div>

      <div className="home-cols">
        <Card title="⚠️ Alertas de stock" className="grow">
          {alerts.length === 0 ? (
            <p className="muted">Sin alertas. Todo el stock está sobre el mínimo. ✅</p>
          ) : (
            alerts.slice(0, 5).map((p) => (
              <div key={p.id} className="list-item">
                <div>
                  <div>{p.name}</div>
                  <div className="small muted">
                    {p.sku} · {p.stock} {p.unit_abbreviation} / mínimo {p.min_stock}
                  </div>
                </div>
                <span className="badge badge-warning">Bajo</span>
              </div>
            ))
          )}
        </Card>

        <Card title="📄 Últimas cotizaciones" className="grow">
          {recent.length === 0 ? (
            <p className="muted">Aún no hay cotizaciones.</p>
          ) : (
            recent.map((q) => (
              <div key={q.id} className="list-item">
                <div>
                  <div className="mono">{q.number}</div>
                  <div className="small muted">{q.customer_name || 'Sin cliente'}</div>
                </div>
                <div className="row">
                  <span className="small mono">{formatCLP(q.total)}</span>
                  <StatusBadge status={q.status} />
                </div>
              </div>
            ))
          )}
          {moduleActive('quotations') ? (
            <Button
              variant="secondary"
              className="btn-block mt-2"
              onClick={() => navigate('/quotations')}
            >
              Nueva cotización
            </Button>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
