# 🛒 Flipkart Full-Stack E-Commerce Platform

A production-ready, full-stack Flipkart clone with a pixel-perfect **Frontend**, robust **Node.js/Express REST API Backend**, and a pre-seeded **SQLite Database**.

---

## 🌟 Key Features

### 🎨 Frontend Experience (Flipkart Iconic UI)
- **Signature Flipkart Branding**: Official Flipkart Blue (`#2874f0`), Yellow (`#ff9f00`), Orange (`#fb641b`), Green (`#388e3c`), and *Explore Plus* gold badge.
- **Smart Search Bar**: Instant real-time autocomplete suggestions with debouncing and keyword filtering.
- **Interactive Hero Carousel**: Auto-sliding promotional banners with custom pause, navigation arrows, and indicator dots.
- **Live Deal Countdown Timer**: Real-time ticking timer for *Deals of the Day*.
- **Category Navigation**: 7 categories (Mobiles, Electronics, TVs & Appliances, Fashion, Home & Furniture, Beauty & Grooming, Grocery) with custom icons.
- **Catalog & Advanced Filters**:
  - Filter by price range (Under ₹5,000 to >₹60,000)
  - Filter by Customer Ratings (4★ and above, 3★ and above)
  - Flipkart Assured filter toggle
  - Sort by Popularity, Price (Low to High / High to Low), Customer Rating, Discount, and Newest.
- **Product Detail Modal (PDP)**:
  - High-resolution product image gallery with thumbnail previews
  - Flipkart Assured badge & verified ratings breakdown
  - Bank offers list (Flipkart Axis Bank Card, ICICI/HDFC instant discount)
  - Interactive PIN code delivery checker (e.g. `560001`)
  - Full specifications table & key highlights list
  - Verified customer reviews & interactive review submission form
  - Dual action buttons: **ADD TO CART** (Yellow) and **BUY NOW** (Orange with lightning bolt icon)
- **Cart & Dynamic Pricing**:
  - Quantity controls (+/-) with live totals
  - Price details card: Total MRP, Discount savings, FREE delivery logic (for orders ≥ ₹500), and green "You will save ₹..." summary.
- **Multi-Step Checkout & Orders**:
  - Delivery address form (Home / Work tag, PIN code, contact info)
  - Payment simulation: UPI (Google Pay, PhonePe, Paytm, QR code), Credit/Debit Card, Net Banking, and Cash on Delivery (COD)
  - **Celebration Confetti Animation** upon placing an order
  - Visual Order Tracking timeline (Ordered ➔ Packed ➔ Shipped ➔ Delivered)
  - Order cancellation support
- **Store Admin Panel**:
  - Real-time sales metrics (Total Revenue, Orders, Catalog Products, Active Customers)
  - Product Catalog Manager: Add new products with image URL, title, price, brand, category, and deal tags
  - Order Fulfillment Manager: Live status dropdown (`ORDERED` ➔ `PACKED` ➔ `SHIPPED` ➔ `DELIVERED` ➔ `CANCELLED`)

---

## 🏗️ Architecture & Directory Structure

```text
flipkart-fullstack/
├── backend/
│   ├── config/
│   │   └── config.js            # Port, JWT secret, DB path configuration
│   ├── database/
│   │   ├── db.js                # SQLite database helper with auto-schema creation
│   │   ├── seed.js              # Catalog seeder with 18+ authentic Indian products
│   │   └── flipkart.sqlite      # Persistent SQLite database file
│   ├── middleware/
│   │   └── auth.js              # JWT verification & role authorization (customer / admin)
│   ├── routes/
│   │   ├── auth.js              # /api/auth (Login, Register, Demo 1-Click Login, Profile)
│   │   ├── products.js          # /api/products (List, Search, Filter, Sort, Detail, Featured)
│   │   ├── categories.js        # /api/categories (List with product counts, Detail)
│   │   ├── cart.js              # /api/cart (Add, Update qty, Remove, Price totals)
│   │   ├── orders.js            # /api/orders (Create order, Order history, Cancel order)
│   │   ├── reviews.js           # /api/reviews (Get reviews, Submit review & recalculate rating)
│   │   └── admin.js             # /api/admin (Store stats, Product CRUD, Order fulfillment)
│   ├── server.js                # Express app entrypoint & static frontend server
│   ├── package.json             # Backend dependencies
│   └── .env                     # Environment variables
├── frontend/
│   ├── css/
│   │   ├── style.css            # Flipkart colors, typography, header, carousel, footer
│   │   └── components.css       # Cards, modals, drawers, checkout, tables, toasts
│   ├── js/
│   │   ├── api.js               # Centralized REST API client with JWT handling
│   │   ├── auth.js              # Authentication, login modal, session persistence
│   │   ├── cart.js              # Cart management, quantity sync, price breakdown
│   │   ├── checkout.js          # Multi-step checkout, payment simulation, confetti, tracking
│   │   ├── admin.js             # Store admin dashboard, metrics, order fulfillment
│   │   └── app.js               # Main app router, deals timer, search autocomplete, PDP
│   └── index.html               # Flipkart App Shell
├── start.bat                    # 1-Click Windows Launcher
├── start.sh                     # 1-Click Linux / Mac Launcher
├── package.json                 # Root orchestration scripts
└── README.md                    # Project documentation
```

---

## ⚡ Quick Start Guide

### Option 1: 1-Click Launcher (Recommended)

- **On Windows**: Simply double-click `start.bat`.
- **On macOS / Linux**: Run `./start.sh` in your terminal.

The launcher will verify dependencies, auto-seed the SQLite database, boot the server on `http://localhost:5000`, and open your browser automatically.

---

### Option 2: Standard NPM Commands

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Seed the Database** (Initializes SQLite with products, users & categories):
   ```bash
   npm run seed
   ```

3. **Start the Application**:
   ```bash
   npm start
   ```

4. **Open in Browser**:
   Visit [http://localhost:5000](http://localhost:5000)

---

## 🔑 Demo Accounts & Credentials

The application includes 1-click demo login buttons directly inside the Login modal:

| Role | Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Customer** | `user@flipkart.com` | `user123` | Browsing, Add to Cart, Buy Now, Reviews, Orders History |
| **Admin** | `admin@flipkart.com` | `admin123` | Store Analytics, Add/Delete Products, Change Order Status |

*(You can also register a new account anytime with your own email and password).*

---

## 🔌 REST API Reference

All API routes are prefixed with `/api`.

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` - Create customer account
- `POST /api/auth/login` - Authenticate with email/mobile and password
- `POST /api/auth/demo-login` - 1-Click instant login for `'customer'` or `'admin'`
- `GET /api/auth/me` - Get current authenticated user profile
- `PUT /api/auth/profile` - Update profile name and phone

### 2. Products (`/api/products`)
- `GET /api/products` - Filtered list (queries: `q`, `category`, `minPrice`, `maxPrice`, `rating`, `deal_tag`, `sort`, `limit`, `offset`)
- `GET /api/products/featured` - Grouped by Deals of the Day, Top Offers, Best Sellers, Trending
- `GET /api/products/suggestions?q=...` - Autocomplete suggestions
- `GET /api/products/:id` - Full product details with images, specs, reviews, and related products

### 3. Categories (`/api/categories`)
- `GET /api/categories` - All categories with product counts
- `GET /api/categories/:slug` - Category details and products

### 4. Cart (`/api/cart`)
- `GET /api/cart` - Get user cart items with MRP, discount, delivery fee, and savings
- `POST /api/cart` - Add product to cart (or increment quantity)
- `PUT /api/cart/:id` - Update item quantity
- `DELETE /api/cart/:id` - Remove single item
- `DELETE /api/cart` - Clear entire cart

### 5. Orders (`/api/orders`)
- `POST /api/orders` - Place order (from cart or direct "Buy Now")
- `GET /api/orders` - Get current user order history
- `GET /api/orders/:id` - Order tracking and invoice summary
- `PUT /api/orders/:id/cancel` - Cancel active order

### 6. Reviews (`/api/reviews`)
- `GET /api/reviews/product/:productId` - Product customer reviews
- `POST /api/reviews` - Submit review (1-5 stars) and automatically update average product rating

### 7. Admin (`/api/admin`)
- `GET /api/admin/stats` - Total revenue, orders, catalog products, and customer counts
- `GET /api/admin/orders` - All store orders with fulfillment details
- `PUT /api/admin/orders/:id/status` - Update status (`ORDERED`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
- `POST /api/admin/products` - Add new product to catalog
- `DELETE /api/admin/products/:id` - Delete product from catalog

---

## 🗄️ Database Schema (SQLite)

The database runs on SQLite (`database/flipkart.sqlite`) requiring **zero external database installations**:
- `users`: ID, name, email, phone, password hash, role (`customer` / `admin`), avatar, created_at
- `categories`: ID, slug, name, icon, image, banner
- `products`: ID, title, slug, brand, category_id, price, original_price, discount_percent, rating, rating_count, review_count, is_assured, in_stock, stock_quantity, thumbnail, images, description, highlights, specifications, deal_tag
- `cart_items`: ID, user_id, product_id, quantity, created_at
- `orders`: ID, order_id, user_id, total_amount, discount_amount, delivery_charges, payment_method, payment_status, order_status, shipping_address, created_at
- `order_items`: ID, order_id, product_id, product_title, product_thumbnail, price, quantity
- `reviews`: ID, product_id, user_id, user_name, rating, title, comment, is_verified, created_at
- `wishlist`: ID, user_id, product_id, created_at

---

## 💻 Tech Stack
- **Frontend**: HTML5, CSS3 (Custom Flipkart Theme), Modern Vanilla JavaScript (ES6+), Material Icons
- **Backend**: Node.js, Express.js, CORS, JSON Web Token (JWT), BCrypt.js
- **Database**: SQLite with persistent relational schema and pre-seeded catalog
- **Packaging**: Self-contained ZIP with launchers and setup scripts

---

## 📄 License
MIT License. Free to use for personal, educational, and commercial portfolio projects.
