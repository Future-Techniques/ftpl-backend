import { Router } from 'express';
import {
    listCandidates,
    getCandidate,
    deleteCandidate
} from '../controllers/adminCandidate.controller.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';

const router = Router();

// Protect all admin candidate operations with JWT Bearer auth
router.use(adminAuthMiddleware);

router.get('/', listCandidates);
router.get('/:id', getCandidate);
router.delete('/:id', deleteCandidate);

export default router;
