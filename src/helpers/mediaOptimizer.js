import sharp from 'sharp';
import { randomUUID } from 'crypto';
import path from 'path';
import { supabase, BUCKET_NAME } from '../config/supabase.js';

/**
 * Context-aware compression presets tailored to where each asset is displayed.
 * Prevents saving massive 2000px images for small partner logos, avatars, or thumbnails.
 */
export const FOLDER_PRESETS = {
  banners: { width: 1600, height: 900, quality: 76 },
  products: { width: 1000, height: 1000, quality: 78 },
  categories: { width: 800, height: 600, quality: 78 },
  associates: { width: 400, height: 250, quality: 80 }, // Partner logos (Thermax, Alfa Laval)
  testimonials: { width: 250, height: 250, quality: 80 }, // Client avatars
  services: { width: 800, height: 600, quality: 78 },
  concerns: { width: 500, height: 400, quality: 80 },
  blogs: { width: 1000, height: 600, quality: 78 },
  features: { width: 500, height: 500, quality: 80 },
  candidates: { width: 400, height: 500, quality: 80 },
  pages: { width: 1200, height: 800, quality: 78 },
  misc: { width: 1200, height: 1200, quality: 78 }
};

/**
 * Compresses and converts any uploaded image to optimized WebP before saving to Supabase Storage.
 * Uses context-aware presets to drastically reduce file payload and bandwidth egress.
 *
 * @param {Express.Multer.File} file - Multer in-memory file
 * @param {string} folder - Target bucket folder (e.g. 'categories', 'products', 'banners', 'associates', etc.)
 * @returns {Promise<string>} Uploaded unique filename
 */
export async function uploadAndOptimizeMedia(file, folder = 'misc') {
  if (!file || !file.buffer) {
    throw new Error('No valid file buffer provided for upload.');
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  const isImage = mime.startsWith('image/') && ext !== '.svg';
  const isSvg = ext === '.svg' || mime === 'image/svg+xml';
  const isPdf = ext === '.pdf' || mime === 'application/pdf';

  let uploadBuffer = file.buffer;
  let finalFilename = '';
  let contentType = file.mimetype;

  if (isImage) {
    const preset = FOLDER_PRESETS[folder] || FOLDER_PRESETS.misc;
    finalFilename = `${randomUUID()}.webp`;
    contentType = 'image/webp';

    uploadBuffer = await sharp(file.buffer)
      .resize({
        width: preset.width,
        height: preset.height,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: preset.quality,
        effort: 4,
      })
      .toBuffer();
  } else if (isPdf) {
    finalFilename = `${randomUUID()}.pdf`;
    contentType = 'application/pdf';
  } else if (isSvg) {
    finalFilename = `${randomUUID()}.svg`;
    contentType = 'image/svg+xml';
  } else {
    const cleanExt = ext ? ext.replace('.', '') : 'bin';
    finalFilename = `${randomUUID()}.${cleanExt}`;
  }

  const storagePath = `${folder}/${finalFilename}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, uploadBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadErr) {
    throw new Error(`Failed to upload media to storage: ${uploadErr.message}`);
  }

  return finalFilename;
}

/**
 * Safely removes one or more media files from Supabase Storage.
 * Prevents orphan files from accumulating and exceeding the 1 GB storage limit.
 *
 * @param {string|string[]} filePaths - Relative storage paths (e.g. 'products/abc.webp')
 */
export async function deleteStorageMedia(filePaths) {
  if (!filePaths) return;
  const paths = Array.isArray(filePaths)
    ? filePaths.filter(Boolean)
    : [filePaths].filter(Boolean);

  if (paths.length === 0) return;

  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);
    if (error) {
      console.warn('[STORAGE CLEANUP WARNING]', error.message);
    }
  } catch (err) {
    console.warn('[STORAGE CLEANUP EXCEPTION]', err.message);
  }
}

