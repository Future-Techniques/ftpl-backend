import { Router } from 'express';
import {
    getCareers,
    getCareerBySlug,
    applyJob
} from '../controllers/career.controller.js';
import { uploadResume } from '../middleware/upload.js';
import { publicFormLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/', getCareers);
router.get('/:job_list', getCareerBySlug);
router.post('/:job_list', publicFormLimiter, uploadResume, applyJob);

export default router;
