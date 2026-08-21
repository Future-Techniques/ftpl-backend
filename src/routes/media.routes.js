import { Router } from 'express';
import { supabase, BUCKET_NAME } from '../config/supabase.js';

const router = Router();

const FOLDERS_TO_SEARCH = [
  'products',
  'associates',
  'categories',
  'services',
  'banners',
  'concerns',
  'blogs',
  'features',
  'pages'
];

/**
 * Universal safe document/media streamer
 * Hides Supabase bucket URLs completely from the client
 * URL: /api/media/document/:filename
 */
router.get('/document/:filename', async (req, res) => {
  const { filename } = req.params;
  const targetFolder = req.query.folder;

  if (!filename) {
    return res.status(400).send('Filename is required');
  }

  const searchList = targetFolder ? [targetFolder, ...FOLDERS_TO_SEARCH] : FOLDERS_TO_SEARCH;

  for (const folder of searchList) {
    const fullPath = `${folder}/${filename}`;
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(fullPath);
      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        const isWebp = filename.toLowerCase().endsWith('.webp');
        const isPng = filename.toLowerCase().endsWith('.png');
        const isJpg = filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg');
        const isSvg = filename.toLowerCase().endsWith('.svg');

        let contentType = 'application/octet-stream';
        if (isPdf) contentType = 'application/pdf';
        else if (isWebp) contentType = 'image/webp';
        else if (isPng) contentType = 'image/png';
        else if (isJpg) contentType = 'image/jpeg';
        else if (isSvg) contentType = 'image/svg+xml';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
    } catch (err) {
      // continue searching other folders
    }
  }

  // Also try root level
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filename);
    if (!error && data) {
      const buffer = Buffer.from(await data.arrayBuffer());
      res.setHeader('Content-Type', filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(buffer);
    }
  } catch (err) {
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
  const fullPath = `${folder}/${filename}`;

  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(fullPath);
    if (error || !data) {
      // Fallback search other folders
      return res.redirect(`/api/media/document/${filename}`);
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    res.setHeader('Content-Type', isPdf ? 'application/pdf' : 'image/webp');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (err) {
    return res.redirect(`/api/media/document/${filename}`);
  }
});

export default router;
