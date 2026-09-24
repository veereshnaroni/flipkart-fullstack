const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

function calculateCartTotals(items) {
  let totalMRP = 0;
  let totalAmount = 0;
  let itemCount = 0;

  for (const item of items) {
    totalMRP += item.original_price * item.quantity;
    totalAmount += item.price * item.quantity;
    itemCount += item.quantity;
  }

  const discount = totalMRP - totalAmount;
  // Delivery is FREE for orders above ₹500, else ₹40
  const deliveryCharges = totalAmount >= 500 || totalAmount === 0 ? 0 : 40;
  const finalPayable = totalAmount + deliveryCharges;

  return {
    itemCount,
    totalMRP,
    discount,
    deliveryCharges,
    totalAmount: finalPayable,
    savings: discount + (deliveryCharges === 0 && totalAmount > 0 ? 40 : 0)
  };
}

// GET /api/cart
router.get('/', requireAuth, (req, res) => {
  try {
    const items = db.query(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.created_at,
        p.id as product_id,
        p.title,
        p.brand,
        p.price,
        p.original_price,
        p.discount_percent,
        p.thumbnail,
        p.rating,
        p.is_assured,
        p.in_stock,
        p.stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.id DESC
    `, [req.user.id]);

    const summary = calculateCartTotals(items);

    res.json({
      success: true,
      items,
      summary
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart
router.post('/', requireAuth, (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = db.get('SELECT id, title, price, in_stock FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (!product.in_stock) {
      return res.status(400).json({ success: false, message: 'Product is currently out of stock.' });
    }

    // Check if already in cart
    const existing = db.get('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    if (existing) {
      const newQty = existing.quantity + Number(quantity);
      db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      db.run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, productId, Number(quantity)]);
    }

    res.json({
      success: true,
      message: `Added "${product.title}" to cart!`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cart/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const cartItemId = Number(req.params.id);
    const { quantity } = req.body;

    if (quantity <= 0) {
      db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartItemId, req.user.id]);
      return res.json({ success: true, message: 'Item removed from cart.' });
    }

    db.run('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [Number(quantity), cartItemId, req.user.id]);
    res.json({ success: true, message: 'Cart quantity updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const cartItemId = Number(req.params.id);
    db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartItemId, req.user.id]);
    res.json({ success: true, message: 'Item removed from your cart.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart (clear all)
router.delete('/', requireAuth, (req, res) => {
  try {
    db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
