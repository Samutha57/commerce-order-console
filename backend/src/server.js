import app from './app.js';
import { getDb } from './database/db.js';
import { seedDatabase } from './database/seed.js';

const PORT = process.env.PORT || 5000;

// Ensure database has seed products on startup
const db = getDb();
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
if (productCount === 0) {
  console.log('No products detected. Seeding initial catalogue...');
  seedDatabase(db);
}

app.listen(PORT, () => {
  console.log(`Commerce Order Console Backend running on http://localhost:${PORT}`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
});
