const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/categories
router.get('/', (req, res) => {
  try {
    const categories = db.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    res.json({
      success: true,
      categories
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/categories/:slug
router.get('/:slug', (req, res) => {
  try {
    const category = db.get('SELECT * FROM categories WHERE slug = ?', [req.params.slug.toLowerCase()]);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const products = db.query('SELECT * FROM products WHERE category_id = ?', [category.id]);
    res.json({
      success: true,
      category,
      products
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
