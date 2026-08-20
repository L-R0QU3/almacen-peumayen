export function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`btn btn-${variant} ${className}`} {...props} />;
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="select" {...props}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className="textarea" {...props} />;
}

export function Field({ label, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title || actions ? (
        <div className="card-header">
          {title ? <h2 className="card-title">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const STATUS_BADGES = {
  BORRADOR: 'neutral',
  ENVIADA: 'info',
  ACEPTADA: 'success',
  RECHAZADA: 'danger',
  VENCIDA: 'warning',
  CONVERTIDA_A_VENTA: 'success',
};

export function StatusBadge({ status }) {
  const cls = STATUS_BADGES[status] || 'neutral';
  return <span className={`badge badge-${cls}`}>{status.replaceAll('_', ' ')}</span>;
}

export function Spinner() {
  return (
    <div className="page-loading">
      <div className="spinner" aria-label="Cargando" />
    </div>
  );
}

export function EmptyState({ icon = '📦', message = 'Sin registros' }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p>{message}</p>
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
