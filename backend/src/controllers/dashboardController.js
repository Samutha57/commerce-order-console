import orderServiceInstance from '../services/orderService.js';

export const getDashboardStats = (orderService = orderServiceInstance) => (req, res, next) => {
  try {
    const stats = orderService.getDashboardStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};
