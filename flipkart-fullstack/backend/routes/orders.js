const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// POST /api/orders - Create new order
router.post('/', requireAuth, (req, res) => {
  try {
    const { address, paymentMethod, directItem } = req.body;

    if (!address || !address.name || !address.phone || !address.address) {
      return res.status(400).json({ success: false, message: 'Please provide complete delivery address.' });
    }

    let itemsToOrder = [];

    if (directItem) {
      // Direct "BUY NOW" flow
      const prod = db.get('SELECT * FROM products WHERE id = ?', [directItem.productId]);
      if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });
      itemsToOrder.push({
        product_id: prod.id,
        title: prod.title,
        thumbnail: prod.thumbnail,
        price: prod.price,
        original_price: prod.original_price,
        quantity: directItem.quantity || 1
      });
    } else {
      // Order from cart
      const cartRows = db.query(`
        SELECT 
          ci.quantity,
          p.id as product_id,
          p.title,
          p.thumbnail,
          p.price,
          p.original_price
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `, [req.user.id]);

      if (cartRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty.' });
      }

      itemsToOrder = cartRows;
    }

    let totalAmount = 0;
    let totalMRP = 0;
    for (const item of itemsToOrder) {
      totalAmount += item.price * item.quantity;
      totalMRP += item.original_price * item.quantity;
    }

    const discountAmount = totalMRP - totalAmount;
    const deliveryCharges = totalAmount >= 500 ? 0 : 40;
    const finalAmount = totalAmount + deliveryCharges;

    // Generate Flipkart-style order ID
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderId = `OD${Date.now().toString().slice(-6)}${randomSuffix}`;

    const orderRes = db.run(`
      INSERT INTO orders (
        order_id, user_id, total_amount, discount_amount, delivery_charges,
        payment_method, payment_status, order_status, shipping_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      req.user.id,
      finalAmount,
      discountAmount,
      deliveryCharges,
      paymentMethod || 'UPI',
      'COMPLETED',
      'ORDERED',
      JSON.stringify(address)
    ]);

    const newOrderId = orderRes.lastInsertRowid;

    // Insert order items
    const insertItem = db.raw.prepare(`
      INSERT INTO order_items (order_id, product_id, product_title, product_thumbnail, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of itemsToOrder) {
      insertItem.run(newOrderId, item.product_id, item.title, item.thumbnail, item.price, item.quantity);
    }

    // Clear cart if ordered through cart
    if (!directItem) {
      db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Flipkart will deliver soon.',
      order: {
        id: newOrderId,
        order_id: orderId,
        total_amount: finalAmount,
        order_status: 'ORDERED',
        delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString()
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders - Get user orders
router.get('/', requireAuth, (req, res) => {
  try {
    const orders = db.query(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY id DESC
    `, [req.user.id]);

    const enrichedOrders = orders.map(order => {
      const items = db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      return {
        ...order,
        shipping_address: JSON.parse(order.shipping_address),
        items
      };
    });

    res.json({
      success: true,
      orders: enrichedOrders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const order = db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const items = db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    res.json({
      success: true,
      order: {
        ...order,
        shipping_address: JSON.parse(order.shipping_address),
        items
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', requireAuth, (req, res) => {
  try {
    const order = db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.order_status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled.' });
    }

    db.run('UPDATE orders SET order_status = ? WHERE id = ?', ['CANCELLED', req.params.id]);
    res.json({ success: true, message: 'Order cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
