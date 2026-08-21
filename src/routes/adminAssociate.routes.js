import { Router } from 'express';
import {
    listAssociationCategories,
    getAssociationCategory,
    createAssociationCategory,
    updateAssociationCategory,
    deleteAssociationCategory,
    listAssociates,
    getAssociate,
    createAssociate,
    updateAssociate,
    toggleAssociateStatus,
    deleteAssociate
} from '../controllers/adminAssociate.controller.js';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Protect all admin associate operations with JWT Bearer auth
router.use(adminAuthMiddleware);

const associateUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf_file', maxCount: 1 }
]);

// Categories Routes
router.get('/categories', listAssociationCategories);
router.get('/categories/:id', getAssociationCategory);
router.post('/categories', createAssociationCategory);
router.put('/categories/:id', updateAssociationCategory);
router.delete('/categories/:id', deleteAssociationCategory);

// Associates Routes
router.get('/', listAssociates);
router.get('/:id', getAssociate);
router.post('/', associateUpload, createAssociate);
router.put('/:id', associateUpload, updateAssociate);
router.patch('/:id/status', toggleAssociateStatus);
router.delete('/:id', deleteAssociate);

export default router;
