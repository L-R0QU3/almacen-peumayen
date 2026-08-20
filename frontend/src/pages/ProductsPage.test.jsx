import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductsPage from './ProductsPage.jsx';

vi.mock('../lib/api.js', () => ({
  api: {
    get: vi.fn(async () => ({ data: [], meta: { page: 1, per_page: 25, total: 0, total_pages: 0 } })),
    post: vi.fn(async () => ({ data: {} })),
    put: vi.fn(async () => ({ data: {} })),
    delete: vi.fn(async () => ({ data: {} })),
  },
}));

describe('ProductsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el estado vacío cuando no hay productos', async () => {
    render(<ProductsPage />);
    expect(await screen.findByText('No hay productos. Crea el primero.')).toBeInTheDocument();
  });

  it('abre el modal de nuevo producto', async () => {
    render(<ProductsPage />);
    await screen.findByText('No hay productos. Crea el primero.');

    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nuevo producto')).toBeInTheDocument();
    expect(screen.getByLabelText('SKU *')).toBeInTheDocument();
  });
});
