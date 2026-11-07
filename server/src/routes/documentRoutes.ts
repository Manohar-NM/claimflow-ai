import { Router } from 'express';
import { DocumentController } from '../controllers/documentController.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import { upload } from '../services/documentService.js';

const router = Router();

router.use(authenticateJWT);

router.post(
  '/upload',
  requireRole('HOSPITAL_STAFF'),
  upload.single('file'),
  DocumentController.uploadDocument
);

router.get('/:id/file', DocumentController.getDocumentFile);
router.delete('/:id', requireRole('HOSPITAL_STAFF'), DocumentController.deleteDocument);

export default router;
