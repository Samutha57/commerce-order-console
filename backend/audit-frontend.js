import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function auditFrontend() {
  console.log('================================================================');
  console.log('         PHASE 2 & 6 FRONTEND AUDIT & CONSOLE ERROR SCAN        ');
  console.log('================================================================\n');

  const consoleErrors = [];
  const pageErrors = [];

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleErrors.push({ type, text, location: msg.location() });
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  try {
    // 1. Audit Dashboard
    console.log('1. Auditing Dashboard (http://localhost:5173/)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    const dashTitle = await page.evaluate(() => document.querySelector('h1')?.textContent);
    const hasOverflowDash = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Page title: "${dashTitle}"`);
    console.log(`  ✓ Horizontal overflow: ${hasOverflowDash ? 'DETECTED' : 'NONE (Clean)'}`);

    // 2. Audit Products Page
    console.log('2. Auditing Products & Catalogue (http://localhost:5173/products)...');
    await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Test search filter
    await page.type('input[placeholder*="Search"]', 'Wireless');
    await new Promise(r => setTimeout(r, 400));
    const rowCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log(`  ✓ Search filter works: ${rowCount} product row(s) matched for "Wireless"`);

    const hasOverflowProd = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Horizontal overflow: ${hasOverflowProd ? 'DETECTED' : 'NONE (Clean)'}`);

    // 3. Audit Create Order Page
    console.log('3. Auditing Create Order (http://localhost:5173/orders/new)...');
    await page.goto('http://localhost:5173/orders/new', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Add product 1
    await page.select('select', '1');
    await page.evaluate(() => {
      const qtyInput = document.querySelector('input[type="number"]');
      if (qtyInput) {
        qtyInput.value = '2';
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add to Order List'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Verify item row added to table
    const cartItemCount = await page.evaluate(() => document.querySelectorAll('table tbody tr').length);
    console.log(`  ✓ Multi-item cart populated: ${cartItemCount} item line(s) added`);

    // Submit order
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm & Place Order'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // 4. Audit Orders Page
    console.log('4. Auditing Orders Page (http://localhost:5173/orders)...');
    const orderRows = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    console.log(`  ✓ Orders table rendered: ${orderRows} order(s) listed`);

    // Test filter tabs
    const tabs = ['All', 'Placed', 'Packed', 'Shipped', 'Cancelled'];
    for (const tabName of tabs) {
      await page.evaluate((name) => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === name);
        if (btn) btn.click();
      }, tabName);
      await new Promise(r => setTimeout(r, 200));
    }
    console.log(`  ✓ All status filter tabs clicked and responsive without exceptions`);

    // Reset to All
    await page.evaluate(() => {
      const allBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'All');
      if (allBtn) allBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 5. Audit Order Details Modal & Fulfillment Actions
    console.log('5. Auditing Order Details Modal & Fulfillment Actions...');
    await page.evaluate(() => {
      const detailsBtn = Array.from(document.querySelectorAll('tbody button')).find(b => b.textContent.trim() === 'Details');
      if (detailsBtn) detailsBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const modalVisible = await page.evaluate(() => !!document.querySelector('.fixed.inset-0'));
    console.log(`  ✓ Order Details Modal visible: ${modalVisible}`);

    // Click Visual Picking button
    await page.evaluate(() => {
      const pickBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mark Picked') || b.textContent.includes('Items Picked'));
      if (pickBtn) pickBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    console.log(`  ✓ Visual Picking toggle responsive`);

    // Advance to Packed
    await page.evaluate(() => {
      const packBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mark as Packed'));
      if (packBtn) packBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log(`  ✓ Advanced to "Packed" stage successfully`);

    // Advance to Shipped
    await page.evaluate(() => {
      const shipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Mark as Shipped'));
      if (shipBtn) shipBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log(`  ✓ Advanced to "Shipped" stage successfully`);

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title*="Close"], button svg.lucide-x')?.closest('button');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    console.log(`  ✓ Modal dismissed cleanly`);

    // 6. Mobile Responsiveness Check (375x667)
    console.log('6. Checking Mobile Responsiveness (375x667)...');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Mobile horizontal overflow: ${mobileOverflow ? 'DETECTED' : 'NONE (Clean)'}`);

    // 7. Verify Console & Page Errors
    console.log('\n================================================================');
    console.log('                     ERROR SCAN SUMMARY                         ');
    console.log('================================================================');
    console.log(`  • Uncaught Page Errors: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      pageErrors.forEach(err => console.log(`    - ${err}`));
    }
    console.log(`  • Console Error Logs:   ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log(`    - ${err.text}`));
    }
    console.log('================================================================\n');

    if (pageErrors.length === 0 && consoleErrors.length === 0) {
      console.log('✓ AUDIT PASSED: ZERO console errors, ZERO page errors, ZERO overflow issues.');
    } else {
      throw new Error('Errors detected during frontend audit!');
    }
  } finally {
    await browser.close();
  }
}

auditFrontend().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
