import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (active && data.session) {
        try {
          const me = await api.get('/auth/me');
          if (active) setUser(me.data);
        } catch {
          await supabase.auth.signOut();
        }
      }
      if (active) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Credenciales incorrectas');
    const me = await api.get('/auth/me');
    setUser(me.data);
    return me.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // se continúa con el cierre local aunque el backend falle
    }
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const moduleActive = useCallback(
    (code) => user?.modules?.some((m) => m.code === code && m.is_active) ?? false,
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, moduleActive }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
