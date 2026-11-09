import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { manualAIOverrideSchema } from '../validators/index.js';

const router = Router();

router.use(authenticateJWT);

router.post('/extract', AIController.runExtraction);
router.post(
  '/override',
  requireRole('HOSPITAL_STAFF'),
  validateRequest(manualAIOverrideSchema),
  AIController.manualOverride
);

export default router;

