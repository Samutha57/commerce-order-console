import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
} from '../controllers/orderController.js';

export function createOrderRouter(orderService) {
  const router = Router();

  router.post('/orders', createOrder(orderService));
  router.get('/orders', getOrders(orderService));
  router.get('/orders/:id', getOrderById(orderService));
  router.patch('/orders/:id/status', updateOrderStatus(orderService));
  router.post('/orders/:id/cancel', cancelOrder(orderService));

  return router;
}

export default createOrderRouter();
