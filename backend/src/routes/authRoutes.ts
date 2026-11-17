import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  logout,
  updateCredentials,
  getMe,
  getAllAdmins,
  createAdminUser,
  deleteAdminUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { authenticateAdmin } from '../middleware/authMiddleware';
import {
  validateBody,
  loginSchema,
  updateCredentialsSchema,
  createAdminSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/schemas';

const router = Router();

// Rate limiter for login: max 10 attempts per IP per 15 minutes
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again in 15 minutes.',
  },
});

// Rate limiter for password reset requests: max 5 requests per IP per 15 minutes
export const resetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please wait a few minutes before trying again.',
  },
});

// Public auth endpoints
router.post('/login', loginRateLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);
router.post('/forgot-password', resetRateLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetRateLimiter, validateBody(resetPasswordSchema), resetPassword);

// Protected admin profile & credential management
router.get('/me', authenticateAdmin, getMe);
router.put(
  '/update-credentials',
  authenticateAdmin,
  validateBody(updateCredentialsSchema),
  updateCredentials
);

// Protected Admin Team Management (accessible only to authenticated admins)
router.get('/admins', authenticateAdmin, getAllAdmins);
router.post('/admins', authenticateAdmin, validateBody(createAdminSchema), createAdminUser);
router.delete('/admins/:id', authenticateAdmin, deleteAdminUser);

export default router;
