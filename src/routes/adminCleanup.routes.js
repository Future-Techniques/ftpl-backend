import { Router } from 'express';
import {
    getCleanupSummary,
    searchCleanupData,
    bulkDeleteRecords,
    cleanupOrphansHandler
} from '../controllers/adminCleanup.controller.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';

const router = Router();

// All cleanup routes require authenticated admin access
router.use(adminAuthMiddleware);

router.get('/summary', getCleanupSummary);
router.get('/search', searchCleanupData);
router.post('/delete', bulkDeleteRecords);
router.post('/cleanup-orphans', cleanupOrphansHandler);

export default router;
