import { Router } from 'express';
import { QueryController } from '../controllers/queryController.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { createQuerySchema, respondQuerySchema } from '../validators/index.js';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/',
  requireRole('TPA_MANAGER'),
  validateRequest(createQuerySchema),
  QueryController.createQuery
);

router.post(
  '/:id/respond',
  requireRole('HOSPITAL_STAFF'),
  validateRequest(respondQuerySchema),
  QueryController.respondToQuery
);

router.post(
  '/:id/resolve',
  requireRole('TPA_MANAGER'),
  QueryController.resolveQuery
);

router.post(
  '/:id/reopen',
  requireRole('TPA_MANAGER'),
  QueryController.reopenQuery
);

export default router;

