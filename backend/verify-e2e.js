import http from 'node:http';
import app from './src/app.js';
import { getDb } from './src/database/db.js';
import { seedDatabase } from './src/database/seed.js';

async function runE2E() {
  console.log('--- Starting Integration & Persistence Verification ---');

  // 1. Seed development database
  const db = getDb();
  seedDatabase(db, { force: true });
  console.log('✓ Database schema created and seeded with 5 products');

  // 2. Start server on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`✓ Test server running on ${baseUrl}`);

  try {
    // 3. Test Health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('✓ /api/health returned:', healthData.status);

    // 4. Test Products
    const prodRes = await fetch(`${baseUrl}/api/products`);
    const prodData = await prodRes.json();
    console.log(`✓ /api/products returned ${prodData.data.length} products`);
    if (prodData.data.length !== 5) throw new Error('Expected 5 products');

    // 5. Test Out-of-Stock product
    const webcam = prodData.data.find(p => p.sku === 'WHD-005');
    console.log(`✓ Product Webcam HD stock: ${webcam.stock}, status: ${webcam.stock_status}`);
    if (webcam.stock !== 0 || webcam.stock_status !== 'OUT_OF_STOCK') {
      throw new Error('Webcam HD should be out of stock');
    }

    const p1 = prodData.data[0];
    const p2 = prodData.data[1];
    const p3 = prodData.data[2];

    // 6. Test Placing Order
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { product_id: p1.id, quantity: 2 },
          { product_id: p2.id, quantity: 1 }
        ]
      })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      console.error('Order creation error:', orderRes.status, orderData);
      throw new Error(`Order creation failed: ${JSON.stringify(orderData)}`);
    }
    console.log(`✓ Placed order: ${orderData.data.order_reference}, Status: ${orderData.data.status}, Total: ₹${orderData.data.total_amount}`);
    const orderId = orderData.data.id;

    // 7. Verify stock deduction
    const p1After = db.prepare('SELECT stock FROM products WHERE id = ?').get(p1.id);
    console.log(`✓ ${p1.name} stock deducted from ${p1.stock} to ${p1After.stock}`);
    if (p1After.stock !== p1.stock - 2) throw new Error('Stock deduction failed');

    // 8. Test Fulfilment Transition: Placed -> Packed
    const packRes = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Packed' })
    });
    const packData = await packRes.json();
    console.log(`✓ Updated order to: ${packData.data.status}`);

    // 9. Test Fulfilment Transition: Packed -> Shipped
    const shipRes = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Shipped' })
    });
    const shipData = await shipRes.json();
    console.log(`✓ Updated order to: ${shipData.data.status}`);

    // 10. Test Illegal Transition on Shipped Order: Shipped -> Cancelled
    const illegalCancelRes = await fetch(`${baseUrl}/api/orders/${orderId}/cancel`, {
      method: 'POST'
    });
    const illegalData = await illegalCancelRes.json();
    console.log(`✓ Illegal cancellation rejected with status ${illegalCancelRes.status}: "${illegalData.message}"`);
    if (illegalCancelRes.status !== 400) throw new Error('Should reject cancelling shipped order');

    // 11. Test Order Cancellation with Stock Restoration
    const p3Before = db.prepare('SELECT stock FROM products WHERE id = ?').get(p3.id).stock;
    const order2Res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ product_id: p3.id, quantity: 5 }]
      })
    });
    const order2Data = await order2Res.json();
    const order2Id = order2Data.data.id;
    console.log(`✓ Order 2 created for 5 ${p3.name}, remaining stock: ${db.prepare('SELECT stock FROM products WHERE id = ?').get(p3.id).stock}`);

    const cancelRes = await fetch(`${baseUrl}/api/orders/${order2Id}/cancel`, { method: 'POST' });
    const cancelData = await cancelRes.json();
    const p3AfterCancel = db.prepare('SELECT stock FROM products WHERE id = ?').get(p3.id).stock;
    console.log(`✓ Order 2 cancelled: status ${cancelData.data.status}, stock restored to ${p3AfterCancel}`);
    if (p3AfterCancel !== p3Before) {
      throw new Error('Stock was not restored correctly');
    }

    // 12. Test Duplicate Cancellation Rejection
    const dupCancelRes = await fetch(`${baseUrl}/api/orders/${order2Id}/cancel`, { method: 'POST' });
    const dupCancelData = await dupCancelRes.json();
    console.log(`✓ Duplicate cancellation rejected with status ${dupCancelRes.status}: "${dupCancelData.message}"`);
    if (dupCancelRes.status !== 400) throw new Error('Duplicate cancellation must be rejected');

    // 13. Test Dashboard Stats
    const statsRes = await fetch(`${baseUrl}/api/dashboard/stats`);
    const statsData = await statsRes.json();
    console.log('✓ Dashboard stats:', statsData.data);

    console.log('\n--- ALL E2E & INTEGRATION CHECKS PASSED PERFECTLY! ---');
  } finally {
    server.close();
  }
}

runE2E().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
