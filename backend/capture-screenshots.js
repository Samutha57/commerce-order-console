import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.resolve('screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chrome for updated screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  try {
    // 1. Dashboard
    console.log('Navigating to Dashboard...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    const dashPath = path.join(SCREENSHOTS_DIR, '01-dashboard.png');
    await page.screenshot({ path: dashPath, fullPage: true });
    console.log('✓ Captured:', dashPath);

    // 2. Product Catalogue
    console.log('Navigating to Products Catalogue...');
    await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    const prodPath = path.join(SCREENSHOTS_DIR, '02-products.png');
    await page.screenshot({ path: prodPath, fullPage: true });
    console.log('✓ Captured:', prodPath);

    // 3. Create Order
    console.log('Navigating to Create Order...');
    await page.goto('http://localhost:5173/orders/new', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));

    // Fill form: Add product 1 (Wireless Mouse)
    await page.select('select', '1');
    await page.evaluate(() => {
      const qtyInput = document.querySelector('input[type="number"]');
      if (qtyInput) {
        qtyInput.value = '2';
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    // Click Add to Order List button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent.includes('Add to Order List'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Add product 2 (Mechanical Keyboard)
    await page.select('select', '2');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent.includes('Add to Order List'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const createOrderPath = path.join(SCREENSHOTS_DIR, '03-create-order.png');
    await page.screenshot({ path: createOrderPath, fullPage: true });
    console.log('✓ Captured:', createOrderPath);

    // 4. Place Order & View Orders List
    console.log('Submitting order...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Confirm & Place Order'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Should now be on /orders
    const ordersPath = path.join(SCREENSHOTS_DIR, '04-orders.png');
    await page.screenshot({ path: ordersPath, fullPage: true });
    console.log('✓ Captured:', ordersPath);

    // 5. Open Order Details Modal & Advance to Packed
    console.log('Opening Order Details Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const viewBtn = buttons.find(b => b.textContent.trim() === 'Details');
      if (viewBtn) viewBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click "Mark as Packed"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const packBtn = buttons.find(b => b.textContent.includes('Mark as Packed'));
      if (packBtn) packBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const detailsPath = path.join(SCREENSHOTS_DIR, '05-order-details.png');
    await page.screenshot({ path: detailsPath });
    console.log('✓ Captured:', detailsPath);

    console.log('\n--- ALL UPDATED SCREENSHOTS SUCCESSFULLY CAPTURED! ---');
  } finally {
    await browser.close();
  }
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
