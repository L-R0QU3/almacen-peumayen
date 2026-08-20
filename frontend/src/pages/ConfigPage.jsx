import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { Button, Card, Field, Input, Select, Spinner, Alert } from '../components/ui.jsx';

export default function ConfigPage() {
  const { mode, setTheme } = useTheme();
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ name: '', rut: '', phone: '', address: '', logo_url: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/config');
        if (!active) return;
        setConfig(res.data);
        setForm({
          name: res.data.business?.name ?? '',
          rut: res.data.business?.rut ?? '',
          phone: res.data.business?.phone ?? '',
          address: res.data.business?.address ?? '',
          logo_url: res.data.business?.logo_url ?? '',
        });
      } catch (err) {
        if (active) setError(err.message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOk('');
    try {
      const res = await api.put('/config', {
        business: {
          name: form.name,
          rut: form.rut,
          phone: form.phone,
          address: form.address,
          logo_url: form.logo_url,
        },
      });
      setConfig(res.data);
      setOk('Configuración guardada');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      // 1. URL firmada (solo ADMIN)
      const presign = await api.post('/storage/logo/presign');
      // 2. Subida directa a Supabase Storage
      const up = await fetch(presign.data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!up.ok) throw new Error('No se pudo subir el logo');
      const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/company-assets/logo/logo.png`;
      setForm((f) => ({ ...f, logo_url: logoUrl }));
      setOk('Logo subido. Guarda la configuración para aplicarlo.');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!config) return <Spinner />;

  return (
    <div>
      <h1 className="page-title mb-4">Configuración</h1>
      {error ? <Alert>{error}</Alert> : null}
      {ok ? <Alert type="success">{ok}</Alert> : null}

      <Card title="Datos del negocio">
        <form onSubmit={handleSave}>
          <Field label="Nombre del negocio">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="row wrap">
            <div className="grow">
              <Field label="RUT">
                <Input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} />
              </Field>
            </div>
            <div className="grow">
              <Field label="Teléfono">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
          </div>
          <Field label="Dirección">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Logo">
            <div className="row wrap">
              <input type="file" accept="image/*" onChange={handleLogo} />
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8 }} />
              ) : null}
            </div>
          </Field>
          <Button type="submit" className="btn-block" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar configuración'}
          </Button>
        </form>
      </Card>

      <Card title="Apariencia" className="mt-4">
        <Field label="Tema">
          <Select value={mode} onChange={(e) => setTheme(e.target.value)}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </Field>
      </Card>

      <Card title="Módulos" className="mt-4">
        <p className="small muted">
          La activación/desactivación de módulos se gestiona en{' '}
          <a href="/modules">Módulos</a>.
        </p>
      </Card>
    </div>
  );
}
