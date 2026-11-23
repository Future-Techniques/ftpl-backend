import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { supabase, BUCKET_NAME } from '../config/supabase.js';

const router = Router();

// Local disk cache directory in OS temporary space (persistent across requests on Render container SSD)
export const CACHE_DIR = process.env.MEDIA_CACHE_DIR || path.join(os.tmpdir(), 'ftpl-media-cache');
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.warn('[MediaRoutes] Could not create cache directory:', err.message);
  }
}

// In-memory registry to remember which folder owns each filename (avoids multi-folder scan penalty)
export const folderLocationCache = new Map();

export const FOLDERS_TO_SEARCH = [
  'categories',
  'products',
  'banners',
  'associates',
  'services',
  'concerns',
  'blogs',
  'features',
  'candidates',
  'pages'
];

const MIME_MAP = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  pdf: 'application/pdf',
  ico: 'image/x-icon'
};

function getMime(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function generateETag(bufferOrStats) {
  if (Buffer.isBuffer(bufferOrStats)) {
    const hash = crypto.createHash('md5').update(bufferOrStats).digest('hex');
    return `"${bufferOrStats.length.toString(16)}-${hash.substring(0, 16)}"`;
  }
  return `"${bufferOrStats.size.toString(16)}-${Math.floor(bufferOrStats.mtimeMs).toString(16)}"`;
}

export function getFromDiskCache(filename) {
  const cachePath = path.join(CACHE_DIR, filename);
  if (fs.existsSync(cachePath)) {
    try {
      return fs.readFileSync(cachePath);
    } catch {
      return null;
    }
  }
  return null;
}

export function saveToDiskCache(filename, buffer) {
  const cachePath = path.join(CACHE_DIR, filename);
  try {
    fs.writeFileSync(cachePath, buffer);
  } catch (err) {
    console.warn('[DISK CACHE WRITE WARNING]', err.message);
  }
}

export function removeFromDiskCache(filename) {
  const cachePath = path.join(CACHE_DIR, filename);
  if (fs.existsSync(cachePath)) {
    try {
      fs.unlinkSync(cachePath);
    } catch {}
  }
}

function serveMediaResponse(req, res, filename, buffer, cacheHit = false) {
  const etag = generateETag(buffer);
  res.setHeader('Content-Type', getMime(filename));
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', etag);
  res.setHeader('X-Media-Cache', cacheHit ? 'HIT-DISK' : 'MISS-SUPABASE');

  // HTTP 304 conditional revalidation: saves 100% bandwidth on repeat views / soft refresh
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  return res.send(buffer);
}

/**
 * Direct folder / bucket media view
 * URL: /api/media/view/:folder/:filename
 */
router.get('/view/:folder/:filename', async (req, res) => {
  const { folder, filename } = req.params;
  return handleMediaServe(req, res, folder, filename);
});

/**
 * Universal safe document/media streamer
 * URL: /api/media/document/:filename
 */
router.get('/document/:filename', async (req, res) => {
  const { filename } = req.params;
  const targetFolder = req.query.folder || folderLocationCache.get(filename) || 'products';
  return handleMediaServe(req, res, targetFolder, filename, true);
});

/**
 * Standard Supabase Storage Egress Pipeline
 * URL: /api/media/:bucket/:filename
 */
router.get('/:bucket/:filename', async (req, res) => {
  const { bucket, filename } = req.params;
  return handleMediaServe(req, res, bucket, filename);
});

async function handleMediaServe(req, res, folderOrBucket, filename, allowFallback = false) {
  if (!filename || filename === 'null' || filename === 'undefined' || filename.includes('..')) {
    return res.status(404).send('Media not found');
  }

  // 1. FAST PATH: Check local SSD disk cache (Render /tmp/)
  const cached = getFromDiskCache(filename);
  if (cached) {
    return serveMediaResponse(req, res, filename, cached, true);
  }

  // 2. Determine target storage path
  const bucket = BUCKET_NAME || 'futuretek-media';
  const targetFolder = folderOrBucket && folderOrBucket !== bucket ? folderOrBucket : (folderLocationCache.get(filename) || 'products');
  const fullPath = `${targetFolder}/${filename}`;

  try {
    const { data, error } = await supabase.storage.from(bucket).download(fullPath);
    if (!error && data) {
      const buffer = Buffer.from(await data.arrayBuffer());
      saveToDiskCache(filename, buffer);
      folderLocationCache.set(filename, targetFolder);
      return serveMediaResponse(req, res, filename, buffer, false);
    }
  } catch (err) {
    // Continue to fallback if allowed
  }

  // If strict folder lookup failed and allowFallback is true, try known location or root once
  if (allowFallback) {
    const known = folderLocationCache.get(filename);
    const candidateFolders = known ? [known] : FOLDERS_TO_SEARCH.filter(f => f !== targetFolder);
    for (const f of candidateFolders.slice(0, 3)) { // Limit to at most 3 to prevent sequential leaks
      try {
        const { data, error } = await supabase.storage.from(bucket).download(`${f}/${filename}`);
        if (!error && data) {
          const buffer = Buffer.from(await data.arrayBuffer());
          saveToDiskCache(filename, buffer);
          folderLocationCache.set(filename, f);
          return serveMediaResponse(req, res, filename, buffer, false);
        }
      } catch {}
    }
  }

  return res.status(404).send(`Media "${filename}" not found in storage.`);
}

export default router;
