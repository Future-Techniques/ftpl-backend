import { query } from '../config/db.js';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import { getImageUrl, getPdfUrl } from '../helpers/serializers.js';
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

async function uploadFileToSupabase(file, folder = 'associates') {
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

// ================= ASSOCIATION CATEGORIES =================

export async function listAssociationCategories(req, res, next) {
    try {
        const { rows: categories } = await query(`
            SELECT ac.*,
                   (SELECT COUNT(*) FROM public.associates a WHERE a.category_id = ac.id) as associate_count
            FROM public.association_categories ac
            ORDER BY COALESCE(ac."order", 9999) ASC, ac.id ASC
        `);

        const formatted = categories.map(c => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            description: c.description,
            order: c.order ?? 0,
            status: c.status ?? 1,
            associate_count: parseInt(c.associate_count || 0),
            created_at: c.created_at,
            updated_at: c.updated_at
        }));

        return res.json({ result: 'success', categories: formatted });
    } catch (err) {
        next(err);
    }
}

export async function getAssociationCategory(req, res, next) {
    try {
        const { id } = req.params;
        const { rows: categories } = await query(
            `SELECT * FROM public.association_categories WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (categories.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Association category not found' });
        }
        return res.json({ result: 'success', category: categories[0] });
    } catch (err) {
        next(err);
    }
}

export async function createAssociationCategory(req, res, next) {
    try {
        const body = req.body || {};
        if (!body.title || body.title.trim() === '') {
            return res.status(400).json({ result: 'error', message: 'Title is required' });
        }

        let slug = body.slug ? slugify(body.slug) : slugify(body.title);
        const { rows: existingSlug } = await query(
            `SELECT id FROM public.association_categories WHERE slug = $1 LIMIT 1`,
            [slug]
        );
        if (existingSlug.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

        const { rows: inserted } = await query(
            `INSERT INTO public.association_categories (
                slug, user_id, title, status, "order", description, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, NOW(), NOW()
            ) RETURNING *`,
            [
                slug,
                req.user?.id ? parseInt(req.user.id) : 1,
                body.title.trim(),
                body.status !== undefined ? parseInt(body.status) : 1,
                body.order !== undefined ? parseInt(body.order) : 0,
                body.description || null
            ]
        );

        return res.status(201).json({
            result: 'success',
            message: 'Association category created successfully',
            category: inserted[0]
        });
    } catch (err) {
        next(err);
    }
}

export async function updateAssociationCategory(req, res, next) {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const { rows: existing } = await query(
            `SELECT * FROM public.association_categories WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Association category not found' });
        }

        const prev = existing[0];
        const title = body.title !== undefined ? body.title.trim() : prev.title;
        let slug = body.slug !== undefined ? slugify(body.slug) : prev.slug;

        if (slug !== prev.slug) {
            const { rows: slugCheck } = await query(
                `SELECT id FROM public.association_categories WHERE slug = $1 AND id != $2 LIMIT 1`,
                [slug, id]
            );
            if (slugCheck.length > 0) {
                slug = `${slug}-${Date.now()}`;
            }
        }

        const { rows: updated } = await query(
            `UPDATE public.association_categories SET
                title = $1,
                slug = $2,
                description = $3,
                status = $4,
                "order" = $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING *`,
            [
                title,
                slug,
                body.description !== undefined ? body.description : prev.description,
                body.status !== undefined ? parseInt(body.status) : prev.status,
                body.order !== undefined ? parseInt(body.order) : prev.order,
                id
            ]
        );

        return res.json({
            result: 'success',
            message: 'Association category updated successfully',
            category: updated[0]
        });
    } catch (err) {
        next(err);
    }
}

export async function deleteAssociationCategory(req, res, next) {
    try {
        const { id } = req.params;

        // Reassign associates with this category to NULL
        await query(`UPDATE public.associates SET category_id = NULL WHERE category_id = $1`, [id]);
        const { rowCount } = await query(`DELETE FROM public.association_categories WHERE id = $1`, [id]);

        if (rowCount === 0) {
            return res.status(404).json({ result: 'error', message: 'Category not found' });
        }

        return res.json({ result: 'success', message: 'Association category deleted successfully' });
    } catch (err) {
        next(err);
    }
}

// ================= ASSOCIATES / PARTNERS =================

export async function listAssociates(req, res, next) {
    try {
        const { search, category_id, status } = req.query;
        let sql = `
            SELECT a.*,
                   ac.title as category_title,
                   ac.slug as category_slug
            FROM public.associates a
            LEFT JOIN public.association_categories ac ON ac.id = a.category_id
            WHERE 1=1
        `;
        const params = [];

        if (search && search.trim() !== '') {
            params.push(`%${search.trim()}%`);
            sql += ` AND (a.title ILIKE $${params.length} OR a.slug ILIKE $${params.length})`;
        }

        if (category_id && category_id !== 'all') {
            params.push(parseInt(category_id));
            sql += ` AND a.category_id = $${params.length}`;
        }

        if (status !== undefined && status !== 'all') {
            params.push(parseInt(status));
            sql += ` AND a.status = $${params.length}`;
        }

        sql += ` ORDER BY COALESCE(a."order", 9999) ASC, a.id ASC`;

        const { rows: associates } = await query(sql, params);

        const formatted = associates.map(a => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            category_id: a.category_id,
            category_title: a.category_title || 'Unassigned',
            category_slug: a.category_slug || null,
            image: a.image ? getImageUrl(a.image, 'associates') : null,
            raw_image: a.image,
            pdf_file: a.pdf_file ? getPdfUrl(a.pdf_file, 'associates') : null,
            raw_pdf: a.pdf_file,
            link: a.link,
            order: a.order ?? 0,
            status: a.status ?? 1,
            created_at: a.created_at,
            updated_at: a.updated_at
        }));

        return res.json({ result: 'success', associates: formatted });
    } catch (err) {
        next(err);
    }
}

export async function getAssociate(req, res, next) {
    try {
        const { id } = req.params;
        const { rows: associates } = await query(
            `SELECT a.*,
                    ac.title as category_title,
                    ac.slug as category_slug
             FROM public.associates a
             LEFT JOIN public.association_categories ac ON ac.id = a.category_id
             WHERE a.id = $1 LIMIT 1`,
            [id]
        );

        if (associates.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Associate not found' });
        }

        const a = associates[0];
        return res.json({
            result: 'success',
            associate: {
                ...a,
                image_url: a.image ? getImageUrl(a.image, 'associates') : null,
                pdf_url: a.pdf_file ? getPdfUrl(a.pdf_file, 'associates') : null
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function createAssociate(req, res, next) {
    try {
        const body = req.body || {};
        if (!body.title || body.title.trim() === '') {
            return res.status(400).json({ result: 'error', message: 'Partner title is required' });
        }

        let slug = body.slug ? slugify(body.slug) : slugify(body.title);
        const { rows: existingSlug } = await query(
            `SELECT id FROM public.associates WHERE slug = $1 LIMIT 1`,
            [slug]
        );
        if (existingSlug.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

        let imageFilename = body.image || null;
        let pdfFilename = body.pdf_file || null;

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                imageFilename = await uploadFileToSupabase(req.files.image[0], 'associates');
            }
            if (req.files.pdf_file && req.files.pdf_file[0]) {
                pdfFilename = await uploadFileToSupabase(req.files.pdf_file[0], 'associates');
            }
        }

        const categoryId = body.category_id ? parseInt(body.category_id) : null;

        const { rows: inserted } = await query(
            `INSERT INTO public.associates (
                slug, user_id, category_id, title, image,
                pdf_file, link, status, "order", created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, NOW(), NOW()
            ) RETURNING *`,
            [
                slug,
                req.user?.id ? parseInt(req.user.id) : 1,
                categoryId,
                body.title.trim(),
                imageFilename,
                pdfFilename,
                body.link || null,
                body.status !== undefined ? parseInt(body.status) : 1,
                body.order !== undefined ? parseInt(body.order) : 0
            ]
        );

        return res.status(201).json({
            result: 'success',
            message: 'Partner associate created successfully',
            associate: inserted[0]
        });
    } catch (err) {
        next(err);
    }
}

export async function updateAssociate(req, res, next) {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const { rows: existing } = await query(
            `SELECT * FROM public.associates WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Associate not found' });
        }

        const prev = existing[0];
        let imageFilename = prev.image;
        let pdfFilename = prev.pdf_file;

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                imageFilename = await uploadFileToSupabase(req.files.image[0], 'associates');
            }
            if (req.files.pdf_file && req.files.pdf_file[0]) {
                pdfFilename = await uploadFileToSupabase(req.files.pdf_file[0], 'associates');
            }
        } else {
            if (body.image !== undefined) imageFilename = body.image || null;
            if (body.pdf_file !== undefined) pdfFilename = body.pdf_file || null;
        }

        const title = body.title !== undefined ? body.title.trim() : prev.title;
        let slug = body.slug !== undefined ? slugify(body.slug) : prev.slug;

        if (slug !== prev.slug) {
            const { rows: slugCheck } = await query(
                `SELECT id FROM public.associates WHERE slug = $1 AND id != $2 LIMIT 1`,
                [slug, id]
            );
            if (slugCheck.length > 0) {
                slug = `${slug}-${Date.now()}`;
            }
        }

        const categoryId = body.category_id !== undefined ? (body.category_id ? parseInt(body.category_id) : null) : prev.category_id;

        const { rows: updated } = await query(
            `UPDATE public.associates SET
                title = $1,
                slug = $2,
                category_id = $3,
                image = $4,
                pdf_file = $5,
                link = $6,
                status = $7,
                "order" = $8,
                updated_at = NOW()
            WHERE id = $9
            RETURNING *`,
            [
                title,
                slug,
                categoryId,
                imageFilename,
                pdfFilename,
                body.link !== undefined ? body.link : prev.link,
                body.status !== undefined ? parseInt(body.status) : prev.status,
                body.order !== undefined ? parseInt(body.order) : prev.order,
                id
            ]
        );

        return res.json({
            result: 'success',
            message: 'Partner associate updated successfully',
            associate: updated[0]
        });
    } catch (err) {
        next(err);
    }
}

export async function toggleAssociateStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { rows: associates } = await query(
            `SELECT id, status FROM public.associates WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (associates.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Associate not found' });
        }

        const newStatus = associates[0].status === 1 ? 0 : 1;
        await query(`UPDATE public.associates SET status = $1, updated_at = NOW() WHERE id = $2`, [newStatus, id]);

        return res.json({
            result: 'success',
            message: `Associate ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
            status: newStatus
        });
    } catch (err) {
        next(err);
    }
}

export async function deleteAssociate(req, res, next) {
    try {
        const { id } = req.params;

        const { rows: existing } = await query(
            `SELECT image, pdf_file FROM public.associates WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Associate not found' });
        }

        const assoc = existing[0];
        const filesToDelete = [assoc.image, assoc.pdf_file]
            .filter(Boolean)
            .map(f => `associates/${f}`);

        if (filesToDelete.length > 0) {
            try {
                await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
            } catch (storageErr) {
                console.warn('Storage cleanup warning on associate delete:', storageErr.message);
            }
        }

        await query(`DELETE FROM public.associates WHERE id = $1`, [id]);

        return res.json({ result: 'success', message: 'Associate deleted successfully' });
    } catch (err) {
        next(err);
    }
}
