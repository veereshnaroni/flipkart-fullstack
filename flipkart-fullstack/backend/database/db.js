const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Ensure database directory exists
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

function getDatabase() {
  if (dbInstance) return dbInstance;

  try {
    const { DatabaseSync } = require('node:sqlite');
    dbInstance = new DatabaseSync(config.DB_PATH);
    // Enable WAL mode for better concurrency and performance
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    console.log('[DB] Connected to SQLite database at:', config.DB_PATH);
  } catch (err) {
    console.error('[DB Error] Failed to initialize node:sqlite:', err.message);
    throw err;
  }

  return dbInstance;
}

const db = getDatabase();

function initSchema() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      image TEXT,
      banner TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT,
      brand TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      discount_percent INTEGER NOT NULL,
      rating REAL DEFAULT 4.0,
      rating_count INTEGER DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      is_assured INTEGER DEFAULT 1,
      in_stock INTEGER DEFAULT 1,
      stock_quantity INTEGER DEFAULT 50,
      thumbnail TEXT NOT NULL,
      images TEXT,
      description TEXT,
      highlights TEXT,
      specifications TEXT,
      deal_tag TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      delivery_charges REAL DEFAULT 0,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'COMPLETED',
      order_status TEXT DEFAULT 'ORDERED',
      shipping_address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_title TEXT NOT NULL,
      product_thumbnail TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT NOT NULL,
      comment TEXT NOT NULL,
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );
  `;

  db.exec(schema);
  console.log('[DB] Database schema verified/initialized successfully.');
}

// Helper methods for clean SQL execution
const dbHelper = {
  raw: db,
  initSchema,
  
  query(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },

  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  exec(sql) {
    return db.exec(sql);
  }
};

// Initialize schema on load
initSchema();

module.exports = dbHelper;
