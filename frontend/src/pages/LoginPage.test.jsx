import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import LoginPage from './LoginPage.jsx';

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(async () => {}),
    },
  },
}));

vi.mock('../lib/api.js', () => ({
  api: {
    get: vi.fn(async () => ({
      data: { id: 'u1', email: 'a@a.cl', name: 'Admin', role: 'ADMIN', permissions: [], modules: [] },
    })),
    post: vi.fn(async () => ({ data: {} })),
  },
}));

import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText('admin@peumayen.cl'), {
    target: { value: 'a@a.cl' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: '123456' },
  });
  fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
  });

  it('muestra el formulario de ingreso', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('admin@peumayen.cl')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('muestra error cuando las credenciales son inválidas', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ error: { message: 'invalid' } });
    renderLogin();
    fillAndSubmit();
    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument();
  });

  it('inicia sesión y carga el perfil vía /auth/me', async () => {
    renderLogin();
    fillAndSubmit();
    await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@a.cl', password: '123456' }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/me'));
  });
});
