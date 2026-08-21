import { Router } from 'express';
import { getConcerns } from '../controllers/concern.controller.js';

const router = Router();

router.get('/', getConcerns);

export default router;
