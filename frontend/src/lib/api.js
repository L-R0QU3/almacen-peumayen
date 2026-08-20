import axios from 'axios';
import { supabase } from './supabase.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Adjunta el token de Supabase a cada request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

// Respuesta = { data, meta, error } (envelope de la API)
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      supabase.auth.signOut();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    const message = err.response?.data?.error?.message || 'Error inesperado';
    return Promise.reject(new Error(message));
  }
);
