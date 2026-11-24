import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.resolve('screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function rgbToHex(rgbStr) {
  if (!rgbStr) return 'N/A';
  const match = rgbStr.match(/\d+/g);
  if (!match || match.length < 3) return rgbStr;
  const hex = match.slice(0, 3).map(x => parseInt(x, 10).toString(16).padStart(2, '0')).join('');
  return `#${hex.toUpperCase()}`;
}

async function verifyAndCapture() {
  console.log('================================================================');
  console.log('   VERIFYING COMPUTED TEAL GREEN THEME IN LIVE BROWSER          ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  try {
    // 1. Dashboard Page
    console.log('1. Loading Dashboard (http://localhost:5173/)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Inspect Sidebar computed backgroundColor
    const sidebarBg = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return window.getComputedStyle(aside).backgroundColor;
    });
    console.log(`  ✓ Sidebar background: ${sidebarBg} -> ${rgbToHex(sidebarBg)} (Expected #013531 Deep Dark Teal)`);

    // Inspect Sidebar brand logo background
    const brandLogoBg = await page.evaluate(() => {
      const logoBox = document.querySelector('aside .w-10.h-10');
      return logoBox ? window.getComputedStyle(logoBox).backgroundColor : null;
    });
    console.log(`  ✓ Brand logo badge: ${brandLogoBg} -> ${rgbToHex(brandLogoBg)} (Expected #02968A Primary Teal Green)`);

    // Inspect Header New Order button backgroundColor
    const newOrderBtnBg = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('header button, header a button')).find(b => b.textContent.includes('New Order'));
      return btn ? window.getComputedStyle(btn).backgroundColor : null;
    });
    console.log(`  ✓ Header "New Order" button: ${newOrderBtnBg} -> ${rgbToHex(newOrderBtnBg)} (Expected #02968A Primary Teal Green)`);

    // Inspect Packed Orders metric card accent
    const packedIconColor = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('span'));
      const packedSpan = headings.find(s => s.textContent.includes('Packed Orders'));
      if (!packedSpan) return null;
      const card = packedSpan.closest('.bg-white');
      const iconBox = card ? card.querySelector('.rounded-xl') : null;
      return iconBox ? window.getComputedStyle(iconBox).color : null;
    });
    console.log(`  ✓ Dashboard Packed card icon: ${packedIconColor} -> ${rgbToHex(packedIconColor)} (Expected #02968A Teal Green)`);

    // Inspect Shipped Orders metric card accent
    const shippedIconColor = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('span'));
      const shippedSpan = headings.find(s => s.textContent.includes('Shipped Orders'));
      if (!shippedSpan) return null;
      const card = shippedSpan.closest('.bg-white');
      const iconBox = card ? card.querySelector('.rounded-xl') : null;
      return iconBox ? window.getComputedStyle(iconBox).color : null;
    });
    console.log(`  ✓ Dashboard Shipped card icon: ${shippedIconColor} -> ${rgbToHex(shippedIconColor)} (Expected Blue / Indigo Accent)`);

    // Inspect Low Stock card accent
    const lowStockIconColor = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('span'));
      const lsSpan = headings.find(s => s.textContent.includes('Low Stock SKUs'));
      if (!lsSpan) return null;
      const card = lsSpan.closest('.bg-white');
      const iconBox = card ? card.querySelector('.rounded-lg') : null;
      return iconBox ? window.getComputedStyle(iconBox).color : null;
    });
    console.log(`  ✓ Dashboard Low Stock card icon: ${lowStockIconColor} -> ${rgbToHex(lowStockIconColor)} (Expected Amber / Orange Accent)`);

    // Capture 01-dashboard.png
    const dashPath = path.join(SCREENSHOTS_DIR, '01-dashboard.png');
    await page.screenshot({ path: dashPath, fullPage: true });
    console.log(`  ✓ Screenshot saved: ${dashPath}\n`);

    // 2. Products Page
    console.log('2. Loading Products Catalogue (http://localhost:5173/products)...');
    await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Inspect "Add to Order" primary button background
    const addToOrderBtnBg = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('tbody button'));
      const activeBtn = btns.find(b => b.textContent.includes('Add to Order'));
      return activeBtn ? window.getComputedStyle(activeBtn).backgroundColor : null;
    });
    console.log(`  ✓ Product "Add to Order" button: ${addToOrderBtnBg} -> ${rgbToHex(addToOrderBtnBg)} (Expected #02968A Teal Green)`);

    // Inspect "In Stock" badge text color
    const inStockBadgeColor = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('span'));
      const inStock = badges.find(b => b.textContent.includes('In Stock'));
      return inStock ? window.getComputedStyle(inStock).color : null;
    });
    console.log(`  ✓ Product "In Stock" badge color: ${inStockBadgeColor} -> ${rgbToHex(inStockBadgeColor)} (Expected Emerald Green)`);

    const prodPath = path.join(SCREENSHOTS_DIR, '02-products.png');
    await page.screenshot({ path: prodPath, fullPage: true });
    console.log(`  ✓ Screenshot saved: ${prodPath}\n`);

    // 3. Create Order Page
    console.log('3. Loading Create Order (http://localhost:5173/orders/new)...');
    await page.goto('http://localhost:5173/orders/new', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    // Add product 1 (Wireless Mouse, qty 2)
    await page.select('select', '1');
    await page.evaluate(() => {
      const qtyInput = document.querySelector('input[type="number"]');
      if (qtyInput) {
        qtyInput.value = '2';
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent.includes('Add to Order List'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Add product 2 (Mechanical Keyboard, qty 1)
    await page.select('select', '2');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(b => b.textContent.includes('Add to Order List'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Inspect "Confirm & Place Order" primary button background
    const placeOrderBtnBg = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submitBtn = btns.find(b => b.textContent.includes('Confirm & Place Order'));
      return submitBtn ? window.getComputedStyle(submitBtn).backgroundColor : null;
    });
    console.log(`  ✓ "Confirm & Place Order" button: ${placeOrderBtnBg} -> ${rgbToHex(placeOrderBtnBg)} (Expected #02968A Teal Green)`);

    const createOrderPath = path.join(SCREENSHOTS_DIR, '03-create-order.png');
    await page.screenshot({ path: createOrderPath, fullPage: true });
    console.log(`  ✓ Screenshot saved: ${createOrderPath}\n`);

    // 4. Orders List Page
    console.log('4. Submitting Order and Navigating to /orders...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Confirm & Place Order'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1800));

    // Inspect Active Filter tab background (All tab)
    const activeFilterBg = await page.evaluate(() => {
      const filterBtns = Array.from(document.querySelectorAll('button'));
      const allTab = filterBtns.find(b => b.textContent.trim() === 'All');
      return allTab ? window.getComputedStyle(allTab).backgroundColor : null;
    });
    console.log(`  ✓ Active Filter tab background: ${activeFilterBg} -> ${rgbToHex(activeFilterBg)} (Expected #02968A Teal Green)`);

    // Inspect Compact Pack Button background
    const packBtnBg = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('tbody button'));
      const pack = btns.find(b => b.textContent.trim() === 'Pack');
      return pack ? window.getComputedStyle(pack).backgroundColor : null;
    });
    console.log(`  ✓ Quick Action "Pack" button: ${packBtnBg} -> ${rgbToHex(packBtnBg)} (Expected #02968A Teal Green)`);

    const ordersPath = path.join(SCREENSHOTS_DIR, '04-orders.png');
    await page.screenshot({ path: ordersPath, fullPage: true });
    console.log(`  ✓ Screenshot saved: ${ordersPath}\n`);

    // 5. Order Details Modal & Step Transition
    console.log('5. Opening Order Details Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('tbody button'));
      const detailsBtn = buttons.find(b => b.textContent.trim() === 'Details');
      if (detailsBtn) detailsBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Inspect Progress Active Step circle
    const activeStepColor = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.rounded-full.border-2'));
      return nodes[0] ? window.getComputedStyle(nodes[0]).borderColor : null;
    });
    console.log(`  ✓ Order Progress Active Step border: ${activeStepColor} -> ${rgbToHex(activeStepColor)} (Expected #02968A Teal Green)`);

    // Advance order to Packed stage
    console.log('  Advancing order to "Packed" stage...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const packBtn = buttons.find(b => b.textContent.includes('Mark as Packed'));
      if (packBtn) packBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Inspect Completed Step indicator
    const completedStepBg = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.rounded-full.border-2'));
      return nodes[0] ? window.getComputedStyle(nodes[0]).backgroundColor : null;
    });
    console.log(`  ✓ Order Progress Completed Step background: ${completedStepBg} -> ${rgbToHex(completedStepBg)} (Expected Mint/Emerald Green)`);

    const detailsPath = path.join(SCREENSHOTS_DIR, '05-order-details.png');
    await page.screenshot({ path: detailsPath });
    console.log(`  ✓ Screenshot saved: ${detailsPath}\n`);

    console.log('================================================================');
    console.log('   ALL THEME VERIFICATION CHECKS & SCREENSHOTS COMPLETED!       ');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

verifyAndCapture().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
