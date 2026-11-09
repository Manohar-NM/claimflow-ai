import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);

router.get('/recent', AuditController.getRecentActivity);
router.get('/claim/:claimId', AuditController.getLogsByClaim);

export default router;

