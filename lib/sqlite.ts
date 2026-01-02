import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getLocalDB(): Database.Database {
  if (!db) {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'installments.db');
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Initialize tables
    initializeTables();
  }
  
  return db;
}

function initializeTables() {
  if (!db) return;

  // Create profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    )
  `);

  // Create customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      total_amount REAL NOT NULL,
      installment_amount REAL NOT NULL,
      photo_url TEXT,
      document_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
    )
  `);

  // Create installments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS installments (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_profile_id ON customers(profile_id);
    CREATE INDEX IF NOT EXISTS idx_installments_customer_id ON installments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_installments_date ON installments(date);
  `);

  // Create sync metadata table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      table_name TEXT PRIMARY KEY,
      last_sync TEXT,
      sync_status TEXT DEFAULT 'pending'
    )
  `);
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}

// Graceful shutdown
process.on('exit', closeDB);
process.on('SIGINT', closeDB);
process.on('SIGTERM', closeDB);