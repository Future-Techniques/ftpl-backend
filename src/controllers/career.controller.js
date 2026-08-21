import { uploadAndOptimizeMedia } from '../helpers/mediaOptimizer.js';
import { query } from '../config/db.js';
import { randomUUID } from 'crypto';
import path from 'path';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import {
    serializeCareers,
    serializeCareerDetail
} from '../helpers/serializers.js';

export async function getCareers(req, res, next) {
    try {
        const { rows: jobs } = await query(
            `SELECT * FROM public."job_lists" WHERE status = 1 ORDER BY "id" DESC`
        );

        const serialized = serializeCareers(jobs);

        return res.json({
            result: 'success',
            careers: serialized
        });
    } catch (err) {
        next(err);
    }
}

export async function getCareerBySlug(req, res, next) {
    try {
        const { job_list: slug } = req.params;

        const { rows: jobs } = await query(
            `SELECT * FROM public."job_lists" WHERE slug = $1 AND status = 1 LIMIT 1`,
            [slug]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                result: 'error',
                message: 'Job not found'
            });
        }

        const serialized = serializeCareerDetail(jobs[0]);

        return res.json({
            result: 'success',
            career: serialized
        });
    } catch (err) {
        next(err);
    }
}

export async function applyJob(req, res, next) {
    try {
        const { job_list: slug } = req.params;

        const { rows: jobs } = await query(
            `SELECT * FROM public."job_lists" WHERE slug = $1 LIMIT 1`,
            [slug]
        );

        if (jobs.length === 0) {
            return res.status(404).json({
                result: 'error',
                message: 'Job not found'
            });
        }

        const job = jobs[0];
        const body = req.body || {};
        const file = req.file;

        const errors = {};

        if (!body.first_name || typeof body.first_name !== 'string' || body.first_name.trim() === '') {
            errors.first_name = ['The first name field is required.'];
        } else if (body.first_name.length > 255) {
            errors.first_name = ['The first name must not be greater than 255 characters.'];
        }

        if (!body.last_name || typeof body.last_name !== 'string' || body.last_name.trim() === '') {
            errors.last_name = ['The last name field is required.'];
        } else if (body.last_name.length > 255) {
            errors.last_name = ['The last name must not be greater than 255 characters.'];
        }

        if (!body.gender || body.gender.trim() === '') {
            errors.gender = ['The gender field is required.'];
        }

        if (!body.date_of_birth || body.date_of_birth.trim() === '') {
            errors.date_of_birth = ['The date of birth field is required.'];
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!body.email || body.email.trim() === '') {
            errors.email = ['The email field is required.'];
        } else if (!emailRegex.test(body.email)) {
            errors.email = ['The email must be a valid email address.'];
        } else if (body.email.length > 255) {
            errors.email = ['The email must not be greater than 255 characters.'];
        }

        if (!body.phone_number || body.phone_number.trim() === '') {
            errors.phone_number = ['The phone number field is required.'];
        } else if (body.phone_number.length > 10) {
            errors.phone_number = ['The phone number must not be greater than 10 characters.'];
        }

        if (!body.permanent_address || body.permanent_address.trim() === '') {
            errors.permanent_address = ['The permanent address field is required.'];
        } else if (body.permanent_address.length > 255) {
            errors.permanent_address = ['The permanent address must not be greater than 255 characters.'];
        }

        if (!body.current_address || body.current_address.trim() === '') {
            errors.current_address = ['The current address field is required.'];
        } else if (body.current_address.length > 255) {
            errors.current_address = ['The current address must not be greater than 255 characters.'];
        }

        if (!body.education || body.education.trim() === '') {
            errors.education = ['The education field is required.'];
        } else if (body.education.length > 255) {
            errors.education = ['The education must not be greater than 255 characters.'];
        }

        if (!body.experience || body.experience.trim() === '') {
            errors.experience = ['The experience field is required.'];
        } else if (body.experience.length > 255) {
            errors.experience = ['The experience must not be greater than 255 characters.'];
        }

        if (!file) {
            errors.resume = ['The resume field is required.'];
        }

        if (!body.about_yourself || body.about_yourself.trim() === '') {
            errors.about_yourself = ['The about yourself field is required.'];
        }

        if (Object.keys(errors).length > 0) {
            return res.json({
                result: 'error',
                message: errors
            });
        }

        const candidateSlug = randomUUID();
        const fullName = `${body.first_name.trim()} ${body.last_name.trim()}`;
        let resumeUrl = null;

        if (file) {
            const ext = path.extname(file.originalname).toLowerCase();
            const fileName = `${randomUUID()}${ext}`;
            const filePath = `candidates/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype || 'application/pdf',
                    upsert: true
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            resumeUrl = publicUrlData.publicUrl;
        }

        await query(
            `INSERT INTO public."candidates" (
                slug, name, gender, date_of_birth, email, phone_number,
                permanent_address, current_address, education, experience,
                post_name, resume, remarks, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
            [
                candidateSlug,
                fullName,
                body.gender,
                body.date_of_birth,
                body.email,
                body.phone_number,
                body.permanent_address,
                body.current_address,
                body.education,
                body.experience,
                job.title,
                resumeUrl,
                body.about_yourself
            ]
        );

        return res.json({
            result: 'success',
            message: 'Successfully applied'
        });
    } catch (err) {
        next(err);
    }
}
