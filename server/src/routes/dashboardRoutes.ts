import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);

router.get('/hospital', requireRole('HOSPITAL_STAFF'), DashboardController.getHospitalMetrics);
router.get('/tpa', requireRole('TPA_MANAGER'), DashboardController.getTPAMetrics);

export default router;

