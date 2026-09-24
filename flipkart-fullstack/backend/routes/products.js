const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper to safely parse JSON columns
function formatProduct(p) {
  if (!p) return null;
  return {
    ...p,
    images: p.images ? JSON.parse(p.images) : [p.thumbnail],
    highlights: p.highlights ? JSON.parse(p.highlights) : [],
    specifications: p.specifications ? JSON.parse(p.specifications) : {},
    is_assured: Boolean(p.is_assured),
    in_stock: Boolean(p.in_stock)
  };
}

// GET /api/products/suggestions?q=...
router.get('/suggestions', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, suggestions: [] });

    const sql = `
      SELECT DISTINCT title, brand FROM products 
      WHERE title LIKE ? OR brand LIKE ? 
      LIMIT 8
    `;
    const searchPattern = `%${q}%`;
    const rows = db.query(sql, [searchPattern, searchPattern]);
    
    const suggestions = rows.map(r => r.title);
    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/featured
router.get('/featured', (req, res) => {
  try {
    const dealsOfDay = db.query("SELECT * FROM products WHERE deal_tag = 'Deal of the Day' LIMIT 8").map(formatProduct);
    const topOffers = db.query("SELECT * FROM products WHERE deal_tag = 'Top Offer' LIMIT 8").map(formatProduct);
    const bestSellers = db.query("SELECT * FROM products WHERE deal_tag = 'Best Seller' LIMIT 8").map(formatProduct);
    const trending = db.query("SELECT * FROM products WHERE deal_tag = 'Trending' LIMIT 8").map(formatProduct);

    res.json({
      success: true,
      data: {
        dealsOfDay,
        topOffers,
        bestSellers,
        trending
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products
router.get('/', (req, res) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      deal_tag,
      sort,
      limit = 20,
      offset = 0
    } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ' AND (p.title LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
      const queryPattern = `%${q}%`;
      params.push(queryPattern, queryPattern, queryPattern);
    }

    if (category) {
      if (isNaN(category)) {
        sql += ' AND c.slug = ?';
        params.push(category.toLowerCase());
      } else {
        sql += ' AND p.category_id = ?';
        params.push(Number(category));
      }
    }

    if (brand) {
      sql += ' AND LOWER(p.brand) = ?';
      params.push(brand.toLowerCase());
    }

    if (minPrice) {
      sql += ' AND p.price >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += ' AND p.price <= ?';
      params.push(Number(maxPrice));
    }

    if (rating) {
      sql += ' AND p.rating >= ?';
      params.push(Number(rating));
    }

    if (deal_tag) {
      sql += ' AND p.deal_tag = ?';
      params.push(deal_tag);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY p.price DESC';
        break;
      case 'rating_desc':
        sql += ' ORDER BY p.rating DESC';
        break;
      case 'discount_desc':
        sql += ' ORDER BY p.discount_percent DESC';
        break;
      case 'newest':
        sql += ' ORDER BY p.id DESC';
        break;
      default:
        sql += ' ORDER BY p.rating_count DESC, p.id ASC';
        break;
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const rows = db.query(sql, params);
    const products = rows.map(formatProduct);

    // Get total count
    let countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const countParams = params.slice(0, -2);
    if (q) countSql += ' AND (p.title LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)';
    if (category) countSql += isNaN(category) ? ' AND c.slug = ?' : ' AND p.category_id = ?';
    if (brand) countSql += ' AND LOWER(p.brand) = ?';
    if (minPrice) countSql += ' AND p.price >= ?';
    if (maxPrice) countSql += ' AND p.price <= ?';
    if (rating) countSql += ' AND p.rating >= ?';
    if (deal_tag) countSql += ' AND p.deal_tag = ?';

    const countRow = db.get(countSql, countParams);

    res.json({
      success: true,
      total: countRow ? countRow.total : products.length,
      limit: Number(limit),
      offset: Number(offset),
      products
    });
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = db.get(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const reviews = db.query('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC', [id]);
    const relatedProducts = db.query(
      'SELECT id, title, brand, price, original_price, discount_percent, rating, rating_count, thumbnail, is_assured FROM products WHERE category_id = ? AND id != ? LIMIT 4',
      [product.category_id, id]
    );

    res.json({
      success: true,
      product: {
        ...formatProduct(product),
        reviews,
        relatedProducts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
