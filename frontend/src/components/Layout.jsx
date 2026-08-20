import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Button } from './ui.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: '🏠', module: null },
  { to: '/products', label: 'Productos', icon: '📦', module: 'products' },
  { to: '/inventory', label: 'Inventario', icon: '📊', module: 'inventory' },
  { to: '/customers', label: 'Clientes', icon: '👥', module: 'customers' },
  { to: '/quotations', label: 'Cotizaciones', icon: '📄', module: 'quotations' },
];

const MORE_ITEMS = [
  { to: '/config', label: 'Configuración', icon: '⚙️', module: 'config' },
  { to: '/modules', label: 'Módulos', icon: '🧩', module: 'modules' },
];

export default function Layout() {
  const { user, logout, moduleActive } = useAuth();
  const { mode, setTheme } = useTheme();
  const navigate = useNavigate();

  const visibleNav = NAV_ITEMS.filter((i) => !i.module || moduleActive(i.module));

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function cycleTheme() {
    const order = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setTheme(next);
  }

  const navLinks = visibleNav.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => (isActive ? 'active' : '')}
    >
      <span className="nav-icon" aria-hidden="true">
        {item.icon}
      </span>
      {item.label}
    </NavLink>
  ));

  return (
    <div className="layout">
      {/* Sidebar desktop */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          Almacén Peumayen
        </div>
        <nav>{navLinks}</nav>
        <div className="sidebar-footer">
          {MORE_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
          <div className="row between">
            <span className="small muted">{user?.name}</span>
            <div className="row">
              <button className="btn btn-ghost btn-sm" onClick={cycleTheme} title="Cambiar tema">
                {mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '🌗'}
              </button>
              <Button variant="ghost" className="btn-sm" onClick={handleLogout}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="layout-main">
        <header className="layout-header">
          <span className="brand">
            <span className="brand-dot" />
            Almacén Peumayen
          </span>
          <div className="row">
            <button className="btn btn-ghost btn-sm" onClick={cycleTheme} title="Cambiar tema">
              {mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '🌗'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/config')}>
              ⚙️
            </button>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav móvil */}
      <nav className="bottom-nav">{navLinks}</nav>
    </div>
  );
}
