import { getDb } from '../database/db.js';

export class OrderService {
  constructor(db = getDb()) {
    this.db = db;
  }

  generateOrderReference() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${timestamp}-${random}`;
  }

  createOrder({ items }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = new Error('Order must contain at least one item');
      error.statusCode = 400;
      throw error;
    }

    // Aggregate duplicate product items
    const aggregated = new Map();
    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || productId <= 0) {
        const error = new Error('Invalid product ID');
        error.statusCode = 400;
        throw error;
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        const error = new Error('Quantity must be a positive integer');
        error.statusCode = 400;
        throw error;
      }

      if (aggregated.has(productId)) {
        aggregated.set(productId, aggregated.get(productId) + quantity);
      } else {
        aggregated.set(productId, quantity);
      }
    }

    // Execute atomic transaction for order placement
    const placeOrderTx = this.db.transaction(() => {
      let totalAmount = 0;
      const orderItemsToInsert = [];

      // 1. Validate existence and stock for EVERY requested product
      for (const [productId, quantity] of aggregated.entries()) {
        const product = this.db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(productId);

        if (!product) {
          const error = new Error(`Product with ID ${productId} does not exist`);
          error.statusCode = 404;
          throw error;
        }

        if (product.stock < quantity) {
          const error = new Error(`Insufficient stock for ${product.name}`);
          error.statusCode = 400;
          throw error;
        }

        const lineTotal = product.price * quantity;
        totalAmount += lineTotal;

        orderItemsToInsert.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          lineTotal
        });
      }

      // 2. Deduct stock for all products (with conditional check)
      const deductStockStmt = this.db.prepare(`
        UPDATE products 
        SET stock = stock - ? 
        WHERE id = ? AND stock >= ?
      `);

      for (const item of orderItemsToInsert) {
        const result = deductStockStmt.run(item.quantity, item.productId, item.quantity);
        if (result.changes === 0) {
          const error = new Error(`Stock deduction failed for ${item.productName}`);
          error.statusCode = 409;
          throw error;
        }
      }

      // 3. Create the order
      const orderReference = this.generateOrderReference();
      const insertOrderStmt = this.db.prepare(`
        INSERT INTO orders (order_reference, status, total_amount)
        VALUES (?, 'Placed', ?)
      `);
      const orderResult = insertOrderStmt.run(orderReference, totalAmount);
      const orderId = orderResult.lastInsertRowid;

      // 4. Create all order items
      const insertItemStmt = this.db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of orderItemsToInsert) {
        insertItemStmt.run(orderId, item.productId, item.quantity, item.unitPrice, item.lineTotal);
      }

      return orderId;
    });

    const newOrderId = placeOrderTx();
    return this.getOrderById(newOrderId);
  }

  getOrderById(id) {
    const order = this.db.prepare(`
      SELECT 
        id, 
        order_reference, 
        status, 
        total_amount, 
        created_at, 
        updated_at, 
        cancelled_at
      FROM orders
      WHERE id = ?
    `).get(id);

    if (!order) {
      const error = new Error(`Order with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const items = this.db.prepare(`
      SELECT 
        oi.id,
        oi.product_id,
        p.name as product_name,
        p.sku,
        oi.quantity,
        oi.unit_price,
        oi.line_total
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `).all(id);

    return {
      ...order,
      items
    };
  }

  getOrders({ search = '', status = '' } = {}) {
    let sql = `
      SELECT 
        o.id,
        o.order_reference,
        o.status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        o.cancelled_at,
        COALESCE(SUM(oi.quantity), 0) as total_items,
        COUNT(oi.id) as unique_items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ` AND o.order_reference LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    if (status && status.trim()) {
      sql += ` AND o.status = ?`;
      params.push(status.trim());
    }

    sql += ` GROUP BY o.id ORDER BY o.created_at DESC, o.id DESC`;

    return this.db.prepare(sql).all(...params);
  }

  updateOrderStatus(id, newStatus) {
    const validTransitions = {
      'Placed': ['Packed'],
      'Packed': ['Shipped'],
      'Shipped': [],
      'Cancelled': []
    };

    const order = this.db.prepare('SELECT id, order_reference, status FROM orders WHERE id = ?').get(id);

    if (!order) {
      const error = new Error(`Order with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    if (newStatus === 'Cancelled') {
      const error = new Error('Use POST /api/orders/:id/cancel to cancel an order');
      error.statusCode = 400;
      throw error;
    }

    const allowedNext = validTransitions[order.status] || [];
    if (!allowedNext.includes(newStatus)) {
      const error = new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }

    const updateStmt = this.db.prepare(`
      UPDATE orders 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(newStatus, id);

    return this.getOrderById(id);
  }

  cancelOrder(id) {
    const cancelTx = this.db.transaction(() => {
      // 1. Retrieve order
      const order = this.db.prepare('SELECT id, order_reference, status FROM orders WHERE id = ?').get(id);

      if (!order) {
        const error = new Error(`Order with ID ${id} not found`);
        error.statusCode = 404;
        throw error;
      }

      // 2. Verify status
      if (order.status === 'Cancelled') {
        const error = new Error('Order is already cancelled');
        error.statusCode = 400;
        throw error;
      }

      if (order.status === 'Shipped') {
        const error = new Error('Cannot cancel a shipped order');
        error.statusCode = 400;
        throw error;
      }

      if (order.status !== 'Placed' && order.status !== 'Packed') {
        const error = new Error(`Cannot cancel order in ${order.status} status`);
        error.statusCode = 400;
        throw error;
      }

      // 3. Retrieve order items to restore stock
      const items = this.db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(id);

      // 4. Restore each item's stock
      const restoreStockStmt = this.db.prepare(`
        UPDATE products 
        SET stock = stock + ? 
        WHERE id = ?
      `);

      for (const item of items) {
        restoreStockStmt.run(item.quantity, item.product_id);
      }

      // 5. Update order status to Cancelled and record cancellation timestamp
      const updateOrderStmt = this.db.prepare(`
        UPDATE orders 
        SET status = 'Cancelled', cancelled_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ? AND status IN ('Placed', 'Packed')
      `);

      const updateResult = updateOrderStmt.run(id);
      if (updateResult.changes === 0) {
        const error = new Error('Order cancellation could not be completed');
        error.statusCode = 409;
        throw error;
      }

      return id;
    });

    cancelTx();
    return this.getOrderById(id);
  }

  getDashboardStats() {
    const orderStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'Placed' THEN 1 ELSE 0 END) as placed_orders,
        SUM(CASE WHEN status = 'Packed' THEN 1 ELSE 0 END) as packed_orders,
        SUM(CASE WHEN status = 'Shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders
    `).get();

    const productStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) as low_stock_products,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_products
      FROM products
    `).get();

    return {
      total_orders: orderStats.total_orders || 0,
      placed_orders: orderStats.placed_orders || 0,
      packed_orders: orderStats.packed_orders || 0,
      shipped_orders: orderStats.shipped_orders || 0,
      cancelled_orders: orderStats.cancelled_orders || 0,
      total_products: productStats.total_products || 0,
      low_stock_products: productStats.low_stock_products || 0,
      out_of_stock_products: productStats.out_of_stock_products || 0
    };
  }
}

export default new OrderService();
