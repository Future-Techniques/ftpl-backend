import { Router } from 'express';
import {
    listConcerns,
    getConcern,
    createConcern,
    updateConcern,
    toggleConcernStatus,
    deleteConcern
} from '../controllers/adminConcern.controller.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Protect all admin concern operations with JWT Bearer auth
router.use(adminAuthMiddleware);

router.get('/', listConcerns);
router.get('/:id', getConcern);
router.post('/', upload.single('image'), createConcern);
router.put('/:id', upload.single('image'), updateConcern);
router.patch('/:id/status', toggleConcernStatus);
router.delete('/:id', deleteConcern);

export default router;
