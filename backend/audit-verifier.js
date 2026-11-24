import { createDatabaseConnection } from './src/database/db.js';
import { seedDatabase } from './src/database/seed.js';
import { createApp } from './src/app.js';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';

async function audit() {
  console.log('=====================================================');
  console.log('   COMMERCE ORDER CONSOLE - RIGOROUS AUDIT SUITE    ');
  console.log('=====================================================\n');

  const auditDbPath = path.resolve('backend/audit-test.db');
  if (fs.existsSync(auditDbPath)) fs.unlinkSync(auditDbPath);

  // Initialize fresh disk-backed DB for audit
  const db1 = createDatabaseConnection(auditDbPath);
  seedDatabase(db1, { force: true });
  const app1 = createApp({ db: db1 });

  console.log('STEP 3: Verify Successful Multi-Product Order Placement');
  // Stock: Mouse=25 (599), Keyboard=10 (1499)
  const orderRes = await request(app1)
    .post('/api/orders')
    .send({
      items: [
        { product_id: 1, quantity: 3 },
        { product_id: 2, quantity: 2 }
      ]
    });
  
  if (orderRes.status !== 201) throw new Error(`Step 3 failed with status ${orderRes.status}`);
  const order = orderRes.body.data;
  console.log(`  ✓ Order created: ${order.order_reference}`);
  console.log(`  ✓ Total amount: ₹${order.total_amount} (Expected 3*599 + 2*1499 = ${3*599 + 2*1499})`);
  if (order.total_amount !== 3*599 + 2*1499) throw new Error('Grand total mismatch');

  const mouseStock1 = db1.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
  const kbStock1 = db1.prepare('SELECT stock FROM products WHERE id = 2').get().stock;
  console.log(`  ✓ Wireless Mouse stock deducted: 25 -> ${mouseStock1} (Expected 22)`);
  console.log(`  ✓ Keyboard stock deducted: 10 -> ${kbStock1} (Expected 8)`);
  if (mouseStock1 !== 22 || kbStock1 !== 8) throw new Error('Stock deduction mismatch');

  console.log('\nSTEP 4: Verify Insufficient Stock Leaves ALL Inventory Unchanged');
  // Attempt to order 50 mice (available 22) and 1 keyboard (available 8)
  const failedOrderRes = await request(app1)
    .post('/api/orders')
    .send({
      items: [
        { product_id: 1, quantity: 50 },
        { product_id: 2, quantity: 1 }
      ]
    });
  console.log(`  ✓ Rejected with status ${failedOrderRes.status}: "${failedOrderRes.body.message}"`);
  if (failedOrderRes.status !== 400) throw new Error('Expected 400 for insufficient stock');

  const mouseStock2 = db1.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
  const kbStock2 = db1.prepare('SELECT stock FROM products WHERE id = 2').get().stock;
  console.log(`  ✓ Mouse stock untouched: ${mouseStock2}`);
  console.log(`  ✓ Keyboard stock untouched: ${kbStock2}`);
  if (mouseStock2 !== 22 || kbStock2 !== 8) throw new Error('Stock was modified on rejected order');

  console.log('\nSTEP 5: Verify Cancellation Restores Stock Exactly Once');
  const cancelRes1 = await request(app1).post(`/api/orders/${order.id}/cancel`);
  console.log(`  ✓ First cancellation status: ${cancelRes1.status}, order state: ${cancelRes1.body.data.status}`);
  if (cancelRes1.status !== 200 || cancelRes1.body.data.status !== 'Cancelled') throw new Error('Cancellation failed');

  const mouseStock3 = db1.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
  const kbStock3 = db1.prepare('SELECT stock FROM products WHERE id = 2').get().stock;
  console.log(`  ✓ Mouse stock restored to: ${mouseStock3} (Expected 25)`);
  console.log(`  ✓ Keyboard stock restored to: ${kbStock3} (Expected 10)`);
  if (mouseStock3 !== 25 || kbStock3 !== 10) throw new Error('Stock not restored on cancellation');

  // Duplicate cancellation
  const cancelRes2 = await request(app1).post(`/api/orders/${order.id}/cancel`);
  console.log(`  ✓ Duplicate cancellation rejected with status ${cancelRes2.status}: "${cancelRes2.body.message}"`);
  if (cancelRes2.status !== 400) throw new Error('Duplicate cancellation must return 400');

  const mouseStock4 = db1.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
  const kbStock4 = db1.prepare('SELECT stock FROM products WHERE id = 2').get().stock;
  console.log(`  ✓ Mouse stock remains: ${mouseStock4} (Stock NOT double-restored)`);
  console.log(`  ✓ Keyboard stock remains: ${kbStock4} (Stock NOT double-restored)`);
  if (mouseStock4 !== 25 || kbStock4 !== 10) throw new Error('Stock was double-restored');

  console.log('\nSTEP 6: Verify Invalid State Transitions Rejected Through Direct API Requests');
  // Create order for testing transitions
  const tOrderRes = await request(app1)
    .post('/api/orders')
    .send({ items: [{ product_id: 3, quantity: 1 }] });
  const tOrderId = tOrderRes.body.data.id;

  // 1. Placed -> Shipped (Invalid leap)
  const leapRes = await request(app1).patch(`/api/orders/${tOrderId}/status`).send({ status: 'Shipped' });
  console.log(`  ✓ Direct Placed -> Shipped rejected with ${leapRes.status}: "${leapRes.body.message}"`);
  if (leapRes.status !== 400) throw new Error('Placed -> Shipped should be rejected');

  // 2. Placed -> Unsupported (Invalid status)
  const invalidStatusRes = await request(app1).patch(`/api/orders/${tOrderId}/status`).send({ status: 'Delivered' });
  console.log(`  ✓ Unsupported status transition rejected with ${invalidStatusRes.status}: "${invalidStatusRes.body.message}"`);
  if (invalidStatusRes.status !== 400) throw new Error('Unsupported status transition should be rejected');

  // Advance to Packed -> Shipped
  await request(app1).patch(`/api/orders/${tOrderId}/status`).send({ status: 'Packed' });
  await request(app1).patch(`/api/orders/${tOrderId}/status`).send({ status: 'Shipped' });

  // 3. Shipped -> Cancelled (Invalid)
  const shippedCancelRes = await request(app1).post(`/api/orders/${tOrderId}/cancel`);
  console.log(`  ✓ Shipped order cancellation rejected with ${shippedCancelRes.status}: "${shippedCancelRes.body.message}"`);
  if (shippedCancelRes.status !== 400) throw new Error('Shipped cancellation should be rejected');

  // 4. Shipped -> Packed (Invalid backward transition)
  const backwardRes = await request(app1).patch(`/api/orders/${tOrderId}/status`).send({ status: 'Packed' });
  console.log(`  ✓ Shipped -> Packed backward transition rejected with ${backwardRes.status}: "${backwardRes.body.message}"`);
  if (backwardRes.status !== 400) throw new Error('Backward transition should be rejected');

  console.log('\nSTEP 7: Verify Orders & Inventory Survive Complete Backend Restart');
  // Place persistent order
  const persistOrderRes = await request(app1)
    .post('/api/orders')
    .send({ items: [{ product_id: 4, quantity: 3 }] }); // Laptop stand: 8 -> 5
  const persistOrderId = persistOrderRes.body.data.id;
  const persistRef = persistOrderRes.body.data.order_reference;
  console.log(`  ✓ Placed persistent order: ${persistRef}`);

  // Close db1 connection simulating process shutdown
  db1.close();
  console.log('  ✓ Backend server process shutdown simulated (connection closed)');

  // Reopen db from disk in a fresh server instance
  const db2 = createDatabaseConnection(auditDbPath);
  const app2 = createApp({ db: db2 });
  console.log('  ✓ Backend server restarted and reconnected to sqlite database file');

  const retrievedOrderRes = await request(app2).get(`/api/orders/${persistOrderId}`);
  console.log(`  ✓ Retrieved order after restart: ${retrievedOrderRes.body.data.order_reference}, status: ${retrievedOrderRes.body.data.status}`);
  if (retrievedOrderRes.status !== 200 || retrievedOrderRes.body.data.order_reference !== persistRef) {
    throw new Error('Order did not survive restart');
  }

  const standStockAfterRestart = db2.prepare('SELECT stock FROM products WHERE id = 4').get().stock;
  console.log(`  ✓ Inventory level after restart: ${standStockAfterRestart} units (Expected 5)`);
  if (standStockAfterRestart !== 5) throw new Error('Inventory did not survive restart');
  db2.close();
  if (fs.existsSync(auditDbPath)) fs.unlinkSync(auditDbPath);

  console.log('\nSTEP 8: Verify Multi-Product Transaction Atomicity & Rollback');
  const db3 = createDatabaseConnection(':memory:');
  seedDatabase(db3, { force: true });
  const app3 = createApp({ db: db3 });

  // Initial stock: Mouse=25, Webcam=0 (out of stock)
  const atomicityRes = await request(app3)
    .post('/api/orders')
    .send({
      items: [
        { product_id: 1, quantity: 2 }, // available
        { product_id: 5, quantity: 1 }  // UNAVAILABLE (stock: 0)
      ]
    });
  console.log(`  ✓ Atomicity test rejected with ${atomicityRes.status}: "${atomicityRes.body.message}"`);
  if (atomicityRes.status !== 400) throw new Error('Atomicity test failed');

  const mouseStockAfterAtomicity = db3.prepare('SELECT stock FROM products WHERE id = 1').get().stock;
  const totalOrdersCount = db3.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  console.log(`  ✓ Mouse stock rolled back: ${mouseStockAfterAtomicity} (Still 25)`);
  console.log(`  ✓ Orders table rolled back: ${totalOrdersCount} orders (0 created)`);
  if (mouseStockAfterAtomicity !== 25 || totalOrdersCount !== 0) throw new Error('Rollback was not atomic');

  console.log('\nSTEP 9: Verify Order Totals Calculated Using Database Prices (No Frontend Trust)');
  // Client attempts to send manipulated unit_price=1 and total_amount=1
  const spoofRes = await request(app3)
    .post('/api/orders')
    .send({
      items: [
        { product_id: 1, quantity: 2, unit_price: 1, line_total: 2 }
      ],
      total_amount: 2
    });
  console.log(`  ✓ Order created: Unit Price recorded = ₹${spoofRes.body.data.items[0].unit_price}, Line Total = ₹${spoofRes.body.data.items[0].line_total}, Grand Total = ₹${spoofRes.body.data.total_amount}`);
  if (spoofRes.body.data.items[0].unit_price !== 599 || spoofRes.body.data.total_amount !== 1198) {
    throw new Error('Server trusted client price instead of database price');
  }
  console.log('  ✓ Client manipulated prices were completely ignored; trusted DB prices enforced!');

  db3.close();
  console.log('\n=====================================================');
  console.log('   ALL AUDIT CHECKS 3 THROUGH 9 PASSED VERIFIED!     ');
  console.log('=====================================================');
}

audit().catch(err => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
