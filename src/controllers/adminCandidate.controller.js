import { query } from '../config/db.js';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import { getPdfUrl } from '../helpers/serializers.js';

export async function listCandidates(req, res, next) {
    try {
        const { search, post_name } = req.query;
        let sql = `SELECT * FROM public.candidates WHERE 1=1`;
        const params = [];

        if (search && search.trim() !== '') {
            params.push(`%${search.trim()}%`);
            sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone_number ILIKE $${params.length} OR post_name ILIKE $${params.length})`;
        }

        if (post_name && post_name !== 'all') {
            params.push(post_name);
            sql += ` AND post_name = $${params.length}`;
        }

        sql += ` ORDER BY id DESC`;

        const { rows: candidates } = await query(sql, params);

        const formatted = candidates.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            email: c.email,
            phone_number: c.phone_number,
            current_address: c.current_address,
            permanent_address: c.permanent_address,
            date_of_birth: c.date_of_birth,
            gender: c.gender,
            post_name: c.post_name,
            education: c.education,
            experience: c.experience,
            resume: c.resume ? (c.resume.startsWith('http') ? c.resume : getPdfUrl(c.resume, 'candidates')) : null,
            raw_resume: c.resume,
            remarks: c.remarks,
            created_at: c.created_at,
            updated_at: c.updated_at
        }));

        return res.json({ result: 'success', candidates: formatted });
    } catch (err) {
        next(err);
    }
}

export async function getCandidate(req, res, next) {
    try {
        const { id } = req.params;
        const { rows: candidates } = await query(
            `SELECT * FROM public.candidates WHERE id = $1 LIMIT 1`,
            [id]
        );

        if (candidates.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Candidate not found' });
        }

        const c = candidates[0];
        return res.json({
            result: 'success',
            candidate: {
                ...c,
                resume_url: c.resume ? (c.resume.startsWith('http') ? c.resume : getPdfUrl(c.resume, 'candidates')) : null
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function deleteCandidate(req, res, next) {
    try {
        const { id } = req.params;

        const { rows: existing } = await query(
            `SELECT resume FROM public.candidates WHERE id = $1 LIMIT 1`,
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ result: 'error', message: 'Candidate not found' });
        }

        const cand = existing[0];
        if (cand.resume) {
            let filename = cand.resume;
            if (filename.includes('/')) {
                filename = filename.split('/').pop();
            }
            try {
                await supabase.storage.from(BUCKET_NAME).remove([`candidates/${filename}`]);
            } catch (storageErr) {
                console.warn('Storage cleanup warning on candidate delete:', storageErr.message);
            }
        }

        await query(`DELETE FROM public.candidates WHERE id = $1`, [id]);

        return res.json({ result: 'success', message: 'Candidate application deleted successfully' });
    } catch (err) {
        next(err);
    }
}
