import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { supabase, BUCKET_NAME } from '../config/supabase.js';

const router = Router();

// Local disk cache directory in OS temporary space (persistent across requests in the container)
const CACHE_DIR = path.join(os.tmpdir(), 'ftpl-media-cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// In-memory registry to remember which folder owns each filename (avoids multi-folder scan penalty)
const folderLocationCache = new Map();

const FOLDERS_TO_SEARCH = [
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
  pdf: 'application/pdf'
};

function getMime(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

function getFromDiskCache(filename) {
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

function saveToDiskCache(filename, buffer) {
  const cachePath = path.join(CACHE_DIR, filename);
  try {
    fs.writeFileSync(cachePath, buffer);
  } catch (err) {
    console.warn('[DISK CACHE WRITE WARNING]', err.message);
  }
}

function serveMediaResponse(req, res, filename, buffer, cacheHit = false) {
  const etag = `"${filename}"`;
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
 * Universal safe document/media streamer
 * Hides Supabase bucket URLs completely from the client
 * URL: /api/media/document/:filename
 */
router.get('/document/:filename', async (req, res) => {
  const { filename } = req.params;
  const targetFolder = req.query.folder;

  if (!filename || filename === 'null' || filename === 'undefined') {
    return res.status(404).send('Document not found');
  }

  // 1. Check local disk cache first (bypasses Supabase completely)
  const cached = getFromDiskCache(filename);
  if (cached) {
    return serveMediaResponse(req, res, filename, cached, true);
  }

  // 2. Determine search priority: target folder -> known cached folder -> rest
  const knownFolder = folderLocationCache.get(filename);
  const searchList = targetFolder
    ? [targetFolder, ...FOLDERS_TO_SEARCH]
    : knownFolder
    ? [knownFolder, ...FOLDERS_TO_SEARCH]
    : FOLDERS_TO_SEARCH;

  for (const folder of searchList) {
    const fullPath = `${folder}/${filename}`;
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(fullPath);
      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        saveToDiskCache(filename, buffer);
        folderLocationCache.set(filename, folder);
        return serveMediaResponse(req, res, filename, buffer, false);
      }
    } catch {
      // continue searching other folders
    }
  }

  // 3. Fallback: try root level of the bucket
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filename);
    if (!error && data) {
      const buffer = Buffer.from(await data.arrayBuffer());
      saveToDiskCache(filename, buffer);
      return serveMediaResponse(req, res, filename, buffer, false);
    }
  } catch {
    // ignore
  }

  return res.status(404).send(`Document "${filename}" was not found in media storage.`);
});

/**
 * Direct folder media view
 * URL: /api/media/view/:folder/:filename
 */
router.get('/view/:folder/:filename', async (req, res) => {
  const { folder, filename } = req.params;

  if (!filename || filename === 'null' || filename === 'undefined') {
    return res.status(404).send('Media not found');
  }

  // 1. Check local disk cache first (bypasses Supabase completely)
  const cached = getFromDiskCache(filename);
  if (cached) {
    return serveMediaResponse(req, res, filename, cached, true);
  }

  // 2. Fetch from Supabase Storage once and save to local disk
  const fullPath = `${folder}/${filename}`;
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(fullPath);
    if (error || !data) {
      // Fallback search other folders via document streamer
      return res.redirect(`/api/media/document/${filename}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    saveToDiskCache(filename, buffer);
    folderLocationCache.set(filename, folder);
    return serveMediaResponse(req, res, filename, buffer, false);
  } catch {
    return res.redirect(`/api/media/document/${filename}`);
  }
});

export default router;

