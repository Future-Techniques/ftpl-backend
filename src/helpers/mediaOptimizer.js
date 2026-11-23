import sharp from 'sharp';
import { randomUUID } from 'crypto';
import path from 'path';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import { query } from '../config/db.js';
import { saveToDiskCache, removeFromDiskCache } from '../routes/media.routes.js';

/**
 * Context-aware compression presets tailored to where each asset is displayed.
 * Enforces:
 * - Logos / Associates <= 400px
 * - Thumbnails / Testimonials / Categories <= 600px
 * - Products / Projects / Blogs <= 1200px
 * - Banners / Hero <= 1600px
 * With withoutEnlargement: true and EXIF stripping (.rotate())
 */
export const FOLDER_PRESETS = {
  banners: { width: 1600, height: 900, quality: 80 },
  products: { width: 1200, height: 1200, quality: 80 },
  categories: { width: 600, height: 600, quality: 80 },
  associates: { width: 400, height: 250, quality: 85 }, // Partner logos
  testimonials: { width: 400, height: 400, quality: 80 }, // Client avatars
  services: { width: 800, height: 600, quality: 80 },
  concerns: { width: 600, height: 400, quality: 80 },
  blogs: { width: 1200, height: 800, quality: 80 },
  features: { width: 400, height: 400, quality: 80 },
  candidates: { width: 400, height: 500, quality: 80 },
  pages: { width: 1200, height: 800, quality: 80 },
  misc: { width: 1200, height: 1200, quality: 80 }
};

/**
 * Compresses and converts any uploaded image to optimized WebP before saving to Supabase Storage.
 * Pre-caches the file directly to local Render SSD disk cache so immediate views bypass Supabase egress.
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
      .rotate() // Auto-orient based on EXIF and strip metadata
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

  // Pre-cache directly on Render local SSD disk cache immediately upon upload
  saveToDiskCache(finalFilename, uploadBuffer);

  return finalFilename;
}

/**
 * Safely removes one or more media files from Supabase Storage and unlinks from disk cache.
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

  // Also purge from local Render SSD disk cache
  for (const p of paths) {
    const filename = p.split('/').pop();
    removeFromDiskCache(filename);
  }
}

/**
 * Comprehensive Orphan Purge Maintenance Routine
 * Scans all database tables and compares against files in Supabase Storage.
 * Removes unreferenced files to enforce 1 GB storage limit.
 */
export async function cleanSupabaseOrphans() {
  console.log('[StorageCleanup] Starting database orphan audit for FutureTek...');
  const activeFilenames = new Set();

  const registerActive = (val) => {
    if (!val || typeof val !== 'string') return;
    const clean = val.trim();
    if (!clean) return;
    // If it's a URL or path, get the basename
    const filename = clean.split('/').pop().split('?')[0];
    if (filename && filename.length > 3) {
      activeFilenames.add(filename);
    }
  };

  try {
    // 1. Products (image, benefit_image, catalogue, additionals)
    const { rows: products } = await query('SELECT image, benefit_image, catalogue, additionals FROM public.products');
    for (const p of products) {
      registerActive(p.image);
      registerActive(p.benefit_image);
      registerActive(p.catalogue);
      if (p.additionals) {
        try {
          const parsed = typeof p.additionals === 'string' ? JSON.parse(p.additionals) : p.additionals;
          if (Array.isArray(parsed)) {
            parsed.forEach(item => registerActive(item.image || item.raw_image));
          }
        } catch {}
      }
    }

    // 2. Categories (image)
    const { rows: categories } = await query('SELECT image FROM public.categories');
    categories.forEach(c => registerActive(c.image));

    // 3. Banners (image)
    const { rows: banners } = await query('SELECT image FROM public.banners');
    banners.forEach(b => registerActive(b.image));

    // 4. Associates (image)
    const { rows: associates } = await query('SELECT image FROM public.associates');
    associates.forEach(a => registerActive(a.image));

    // 5. Services (image)
    const { rows: services } = await query('SELECT image FROM public.services');
    services.forEach(s => registerActive(s.image));

    // 6. Concerns (image)
    const { rows: concerns } = await query('SELECT image FROM public.concerns');
    concerns.forEach(c => registerActive(c.image));

    // 7. Blogs (image)
    const { rows: blogs } = await query('SELECT image FROM public.blogs');
    blogs.forEach(b => registerActive(b.image));

    // 8. Features (image)
    const { rows: features } = await query('SELECT image FROM public.features');
    features.forEach(f => registerActive(f.image));

    // 9. Candidates (resume)
    const { rows: candidates } = await query('SELECT resume FROM public.candidates');
    candidates.forEach(c => registerActive(c.resume));
  } catch (dbErr) {
    console.error('[StorageCleanup] Database query error during orphan scan:', dbErr);
    throw new Error('Database query failed during orphan audit');
  }

  const FOLDERS = ['categories', 'products', 'banners', 'associates', 'services', 'concerns', 'blogs', 'features', 'candidates', 'pages'];
  const auditReport = {
    scannedFolders: FOLDERS,
    activeFilesFound: activeFilenames.size,
    orphansFound: 0,
    purgedCount: 0,
    purgedFiles: [],
    errors: []
  };

  for (const folder of FOLDERS) {
    try {
      const { data: storageFiles, error } = await supabase.storage.from(BUCKET_NAME).list(folder, { limit: 1000 });
      if (error) {
        auditReport.errors.push(`Error listing ${folder}: ${error.message}`);
        continue;
      }

      const orphansInFolder = (storageFiles || [])
        .filter(f => f.name && !f.name.startsWith('.') && !activeFilenames.has(f.name))
        .map(f => `${folder}/${f.name}`);

      if (orphansInFolder.length > 0) {
        auditReport.orphansFound += orphansInFolder.length;
        const { error: removeErr } = await supabase.storage.from(BUCKET_NAME).remove(orphansInFolder);
        if (removeErr) {
          auditReport.errors.push(`Error purging from ${folder}: ${removeErr.message}`);
        } else {
          auditReport.purgedCount += orphansInFolder.length;
          auditReport.purgedFiles.push(...orphansInFolder);
          orphansInFolder.forEach(pathStr => removeFromDiskCache(pathStr.split('/').pop()));
        }
      }
    } catch (err) {
      auditReport.errors.push(`Exception on ${folder}: ${err.message}`);
    }
  }

  console.log('[StorageCleanup] Orphan cleanup complete:', auditReport);
  return auditReport;
}
