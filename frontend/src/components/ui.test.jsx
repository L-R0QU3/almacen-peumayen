import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, StatusBadge, Modal, EmptyState } from './ui.jsx';

describe('Componentes UI', () => {
  it('Button renderiza su texto y variante', () => {
    render(<Button variant="primary">Guardar</Button>);
    const btn = screen.getByRole('button', { name: /guardar/i });
    expect(btn).toHaveClass('btn-primary');
  });

  it('Button respeta disabled', () => {
    render(<Button disabled>Guardar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('StatusBadge muestra el estado legible', () => {
    render(<StatusBadge status="CONVERTIDA_A_VENTA" />);
    expect(screen.getByText('CONVERTIDA A VENTA')).toBeInTheDocument();
  });

  it('Modal renderiza título y contenido', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Nueva cotización" onClose={onClose}>
        <p>Contenido del modal</p>
      </Modal>
    );
    expect(screen.getByText('Nueva cotización')).toBeInTheDocument();
    expect(screen.getByText('Contenido del modal')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('EmptyState muestra el mensaje', () => {
    render(<EmptyState icon="📦" message="Sin registros" />);
    expect(screen.getByText('Sin registros')).toBeInTheDocument();
  });
});
