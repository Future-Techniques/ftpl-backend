import { query } from '../config/db.js';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import { getImageUrl } from '../helpers/serializers.js';
import { randomUUID } from 'crypto';

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

async function uploadFileToSupabase(file, folder = 'concerns') {
    if (!file) return null;
    const ext = file.originalname.split('.').pop() || 'webp';
    const uniqueFilename = `${randomUUID()}.${ext}`;
    const storagePath = `${folder}/${uniqueFilename}`;

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (error) {
        throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    return uniqueFilename;
}

export async function listConcerns(req, res, next) {
    try {
        const { search, status } = req.query;
        let sql = `SELECT * FROM public.concerns WHERE 1=1`;
        const params = [];

        if (search && search.trim() !== '') {
            params.push(`%${search.trim()}%`);
            sql += ` AND (title ILIKE $${params.length} OR slug ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }

        if (status !== undefined && status !== 'all') {
            params.push(parseInt(status));
            sql += ` AND status = $${params.length}`;
        }

        sql += ` ORDER BY COALESCE("order", 9999) ASC, id ASC`;

        const { rows: concerns } = await query(sql, params);

        const formatted = concerns.map(c => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            image: c.image ? getImageUrl(c.image, 'concerns') : null,
            raw_image: c.image,
            description: c.description,
            link: c.links,
            order: c.order ?? 0,
            status: c.status ?? 1,
            created_at: c.created_at,
            updated_at: c.updated_at
        }));

        return res.json({ result: 'success', concerns: formatted });
    } catch (err) {
        next(err);
    }
}

export async function getConcern(req, res, next) {
    try {
        const { id } = req.params;
        const { rows: concerns } = await query(
            `SELECT * FROM public.concerns WHERE id = $1 LIMIT 1`,
            [id]
        );

        if (concerns.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Sister concern not found' });
        }

        const c = concerns[0];
        return res.json({
            result: 'success',
            concern: {
                ...c,
                link: c.links,
                image_url: c.image ? getImageUrl(c.image, 'concerns') : null
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function createConcern(req, res, next) {
    try {
        const body = req.body || {};
        if (!body.title || body.title.trim() === '') {
            return res.status(400).json({ result: 'error', message: 'Concern title is required' });
        }

        let slug = body.slug ? slugify(body.slug) : slugify(body.title);
        const { rows: existingSlug } = await query(
            `SELECT id FROM public.concerns WHERE slug = $1 LIMIT 1`,
            [slug]
        );
        if (existingSlug.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

        let imageFilename = body.image || null;
        if (req.file) {
            imageFilename = await uploadFileToSupabase(req.file, 'concerns');
        }

        const linkValue = body.link !== undefined ? body.link : (body.links || null);

        const { rows: inserted } = await query(
            `INSERT INTO public.concerns (
                slug, user_id, title, image, description,
                links, status, "order", created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, NOW(), NOW()
            ) RETURNING *`,
            [
                slug,
                req.user?.id ? parseInt(req.user.id) : 1,
                body.title.trim(),
                imageFilename,
                body.description || null,
                linkValue,
                body.status !== undefined ? parseInt(body.status) : 1,
                body.order !== undefined ? parseInt(body.order) : 0
            ]
        );

        return res.status(201).json({
            result: 'success',
            message: 'Sister concern created successfully',
            concern: inserted[0]
        });
    } catch (err) {
        next(err);
    }
}

export async function updateConcern(req, res, next) {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const { rows: existing } = await query(
            `SELECT * FROM public.concerns WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Sister concern not found' });
        }

        const prev = existing[0];
        let imageFilename = prev.image;

        if (req.file) {
            imageFilename = await uploadFileToSupabase(req.file, 'concerns');
        } else if (body.image !== undefined) {
            imageFilename = body.image || null;
        }

        const title = body.title !== undefined ? body.title.trim() : prev.title;
        let slug = body.slug !== undefined ? slugify(body.slug) : prev.slug;

        if (slug !== prev.slug) {
            const { rows: slugCheck } = await query(
                `SELECT id FROM public.concerns WHERE slug = $1 AND id != $2 LIMIT 1`,
                [slug, id]
            );
            if (slugCheck.length > 0) {
                slug = `${slug}-${Date.now()}`;
            }
        }

        const linkValue = body.link !== undefined ? body.link : (body.links !== undefined ? body.links : prev.links);

        const { rows: updated } = await query(
            `UPDATE public.concerns SET
                title = $1,
                slug = $2,
                image = $3,
                description = $4,
                links = $5,
                status = $6,
                "order" = $7,
                updated_at = NOW()
            WHERE id = $8
            RETURNING *`,
            [
                title,
                slug,
                imageFilename,
                body.description !== undefined ? body.description : prev.description,
                linkValue,
                body.status !== undefined ? parseInt(body.status) : prev.status,
                body.order !== undefined ? parseInt(body.order) : prev.order,
                id
            ]
        );

        return res.json({
            result: 'success',
            message: 'Sister concern updated successfully',
            concern: updated[0]
        });
    } catch (err) {
        next(err);
    }
}

export async function toggleConcernStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { rows: concerns } = await query(
            `SELECT id, status FROM public.concerns WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (concerns.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Sister concern not found' });
        }

        const newStatus = concerns[0].status === 1 ? 0 : 1;
        await query(`UPDATE public.concerns SET status = $1, updated_at = NOW() WHERE id = $2`, [newStatus, id]);

        return res.json({
            result: 'success',
            message: `Sister concern ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
            status: newStatus
        });
    } catch (err) {
        next(err);
    }
}

export async function deleteConcern(req, res, next) {
    try {
        const { id } = req.params;

        const { rows: existing } = await query(
            `SELECT image FROM public.concerns WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Sister concern not found' });
        }

        const concern = existing[0];
        if (concern.image) {
            try {
                await supabase.storage.from(BUCKET_NAME).remove([`concerns/${concern.image}`]);
            } catch (storageErr) {
                console.warn('Storage cleanup warning on concern delete:', storageErr.message);
            }
        }

        await query(`DELETE FROM public.concerns WHERE id = $1`, [id]);

        return res.json({ result: 'success', message: 'Sister concern deleted successfully' });
    } catch (err) {
        next(err);
    }
}
