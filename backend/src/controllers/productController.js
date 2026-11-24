import productServiceInstance from '../services/productService.js';

export const getProducts = (productService = productServiceInstance) => (req, res, next) => {
  try {
    const products = productService.getAllProducts();
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = (productService = productServiceInstance) => (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = productService.getProductById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

export const getInventory = (productService = productServiceInstance) => (req, res, next) => {
  try {
    const inventory = productService.getInventory();
    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (err) {
    next(err);
  }
};
