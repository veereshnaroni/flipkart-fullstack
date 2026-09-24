const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/reviews/product/:productId
router.get('/product/:productId', (req, res) => {
  try {
    const reviews = db.query('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC', [req.params.productId]);
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reviews
router.post('/', requireAuth, (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide product ID, rating, title, and review comment.' });
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating)));

    db.run(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [productId, req.user.id, req.user.name, numericRating, title, comment]);

    // Recalculate average rating & counts for the product
    const stats = db.get('SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE product_id = ?', [productId]);
    if (stats) {
      const newRating = Number(stats.avg_rating.toFixed(1));
      db.run('UPDATE products SET rating = ?, review_count = review_count + 1 WHERE id = ?', [newRating, productId]);
    }

    res.status(201).json({ success: true, message: 'Review submitted successfully! Thank you for your feedback.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
