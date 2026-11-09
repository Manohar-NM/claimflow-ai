import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { loginSchema } from '../validators/index.js';

const router = Router();

// Rate limit login endpoint to protect against brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validateRequest(loginSchema), AuthController.login);
router.get('/me', authenticateJWT, AuthController.me);
router.get('/demo-accounts', AuthController.getDemoAccounts);

export default router;

