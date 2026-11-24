import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../src/database/db.js';
import { seedDatabase } from '../src/database/seed.js';
import { createApp } from '../src/app.js';

describe('Commerce Order Console - Automated Test Suite', () => {
  let db;
  let app;

  beforeEach(() => {
    // Isolated in-memory database for every single test
    db = createDatabaseConnection(':memory:');
    seedDatabase(db, { force: true });
    app = createApp({ db });
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  it('TEST 1: Successful order placement - verifies order creation and stock deduction', async () => {
    // 1. Initial stock of Wireless Mouse (id: 1) is 25
    const initialProduct = db.prepare('SELECT * FROM products WHERE id = 1').get();
    expect(initialProduct.stock).toBe(25);

    // 2. Place an order for 2 Wireless Mouses
    const response = await request(app)
      .post('/api/orders')
      .send({
        items: [
          { product_id: 1, quantity: 2 }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();

    const order = response.body.data;
    expect(order.status).toBe('Placed');
    expect(order.total_amount).toBe(599 * 2);
    expect(order.order_reference).toMatch(/^ORD-/);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].product_id).toBe(1);
    expect(order.items[0].quantity).toBe(2);
    expect(order.items[0].unit_price).toBe(599);
    expect(order.items[0].line_total).toBe(1198);

    // 3. Verify stock deduction in database
    const updatedProduct = db.prepare('SELECT * FROM products WHERE id = 1').get();
    expect(updatedProduct.stock).toBe(23);
  });

  it('TEST 2: Insufficient stock - verifies rejection and unchanged inventory', async () => {
    const initialProduct = db.prepare('SELECT * FROM products WHERE id = 1').get();
    expect(initialProduct.stock).toBe(25);

    // Attempt to order 30 when only 25 in stock
    const response = await request(app)
      .post('/api/orders')
      .send({
        items: [
          { product_id: 1, quantity: 30 }
        ]
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Insufficient stock for Wireless Mouse');

    // Verify stock remains untouched
    const productAfter = db.prepare('SELECT * FROM products WHERE id = 1').get();
    expect(productAfter.stock).toBe(25);

    // Verify no order was created
    const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    expect(ordersCount).toBe(0);
  });

  it('TEST 3: Multi-product atomicity - one item unavailable => no order and all stock unchanged', async () => {
    // Initial stocks:
    // id 1 (Wireless Mouse): stock 25
    // id 5 (Webcam HD): stock 0
    const mouseBefore = db.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
    const webcamBefore = db.prepare('SELECT stock FROM products WHERE id = 5').get().stock;
    expect(mouseBefore).toBe(25);
    expect(webcamBefore).toBe(0);

    const response = await request(app)
      .post('/api/orders')
      .send({
        items: [
          { product_id: 1, quantity: 2 }, // available
          { product_id: 5, quantity: 1 }  // NOT available (stock is 0)
        ]
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Insufficient stock for Webcam HD');

    // Verify all inventory remains unchanged
    const mouseAfter = db.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
    const webcamAfter = db.prepare('SELECT stock FROM products WHERE id = 5').get().stock;
    expect(mouseAfter).toBe(25);
    expect(webcamAfter).toBe(0);

    // Verify no order and no order items were created
    const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const itemsCount = db.prepare('SELECT COUNT(*) as count FROM order_items').get().count;
    expect(ordersCount).toBe(0);
    expect(itemsCount).toBe(0);
  });

  it('TEST 4: Successful cancellation - verifies stock restoration', async () => {
    // Initial stock for USB-C Hub (id: 3) is 15
    const initialStock = db.prepare('SELECT stock FROM products WHERE id = 3').get().stock;
    expect(initialStock).toBe(15);

    // 1. Create order for 5 USB-C Hubs
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: 3, quantity: 5 }]
      });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data.id;

    // Stock should now be 10
    const stockAfterOrder = db.prepare('SELECT stock FROM products WHERE id = 3').get().stock;
    expect(stockAfterOrder).toBe(10);

    // 2. Cancel order
    const cancelRes = await request(app).post(`/api/orders/${orderId}/cancel`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('Cancelled');
    expect(cancelRes.body.data.cancelled_at).not.toBeNull();

    // 3. Stock must be fully restored to 15
    const stockAfterCancel = db.prepare('SELECT stock FROM products WHERE id = 3').get().stock;
    expect(stockAfterCancel).toBe(15);
  });

  it('TEST 5: Duplicate cancellation - verifies stock is not restored again', async () => {
    // 1. Create and cancel order
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: 3, quantity: 5 }]
      });
    const orderId = createRes.body.data.id;

    const cancel1 = await request(app).post(`/api/orders/${orderId}/cancel`);
    expect(cancel1.status).toBe(200);

    const stockAfterFirstCancel = db.prepare('SELECT stock FROM products WHERE id = 3').get().stock;
    expect(stockAfterFirstCancel).toBe(15);

    // 2. Attempt duplicate cancellation
    const cancel2 = await request(app).post(`/api/orders/${orderId}/cancel`);
    expect(cancel2.status).toBe(400);
    expect(cancel2.body.success).toBe(false);
    expect(cancel2.body.message).toMatch(/already cancelled/i);

    // 3. Verify stock was NOT restored a second time (must remain 15, not 20)
    const stockAfterSecondCancel = db.prepare('SELECT stock FROM products WHERE id = 3').get().stock;
    expect(stockAfterSecondCancel).toBe(15);
  });

  it('TEST 6: Invalid status transition - attempt Placed -> Shipped verifies rejection', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: 2, quantity: 1 }]
      });
    const orderId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('Placed');

    // Attempt direct Placed -> Shipped (skipping Packed)
    const transitionRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({ status: 'Shipped' });

    expect(transitionRes.status).toBe(400);
    expect(transitionRes.body.success).toBe(false);
    expect(transitionRes.body.message).toContain('Invalid status transition');

    // Verify order status is still Placed
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId);
    expect(order.status).toBe('Placed');
  });

  it('TEST 7: Shipped order cancellation - verifies rejection and unchanged inventory', async () => {
    // Initial stock of Laptop Stand (id: 4) is 8
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: 4, quantity: 2 }]
      });
    const orderId = createRes.body.data.id;

    // Transition Placed -> Packed -> Shipped
    const packRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({ status: 'Packed' });
    expect(packRes.status).toBe(200);

    const shipRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({ status: 'Shipped' });
    expect(shipRes.status).toBe(200);

    // Stock should be 8 - 2 = 6
    const stockShipped = db.prepare('SELECT stock FROM products WHERE id = 4').get().stock;
    expect(stockShipped).toBe(6);

    // Attempt to cancel shipped order
    const cancelRes = await request(app).post(`/api/orders/${orderId}/cancel`);
    expect(cancelRes.status).toBe(400);
    expect(cancelRes.body.success).toBe(false);
    expect(cancelRes.body.message).toMatch(/cannot cancel/i);

    // Verify status is still Shipped
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId);
    expect(order.status).toBe('Shipped');

    // Stock must remain unchanged at 6
    const stockAfter = db.prepare('SELECT stock FROM products WHERE id = 4').get().stock;
    expect(stockAfter).toBe(6);
  });

  it('TEST 8: Valid fulfilment transitions - verifies Placed -> Packed -> Shipped', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        items: [{ product_id: 1, quantity: 1 }]
      });
    const orderId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('Placed');

    // 1. Placed -> Packed
    const packRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({ status: 'Packed' });
    expect(packRes.status).toBe(200);
    expect(packRes.body.success).toBe(true);
    expect(packRes.body.data.status).toBe('Packed');

    // Verify in DB
    let order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId);
    expect(order.status).toBe('Packed');

    // 2. Packed -> Shipped
    const shipRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({ status: 'Shipped' });
    expect(shipRes.status).toBe(200);
    expect(shipRes.body.success).toBe(true);
    expect(shipRes.body.data.status).toBe('Shipped');

    // Verify in DB
    order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId);
    expect(order.status).toBe('Shipped');
  });

  it('ADDITIONAL: Dashboard statistics returns accurate real-time metrics', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total_products).toBe(5);
    expect(res.body.data.total_orders).toBe(0);

    // Place an order
    await request(app)
      .post('/api/orders')
      .send({ items: [{ product_id: 1, quantity: 1 }] });

    const updatedStats = await request(app).get('/api/dashboard/stats');
    expect(updatedStats.body.data.total_orders).toBe(1);
    expect(updatedStats.body.data.placed_orders).toBe(1);
  });

  it('TEST 9: Multi-product order calculation - verifies totals are calculated from database unit prices, ignoring frontend tampered prices', async () => {
    // Product 1: Wireless Mouse (DB Price: 599, stock: 25)
    // Product 2: Mechanical Keyboard (DB Price: 1499, stock: 10)
    // Client attempts to pass fake low prices (e.g. price: 10)
    const response = await request(app)
      .post('/api/orders')
      .send({
        items: [
          { product_id: 1, quantity: 2, price: 10, unit_price: 10 },
          { product_id: 2, quantity: 1, price: 20, unit_price: 20 }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    const order = response.body.data;

    // Must calculate with DB prices: (599 * 2) + (1499 * 1) = 1198 + 1499 = 2697
    expect(order.total_amount).toBe(2697);
    expect(order.items[0].unit_price).toBe(599);
    expect(order.items[0].line_total).toBe(1198);
    expect(order.items[1].unit_price).toBe(1499);
    expect(order.items[1].line_total).toBe(1499);

    // Verify stock deductions
    expect(db.prepare('SELECT stock FROM products WHERE id = 1').get().stock).toBe(23);
    expect(db.prepare('SELECT stock FROM products WHERE id = 2').get().stock).toBe(9);
  });

  it('TEST 10: Failed transaction rollback - verifies database transaction rolls back if an operation fails mid-transaction', async () => {
    // Verify initial stock
    const mouseBefore = db.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
    expect(mouseBefore).toBe(25);

    // Create a transaction that updates stock and then intentionally fails
    const failingTx = db.transaction(() => {
      db.prepare('UPDATE products SET stock = stock - 5 WHERE id = 1').run();
      // Throw an error to simulate mid-transaction failure
      throw new Error('Simulated mid-transaction failure');
    });

    expect(() => failingTx()).toThrow('Simulated mid-transaction failure');

    // Verify stock was completely rolled back to original 25
    const mouseAfter = db.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
    expect(mouseAfter).toBe(25);
  });

  it('TEST 11: Database persistence - verifies orders and inventory survive closing and reopening the SQLite connection (restart simulation)', async () => {
    const tempDbPath = path.resolve('backend', 'temp-persistence-test.db');
    if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);

    try {
      // 1. Initialize persistent disk DB
      const persistentDb1 = createDatabaseConnection(tempDbPath);
      seedDatabase(persistentDb1, { force: true });
      const persistentApp = createApp({ db: persistentDb1 });

      // 2. Place an order on disk DB
      const res = await request(persistentApp)
        .post('/api/orders')
        .send({
          items: [{ product_id: 1, quantity: 4 }]
        });
      expect(res.status).toBe(201);
      const orderRef = res.body.data.order_reference;

      // Stock should now be 21
      expect(persistentDb1.prepare('SELECT stock FROM products WHERE id = 1').get().stock).toBe(21);

      // 3. Simulate server shutdown by closing DB connection
      persistentDb1.close();

      // 4. Simulate server restart by reconnecting to the same disk DB file
      const persistentDb2 = createDatabaseConnection(tempDbPath);

      // 5. Verify the order and inventory persisted across connection restart
      const persistedOrder = persistentDb2.prepare('SELECT * FROM orders WHERE order_reference = ?').get(orderRef);
      expect(persistedOrder).toBeDefined();
      expect(persistedOrder.total_amount).toBe(599 * 4);
      expect(persistedOrder.status).toBe('Placed');

      const persistedStock = persistentDb2.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
      expect(persistedStock).toBe(21);

      persistentDb2.close();
    } finally {
      // Cleanup temp test DB
      if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
      const walFile = `${tempDbPath}-wal`;
      const shmFile = `${tempDbPath}-shm`;
      if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
      if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
    }
  });
});
