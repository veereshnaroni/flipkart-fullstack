const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');

// Initialize database
require('./database/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Flipkart Full-Stack Clone',
    timestamp: new Date().toISOString(),
    database: 'SQLite (node:sqlite)',
    nodeVersion: process.version
  });
});

// Serve frontend static files
app.use(express.static(config.FRONTEND_DIR));

// Fallback to index.html for SPA frontend routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(config.FRONTEND_DIR, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server!',
    error: err.message
  });
});

// Start listening
const server = app.listen(config.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Flipkart Full-Stack Server running on port ${config.PORT}`);
  console.log(`🌐 Local Web App: http://localhost:${config.PORT}`);
  console.log(`🔌 REST API Base: http://localhost:${config.PORT}/api`);
  console.log(`💾 SQLite Database connected at: ${config.DB_PATH}`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
