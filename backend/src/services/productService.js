import { getDb } from '../database/db.js';

export class ProductService {
  constructor(db = getDb()) {
    this.db = db;
  }

  getAllProducts() {
    const stmt = this.db.prepare(`
      SELECT 
        id, 
        sku, 
        name, 
        price, 
        stock, 
        created_at,
        CASE 
          WHEN stock = 0 THEN 'OUT_OF_STOCK'
          WHEN stock <= 5 THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END as stock_status
      FROM products
      ORDER BY id ASC
    `);
    return stmt.all();
  }

  getProductById(id) {
    const stmt = this.db.prepare(`
      SELECT 
        id, 
        sku, 
        name, 
        price, 
        stock, 
        created_at,
        CASE 
          WHEN stock = 0 THEN 'OUT_OF_STOCK'
          WHEN stock <= 5 THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END as stock_status
      FROM products
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  getInventory() {
    const stmt = this.db.prepare(`
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.price,
        p.stock as available_stock,
        COALESCE(SUM(CASE WHEN o.status IN ('Placed', 'Packed') THEN oi.quantity ELSE 0 END), 0) as reserved_stock,
        CASE 
          WHEN p.stock = 0 THEN 'OUT_OF_STOCK'
          WHEN p.stock <= 5 THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END as stock_status
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);
    return stmt.all();
  }
}

export default new ProductService();
