import http from 'node:http';
import { getDb } from './src/database/db.js';

function sendOrder(productId, quantity) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      items: [{ product_id: productId, quantity }]
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runConcurrencyTest() {
  console.log('======================================================');
  console.log('          CONCURRENT INVENTORY RACE TEST              ');
  console.log('======================================================\n');

  const db = getDb();

  // 1. Set Product 4 (Laptop Stand) stock to exactly 1
  console.log('1. Setting Product 4 stock to exactly 1 in database...');
  db.prepare('UPDATE products SET stock = 1 WHERE id = 4').run();
  const prodBefore = db.prepare('SELECT id, name, stock FROM products WHERE id = 4').get();
  console.log(`  ✓ Product 4 (${prodBefore.name}) stock set to: ${prodBefore.stock}`);

  const ordersBeforeCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  // 2. Fire two simultaneous order requests for quantity 1
  console.log('2. Firing 2 simultaneous HTTP POST order requests for quantity 1 each...');
  const [res1, res2] = await Promise.all([
    sendOrder(4, 1),
    sendOrder(4, 1)
  ]);

  console.log(`  • Request 1 Result: Status ${res1.status} - Success: ${res1.body?.success} - Message: ${res1.body?.message || 'Order Placed'}`);
  console.log(`  • Request 2 Result: Status ${res2.status} - Success: ${res2.body?.success} - Message: ${res2.body?.message || 'Order Placed'}`);

  // 3. Evaluate Results
  const successCount = [res1, res2].filter(r => r.status === 201).length;
  const failureCount = [res1, res2].filter(r => r.status === 400 || r.status === 409).length;

  console.log(`\n3. Verifying Mutual Exclusion:`);
  console.log(`  ✓ Successful orders: ${successCount} (Required: 1)`);
  console.log(`  ✓ Rejected orders:   ${failureCount} (Required: 1)`);

  if (successCount !== 1 || failureCount !== 1) {
    throw new Error(`Concurrency race condition detected! Successful: ${successCount}, Rejected: ${failureCount}`);
  }

  // 4. Verify Final Stock and Orders Count
  const prodAfter = db.prepare('SELECT id, name, stock FROM products WHERE id = 4').get();
  const ordersAfterCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  console.log(`\n4. Verifying Database State:`);
  console.log(`  ✓ Final stock for Product 4: ${prodAfter.stock} (Required: 0, strictly not negative)`);
  console.log(`  ✓ New orders created: ${ordersAfterCount - ordersBeforeCount} (Required: 1)`);

  if (prodAfter.stock === 0 && (ordersAfterCount - ordersBeforeCount === 1)) {
    console.log('\n======================================================');
    console.log('✓ PASS: CONCURRENT INVENTORY TEST FULLY VERIFIED!');
    console.log('======================================================\n');
  } else {
    throw new Error('Database invariants violated in concurrent test!');
  }
}

runConcurrencyTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
