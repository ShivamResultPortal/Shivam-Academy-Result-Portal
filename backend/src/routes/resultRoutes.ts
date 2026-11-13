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

const router = Router();

// Public routes (Students and Portal Visitors)
router.get('/', getAllResults);
router.get('/stats/overview', getOverviewStats);
router.get('/:id', getResultById);

// Admin-protected routes (Result Management)
router.post('/', authenticateAdmin, createResult);
router.post('/bulk', authenticateAdmin, bulkImportResults);
router.put('/:id', authenticateAdmin, updateResult);
router.delete('/:id', authenticateAdmin, deleteResult);

export default router;
