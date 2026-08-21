import { Router } from 'express';
import {
    getAssociates,
    getAssociateList
} from '../controllers/associate.controller.js';

const router = Router();

// Order matters: 'list' must come before any parameter patterns if any
router.get('/list', getAssociateList);
router.get('/', getAssociates);

export default router;
