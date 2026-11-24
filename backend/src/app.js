import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createProductRouter } from './routes/productRoutes.js';
import { createOrderRouter } from './routes/orderRoutes.js';
import { createDashboardRouter } from './routes/dashboardRoutes.js';
import defaultProductService, { ProductService } from './services/productService.js';
import defaultOrderService, { OrderService } from './services/orderService.js';

export function createApp(dependencies = {}) {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());

  // Services
  let productService = dependencies.productService;
  let orderService = dependencies.orderService;

  if (dependencies.db) {
    productService = new ProductService(dependencies.db);
    orderService = new OrderService(dependencies.db);
  } else {
    productService = productService || defaultProductService;
    orderService = orderService || defaultOrderService;
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'Commerce Order Console API',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API routers
  app.use('/api', createProductRouter(productService));
  app.use('/api', createOrderRouter(orderService));
  app.use('/api', createDashboardRouter(orderService));

  // 404 Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

const defaultApp = createApp();
export default defaultApp;
