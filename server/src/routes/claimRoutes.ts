import { Router } from 'express';
import { ClaimController } from '../controllers/claimController.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import {
  approveClaimSchema,
  createClaimSchema,
  rejectClaimSchema,
  sanctionClaimSchema,
  updateClaimSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', ClaimController.getClaims);
router.get('/:id', ClaimController.getClaimById);

// Hospital Staff actions
router.post(
  '/',
  requireRole('HOSPITAL_STAFF'),
  validateRequest(createClaimSchema),
  ClaimController.createClaim
);

router.put(
  '/:id',
  requireRole('HOSPITAL_STAFF'),
  validateRequest(updateClaimSchema),
  ClaimController.updateClaim
);

router.post(
  '/:id/submit',
  requireRole('HOSPITAL_STAFF'),
  ClaimController.submitClaim
);

// TPA Manager actions
router.post(
  '/:id/review',
  requireRole('TPA_MANAGER'),
  ClaimController.startTPAReview
);

router.post(
  '/:id/approve',
  requireRole('TPA_MANAGER'),
  validateRequest(approveClaimSchema),
  ClaimController.approveClaim
);

router.post(
  '/:id/sanction',
  requireRole('TPA_MANAGER'),
  validateRequest(sanctionClaimSchema),
  ClaimController.sanctionClaim
);

router.post(
  '/:id/settle',
  requireRole('TPA_MANAGER'),
  ClaimController.settleClaim
);

router.post(
  '/:id/reject',
  requireRole('TPA_MANAGER'),
  validateRequest(rejectClaimSchema),
  ClaimController.rejectClaim
);

export default router;
