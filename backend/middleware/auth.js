const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../database/db');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = db.get('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access denied: Admin privileges required.' });
    }
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = db.get('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?', [decoded.id]);
      if (user) req.user = user;
    } catch (e) {
      // Ignore invalid token in optionalAuth
    }
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth
};
