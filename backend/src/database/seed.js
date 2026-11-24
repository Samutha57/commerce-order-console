import { getDb, createDatabaseConnection } from './db.js';

export const SEED_PRODUCTS = [
  { sku: 'WM-001', name: 'Wireless Mouse', price: 599, stock: 25 },
  { sku: 'MK-002', name: 'Mechanical Keyboard', price: 1499, stock: 10 },
  { sku: 'UCH-003', name: 'USB-C Hub', price: 899, stock: 15 },
  { sku: 'LS-004', name: 'Laptop Stand', price: 799, stock: 8 },
  { sku: 'WHD-005', name: 'Webcam HD', price: 1299, stock: 0 }
];

export function seedDatabase(db = getDb(), { force = false } = {}) {
  const insertProduct = db.prepare(`
    INSERT INTO products (sku, name, price, stock)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(sku) DO UPDATE SET
      name = excluded.name,
      price = excluded.price,
      stock = excluded.stock
  `);

  if (force) {
    db.exec('DELETE FROM order_items;');
    db.exec('DELETE FROM orders;');
    db.exec('DELETE FROM products;');
    try {
      db.exec("DELETE FROM sqlite_sequence WHERE name IN ('products', 'orders', 'order_items');");
    } catch (e) {
      // ignore if sqlite_sequence does not exist
    }
  }

  const seedTx = db.transaction((products) => {
    for (const p of products) {
      insertProduct.run(p.sku, p.name, p.price, p.stock);
    }
  });

  seedTx(SEED_PRODUCTS);
  return db.prepare('SELECT * FROM products').all();
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  console.log('Seeding database...');
  const force = process.argv.includes('--force');
  const products = seedDatabase(getDb(), { force });
  console.log(`Database seeded with ${products.length} products:`);
  console.table(products);
}
