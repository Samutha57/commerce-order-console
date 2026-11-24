import orderServiceInstance from '../services/orderService.js';

export const createOrder = (orderService = orderServiceInstance) => (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items must be a non-empty array'
      });
    }

    const order = orderService.createOrder({ items });
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = (orderService = orderServiceInstance) => (req, res, next) => {
  try {
    const { search, status } = req.query;
    const orders = orderService.getOrders({ search, status });
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = (orderService = orderServiceInstance) => (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = orderService.getOrderById(id);
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = (orderService = orderServiceInstance) => (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updatedOrder = orderService.updateOrderStatus(id, status);
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = (orderService = orderServiceInstance) => (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const cancelledOrder = orderService.cancelOrder(id);
    res.status(200).json({
      success: true,
      message: 'Order cancelled and stock restored successfully',
      data: cancelledOrder
    });
  } catch (err) {
    next(err);
  }
};
