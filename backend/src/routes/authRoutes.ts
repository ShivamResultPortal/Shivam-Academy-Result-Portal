import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

// Public login endpoint
router.post('/login', login);

// Protected admin profile endpoint
router.get('/me', authenticateAdmin, getMe);

export default router;
