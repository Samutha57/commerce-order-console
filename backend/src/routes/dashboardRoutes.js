import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

export function createDashboardRouter(orderService) {
  const router = Router();

  router.get('/dashboard/stats', getDashboardStats(orderService));

  return router;
}

export default createDashboardRouter();
