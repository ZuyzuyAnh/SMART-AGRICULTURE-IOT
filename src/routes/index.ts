import { Router } from 'express';
import authRouter from './auth.routes';
import seasonRouter from './season.routes';
// Import các routes khác

const router = Router();

router.use('/auth', authRouter);
router.use('/seasons', seasonRouter); 
// Thêm các routes khác

export default router;