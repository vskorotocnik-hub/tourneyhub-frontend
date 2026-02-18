import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export const BUCKET_NAME = 'chat-images';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];

// Log Supabase config status at startup (no secrets)
console.log(`[Supabase] URL configured: ${supabaseUrl ? 'YES (' + supabaseUrl.substring(0, 30) + '...)' : 'NO — MISSING!'}`);
console.log(`[Supabase] Service key configured: ${supabaseServiceKey ? 'YES' : 'NO — MISSING!'}`);

/**
 * Upload a base64 image to Supabase Storage via direct REST API.
 * Returns the public URL of the uploaded image.
 * Max size: 5 MB. Allowed formats: jpg, png, webp.
 */
export async function uploadImage(base64Data: string, folder: string = 'messages'): Promise<string> {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase не настроен: проверьте SUPABASE_URL и SUPABASE_SERVICE_KEY');
  }

  // Strip data URL prefix: "data:image/png;base64,..."
  const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');

  const format = match[1].toLowerCase();
  if (!ALLOWED_FORMATS.includes(format)) {
    throw new Error(`Формат ${format} не поддерживается. Разрешены: JPG, PNG, WebP`);
  }

  const ext = format === 'jpeg' ? 'jpg' : format;
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Фото слишком большое (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Максимум 5 MB`);
  }

  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const contentType = `image/${match[1]}`;

  // Upload via direct REST API instead of Supabase JS client for reliability
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`;

  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': contentType,
          'x-upsert': 'false',
        },
        body: buffer,
      });

      if (res.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
        return publicUrl;
      }

      const errBody = await res.text().catch(() => 'no body');
      lastError = `HTTP ${res.status}: ${errBody}`;
      console.error(`Upload attempt ${attempt}/3 failed: ${lastError}`);
    } catch (err: any) {
      lastError = `${err?.name || 'Error'}: ${err?.message || err}`;
      console.error(`Upload attempt ${attempt}/3 fetch error: ${lastError}`);
    }

    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error(`Upload failed after 3 attempts: ${lastError}`);
}
