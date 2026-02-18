import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export const BUCKET_NAME = 'chat-images';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];

/**
 * Upload a base64 image to Supabase Storage.
 * Returns the public URL of the uploaded image.
 * Max size: 5 MB. Allowed formats: jpg, png, webp.
 */
export async function uploadImage(base64Data: string, folder: string = 'messages'): Promise<string> {
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

  // Use Uint8Array for better compatibility with Supabase client + Node.js 20
  const uint8 = new Uint8Array(buffer);

  // Retry up to 3 times on transient fetch errors
  let lastError: string = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, uint8, { contentType, upsert: false });

    if (!error) {
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
      return data.publicUrl;
    }

    lastError = error.message;
    console.error(`Upload attempt ${attempt}/3 failed: ${error.message}`);

    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error(`Upload failed after 3 attempts: ${lastError}`);
}
