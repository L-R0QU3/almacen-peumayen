import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../schemas/auth.schema.js';
import {
  loginController,
  logoutController,
  meController,
} from '../controllers/authController.js';

const router = Router();

// Login con rate limit específico (10 intentos/minuto por IP)
router.post(
  '/login',
  rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false }),
  validate(loginSchema),
  loginController
);

router.post('/logout', auth, logoutController);
router.get('/me', auth, meController);

export default router;
