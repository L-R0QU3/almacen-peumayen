import { supabaseAdmin } from '../lib/supabase.js';
import { errors } from '../lib/errors.js';

const LOGO_PATH = 'logo/logo.png';

/** Genera una URL de subida firmada para el logo (solo ADMIN puede llamarlo). */
export async function presignLogoUpload() {
  const { data, error } = await supabaseAdmin.storage
    .from('company-assets')
    .createSignedUploadUrl(LOGO_PATH);
  if (error) throw errors.internal('No se pudo preparar la subida del logo');
  return { path: LOGO_PATH, signedUrl: data.signedUrl, token: data.token };
}
