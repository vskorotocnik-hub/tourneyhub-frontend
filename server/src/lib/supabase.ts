import { createClient } from '@supabase/supabase-js';
import https from 'https';
import { URL } from 'url';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export const BUCKET_NAME = 'chat-images';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];

// Log Supabase config status at startup (no secrets)
console.log(`[Supabase] URL configured: ${supabaseUrl ? 'YES (' + supabaseUrl.substring(0, 30) + '...)' : 'NO — MISSING!'}`);
console.log(`[Supabase] Service key configured: ${supabaseServiceKey ? 'YES' : 'NO — MISSING!'}`);

/** Upload buffer via Node.js https module (bypasses undici/fetch issues) */
function httpsUpload(uploadUrl: string, buffer: Buffer, contentType: string, serviceKey: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(uploadUrl);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'x-upsert': 'false',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode || 0, body }));
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(30000, () => { req.destroy(new Error('Upload timeout 30s')); });
    req.write(buffer);
    req.end();
  });
}

/**
 * Upload a base64 image to Supabase Storage via Node.js https module.
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
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`;

  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await httpsUpload(uploadUrl, buffer, contentType, supabaseServiceKey);
      console.log(`Upload attempt ${attempt}: status=${res.status} body=${res.body.substring(0, 200)}`);

      if (res.status >= 200 && res.status < 300) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
        return publicUrl;
      }

      lastError = `HTTP ${res.status}: ${res.body.substring(0, 300)}`;
      console.error(`Upload attempt ${attempt}/3 failed: ${lastError}`);
    } catch (err: any) {
      lastError = `${err?.code || err?.name || 'Error'}: ${err?.message || err}`;
      console.error(`Upload attempt ${attempt}/3 error: ${lastError}`, err?.code, err?.syscall, err?.hostname);
    }

    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error(`Upload failed after 3 attempts: ${lastError}`);
}
