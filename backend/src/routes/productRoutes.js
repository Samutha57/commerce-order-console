import { Router } from 'express';
import { getProducts, getProductById, getInventory } from '../controllers/productController.js';

export function createProductRouter(productService) {
  const router = Router();

  router.get('/products', getProducts(productService));
  router.get('/products/:id', getProductById(productService));
  router.get('/inventory', getInventory(productService));

  return router;
}

export default createProductRouter();
