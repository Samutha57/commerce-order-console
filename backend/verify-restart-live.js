import http from 'node:http';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function waitForServer(port, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await request({
        hostname: 'localhost',
        port,
        path: '/api/health',
        method: 'GET'
      });
      if (res.status === 200) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Server on port ${port} did not start in time`);
}

async function runRestartTest() {
  console.log('======================================================');
  console.log('       ACTUAL SERVER RESTART TEST VERIFICATION        ');
  console.log('======================================================\n');

  // 1. Ensure backend is currently reachable
  console.log('1. Checking current backend health...');
  await waitForServer(5000);
  console.log('  ✓ Backend is live on port 5000');

  // Check initial stock of product 1
  const initialProdRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/products/1',
    method: 'GET'
  });
  const initialStock = initialProdRes.body.data.stock;
  console.log(`  ✓ Initial stock for Product 1 (${initialProdRes.body.data.name}): ${initialStock}`);

  // 2. Place an order for 2 units
  console.log('2. Creating customer order for 2 units...');
  const orderRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    items: [{ product_id: 1, quantity: 2 }]
  });

  if (orderRes.status !== 201) {
    throw new Error(`Failed to place order: ${JSON.stringify(orderRes.body)}`);
  }

  const orderId = orderRes.body.data.id;
  const orderRef = orderRes.body.data.order_reference;
  const expectedStock = initialStock - 2;
  console.log(`  ✓ Order created successfully: ID=${orderId}, Reference=${orderRef}`);
  console.log(`  ✓ Expected remaining stock: ${expectedStock}`);

  // 3. Stop backend process completely
  console.log('3. Stopping backend process completely...');
  // Find PID listening on 5000
  let pidsToKill = [];
  try {
    const netstatOut = execSync('netstat -ano | findstr :5000', { encoding: 'utf8' });
    const lines = netstatOut.trim().split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !pidsToKill.includes(pid)) pidsToKill.push(pid);
      }
    }
  } catch (err) {
    console.log('  Note during netstat:', err.message);
  }

  console.log(`  Found PIDs on port 5000: ${pidsToKill.join(', ')}`);
  for (const pid of pidsToKill) {
    try {
      execSync(`taskkill /F /PID ${pid}`);
      console.log(`  ✓ Killed process ${pid}`);
    } catch {}
  }

  await new Promise(r => setTimeout(r, 1000));

  // Verify server is dead
  let isDead = false;
  try {
    await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  } catch {
    isDead = true;
  }
  if (!isDead) {
    throw new Error('Backend failed to shut down!');
  }
  console.log('  ✓ Verified: Backend process is completely STOPPED and unreachable');

  // 4. Restart backend fresh
  console.log('4. Restarting backend process (node backend/src/server.js)...');
  const serverPath = path.resolve('backend', 'src', 'server.js');
  const newServerProcess = spawn('node', [serverPath], {
    detached: true,
    stdio: 'ignore'
  });
  newServerProcess.unref();

  await waitForServer(5000);
  console.log('  ✓ Backend restarted and listening on port 5000');

  // 5. Query order by ID and product stock
  console.log('5. Verifying order and inventory persistence after restart...');
  const verifyOrderRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/orders/${orderId}`,
    method: 'GET'
  });

  if (verifyOrderRes.status !== 200) {
    throw new Error(`Order ${orderId} NOT found after restart! Status: ${verifyOrderRes.status}`);
  }

  const retrievedOrder = verifyOrderRes.body.data;
  console.log(`  ✓ Persisted order found: ID=${retrievedOrder.id}, Reference=${retrievedOrder.order_reference}, Status=${retrievedOrder.status}`);

  const verifyProdRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/products/1',
    method: 'GET'
  });
  const currentStock = verifyProdRes.body.data.stock;
  console.log(`  ✓ Persisted stock for Product 1: ${currentStock} (Expected: ${expectedStock})`);

  if (retrievedOrder.order_reference === orderRef && currentStock === expectedStock) {
    console.log('\n======================================================');
    console.log('✓ PASS: SERVER RESTART PERSISTENCE FULLY VERIFIED!');
    console.log('======================================================\n');
  } else {
    throw new Error('Data discrepancy detected after server restart!');
  }
}

runRestartTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
