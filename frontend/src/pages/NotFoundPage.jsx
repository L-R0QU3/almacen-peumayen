import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui.jsx';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="page-loading" style={{ flexDirection: 'column', gap: '16px' }}>
      <EmptyState icon="🧭" message="Página no encontrada" />
      <button className="btn btn-secondary" onClick={() => navigate('/')}>
        Volver al inicio
      </button>
    </div>
  );
}
