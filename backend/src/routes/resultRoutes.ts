import { Router } from 'express';
import {
  getAllResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
  getOverviewStats,
  bulkImportResults,
} from '../controllers/resultController';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { validateBody, createResultSchema, updateResultSchema } from '../validators/schemas';

const router = Router();

// Public routes (Students and Portal Visitors)
router.get('/', getAllResults);
router.get('/stats/overview', getOverviewStats);
router.get('/:id', getResultById);

// Admin-protected routes (Result Management with Zod Validation)
router.post('/', authenticateAdmin, validateBody(createResultSchema), createResult);
router.post('/bulk', authenticateAdmin, bulkImportResults);
router.put('/:id', authenticateAdmin, validateBody(updateResultSchema), updateResult);
router.delete('/:id', authenticateAdmin, deleteResult);

export default router;
