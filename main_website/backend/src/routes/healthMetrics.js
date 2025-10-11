import express from 'express';
import { 
  addHealthMetrics,
  getLatestHealthMetrics,
  getHealthMetricsHistory,
  updateHealthMetrics
} from '../controllers/healthMetricsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.post('/add', addHealthMetrics); // Made public for now
router.get('/latest/:abhaId', getLatestHealthMetrics);
router.get('/history/:abhaId', getHealthMetricsHistory);
router.put('/update/:metricsId', authenticateToken, updateHealthMetrics);

export default router;
