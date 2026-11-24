import Database from './sqlite-adapter.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DEFAULT_DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'commerce.db');

export function createDatabaseConnection(dbPath = DEFAULT_DB_PATH) {
  // Ensure directory exists if not memory
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON;');
  db.pragma('journal_mode = WAL;');

  // Run schema initialization
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schemaSql);

  return db;
}

let defaultDbInstance = null;

export function getDb() {
  if (!defaultDbInstance) {
    defaultDbInstance = createDatabaseConnection();
  }
  return defaultDbInstance;
}

export default getDb;
