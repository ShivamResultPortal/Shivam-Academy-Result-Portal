import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, updateCredentials, getMe } from '../controllers/authController';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { validateBody, loginSchema, updateCredentialsSchema } from '../validators/schemas';

const router = Router();

// Rate limiter for login: max 5 failed attempts per IP per 15 minutes
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again in 15 minutes.',
  },
});

// Public auth endpoints
router.post('/login', loginRateLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);

// Protected admin profile & credential management
router.get('/me', authenticateAdmin, getMe);
router.put(
  '/update-credentials',
  authenticateAdmin,
  validateBody(updateCredentialsSchema),
  updateCredentials
);

export default router;
