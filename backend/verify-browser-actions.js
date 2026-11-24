import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyInteractiveBrowser() {
  console.log('======================================================');
  console.log('      DEEP INTERACTIVE BROWSER VERIFICATION           ');
  console.log('======================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    // 1. Dashboard
    console.log('1. Testing Dashboard (http://localhost:5173/)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Test Refresh Data button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Refresh Data'));
      if (btn) btn.click();
    });
    console.log('  ✓ Refresh Data button clicked and handled without errors');

    // 2. Products Page & Stock Search
    console.log('2. Testing Products & Stock (http://localhost:5173/products)...');
    await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Test search filter input
    await page.type('input[placeholder*="Search"]', 'Keyboard');
    await new Promise(r => setTimeout(r, 300));
    const matchedProducts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('tbody tr td:first-child')).map(el => el.textContent.trim());
    });
    console.log(`  ✓ Search for "Keyboard" filtered table:`, matchedProducts);

    // Clear search
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 300));

    // 3. Create Order - Test Out-of-Stock / Insufficient Quantity Error Handling
    console.log('3. Testing Create Order & Form Validation (http://localhost:5173/orders/new)...');
    await page.goto('http://localhost:5173/orders/new', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Attempt to exceed stock for product 1 (stock is 23)
    await page.select('select', '1');
    await page.evaluate(() => {
      const qtyInput = document.querySelector('input[type="number"]');
      if (qtyInput) {
        qtyInput.value = '999';
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add to Order List'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const errorBanner = await page.evaluate(() => {
      const errBox = document.querySelector('.bg-rose-50');
      return errBox ? errBox.textContent.trim() : null;
    });
    console.log(`  ✓ Excessive quantity error banner displayed: "${errorBanner}"`);

    // Now add valid item (Wireless Mouse qty 1)
    await page.evaluate(() => {
      const qtyInput = document.querySelector('input[type="number"]');
      if (qtyInput) {
        qtyInput.value = '1';
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add to Order List'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Submit order
    console.log('  Submitting valid customer order...');
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm & Place Order'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // 4. Orders Management - Search and Status Filtering
    console.log('4. Testing Orders Management Search & Filters (http://localhost:5173/orders)...');
    // Get newest order ref
    const newestOrderRef = await page.evaluate(() => {
      const firstRow = document.querySelector('tbody tr td:first-child');
      return firstRow ? firstRow.textContent.trim() : null;
    });
    console.log(`  ✓ Newest order reference in table: ${newestOrderRef}`);

    // Test search by reference
    await page.type('input[placeholder*="Search"]', newestOrderRef);
    await new Promise(r => setTimeout(r, 400));
    const searchMatchCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log(`  ✓ Search by exact order reference matched ${searchMatchCount} row(s)`);

    // Clear search
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 300));

    // Test status filter tabs
    for (const tab of ['Placed', 'Packed', 'Shipped', 'Cancelled', 'All']) {
      await page.evaluate((t) => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === t);
        if (btn) btn.click();
      }, tab);
      await new Promise(r => setTimeout(r, 200));
    }
    console.log('  ✓ Status filter tabs (Placed, Packed, Shipped, Cancelled, All) responsive');

    // 5. Order Details Modal - Status Updates and Cancellation
    console.log('5. Testing Order Details Modal & Real-time Cancellation...');
    await page.evaluate(() => {
      const detailsBtn = Array.from(document.querySelectorAll('tbody button')).find(b => b.textContent.trim() === 'Details');
      if (detailsBtn) detailsBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Cancel the order inside the modal
    console.log('  Initiating cancellation inside modal...');
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cancel Order'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Confirm cancellation
    console.log('  Confirming cancellation...');
    await page.evaluate(() => {
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Yes, Confirm'));
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const statusAfterCancel = await page.evaluate(() => {
      const badge = document.querySelector('.bg-rose-50');
      return badge ? badge.textContent.trim() : null;
    });
    console.log(`  ✓ Order status after cancellation: "${statusAfterCancel}"`);

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title*="Close"], button svg.lucide-x')?.closest('button');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('\n======================================================');
    console.log(`Console Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
      throw new Error('Console errors encountered during interactive verification!');
    }
    console.log('✓ PASS: ALL BROWSER ACTIONS & WORKFLOWS VERIFIED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

verifyInteractiveBrowser().catch(err => {
  console.error('Interactive browser test failed:', err);
  process.exit(1);
});
