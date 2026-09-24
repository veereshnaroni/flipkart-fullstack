const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/stats', requireAdmin, (req, res) => {
  try {
    const totalProducts = db.get('SELECT COUNT(*) as count FROM products').count;
    const totalOrders = db.get('SELECT COUNT(*) as count FROM orders').count;
    const totalUsers = db.get('SELECT COUNT(*) as count FROM users WHERE role = "customer"').count;
    const revenueRow = db.get('SELECT SUM(total_amount) as total FROM orders WHERE order_status != "CANCELLED"');
    const totalRevenue = revenueRow ? revenueRow.total || 0 : 0;

    const recentOrders = db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
      LIMIT 10
    `).map(ord => ({
      ...ord,
      shipping_address: JSON.parse(ord.shipping_address)
    }));

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: Math.round(totalRevenue)
      },
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/orders
router.get('/orders', requireAdmin, (req, res) => {
  try {
    const orders = db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
    `).map(ord => {
      const items = db.query('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
      return {
        ...ord,
        shipping_address: JSON.parse(ord.shipping_address),
        items
      };
    });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['ORDERED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    db.run('UPDATE orders SET order_status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/products
router.post('/products', requireAdmin, (req, res) => {
  try {
    const {
      title,
      brand,
      category_id,
      price,
      original_price,
      discount_percent,
      thumbnail,
      description,
      deal_tag = 'Top Offer',
      stock_quantity = 50
    } = req.body;

    if (!title || !brand || !category_id || !price) {
      return res.status(400).json({ success: false, message: 'Required fields missing: title, brand, category_id, price' });
    }

    const calculatedDiscount = original_price && original_price > price
      ? Math.round(((original_price - price) / original_price) * 100)
      : (discount_percent || 0);

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const result = db.run(`
      INSERT INTO products (
        title, slug, brand, category_id, price, original_price, discount_percent,
        rating, rating_count, review_count, is_assured, in_stock, stock_quantity,
        thumbnail, images, description, highlights, specifications, deal_tag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      slug,
      brand,
      Number(category_id),
      Number(price),
      Number(original_price || price),
      calculatedDiscount,
      4.5,
      1,
      0,
      1,
      1,
      Number(stock_quantity),
      thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      JSON.stringify([thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']),
      description || 'High quality product on Flipkart.',
      JSON.stringify(['1 Year Warranty', 'Genuine Quality', 'Fast Shipping']),
      JSON.stringify({ 'Brand': brand, 'Condition': 'Brand New' }),
      deal_tag
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      productId: result.lastInsertRowid
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
