const bcrypt = require('bcryptjs');
const db = require('./db');

function seedDatabase() {
  console.log('[Seed] Starting Flipkart database seeding...');

  // Clear existing data in correct order
  db.exec('DELETE FROM order_items;');
  db.exec('DELETE FROM orders;');
  db.exec('DELETE FROM cart_items;');
  db.exec('DELETE FROM wishlist;');
  db.exec('DELETE FROM reviews;');
  db.exec('DELETE FROM products;');
  db.exec('DELETE FROM categories;');
  db.exec('DELETE FROM users;');

  // Reset sqlite autoincrement sequences
  try {
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','categories','products','cart_items','orders','order_items','reviews','wishlist');");
  } catch (e) {
    // Ignore if table sqlite_sequence doesn't exist
  }

  // 1. Seed Users
  const salt = bcrypt.genSaltSync(10);
  const userPasswordHash = bcrypt.hashSync('user123', salt);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);

  const insertUser = db.raw.prepare(`
    INSERT INTO users (id, name, email, phone, password, role, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(1, 'Rahul Sharma', 'user@flipkart.com', '9876543210', userPasswordHash, 'customer', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
  insertUser.run(2, 'Flipkart Seller Admin', 'admin@flipkart.com', '9988776655', adminPasswordHash, 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150');
  insertUser.run(3, 'Priya Patel', 'priya@flipkart.com', '9123456780', userPasswordHash, 'customer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');

  console.log('[Seed] Users seeded successfully.');

  // 2. Seed Categories
  const categories = [
    { id: 1, slug: 'mobiles', name: 'Mobiles', icon: 'smartphone', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300' },
    { id: 2, slug: 'electronics', name: 'Electronics', icon: 'laptop', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300' },
    { id: 3, slug: 'appliances', name: 'TVs & Appliances', icon: 'tv', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300' },
    { id: 4, slug: 'fashion', name: 'Fashion', icon: 'checkroom', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300' },
    { id: 5, slug: 'home-furniture', name: 'Home & Furniture', icon: 'chair', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300' },
    { id: 6, slug: 'beauty', name: 'Beauty & Grooming', icon: 'spa', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' },
    { id: 7, slug: 'grocery', name: 'Grocery & Essentials', icon: 'shopping_basket', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300' }
  ];

  const insertCategory = db.raw.prepare(`
    INSERT INTO categories (id, slug, name, icon, image)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const cat of categories) {
    insertCategory.run(cat.id, cat.slug, cat.name, cat.icon, cat.image);
  }
  console.log('[Seed] Categories seeded successfully.');

  // 3. Seed Products
  const products = [
    // Mobiles
    {
      id: 1,
      title: 'Apple iPhone 15 (Blue, 128 GB)',
      slug: 'apple-iphone-15-blue-128-gb',
      brand: 'Apple',
      category_id: 1,
      price: 69999,
      original_price: 79900,
      discount_percent: 12,
      rating: 4.6,
      rating_count: 42150,
      review_count: 2840,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 45,
      thumbnail: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800'
      ]),
      description: 'Experience the innovative Dynamic Island, 48MP main camera with 2x Telephoto, durable color-infused glass with aluminum design, and USB-C connectivity.',
      highlights: JSON.stringify([
        '128 GB ROM',
        '15.49 cm (6.1 inch) Super Retina XDR Display',
        '48MP + 12MP | 12MP Front Camera',
        'A16 Bionic Chip, 6 Core Processor',
        'All-day battery life with up to 20 hours video playback'
      ]),
      specifications: JSON.stringify({
        'In The Box': 'Handset, USB-C Charge Cable (1m), Documentation',
        'Model Number': 'MTP43HN/A',
        'Color': 'Blue',
        'Display Resolution': '2556 x 1179 Pixels',
        'Operating System': 'iOS 17',
        'Processor Type': 'A16 Bionic Chip',
        'Internal Storage': '128 GB',
        'Warranty': '1 Year Manufacturer Warranty'
      }),
      deal_tag: 'Deal of the Day'
    },
    {
      id: 2,
      title: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256 GB)',
      slug: 'samsung-galaxy-s24-ultra-5g',
      brand: 'Samsung',
      category_id: 1,
      price: 119999,
      original_price: 134999,
      discount_percent: 11,
      rating: 4.7,
      rating_count: 18450,
      review_count: 1530,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 30,
      thumbnail: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'
      ]),
      description: 'Meet Galaxy S24 Ultra with Galaxy AI. Titanium exterior, Corning Gorilla Armor glass, 200MP camera, built-in S Pen, and Snapdragon 8 Gen 3 for Galaxy.',
      highlights: JSON.stringify([
        '12 GB RAM | 256 GB ROM',
        '17.27 cm (6.8 inch) Dynamic AMOLED 2X Display',
        '200MP + 50MP + 12MP + 10MP | 12MP Front Camera',
        '5000 mAh Battery',
        'Snapdragon 8 Gen 3 Processor'
      ]),
      specifications: JSON.stringify({
        'In The Box': 'Smartphone, Data Cable (Type-C to Type-C), Ejection Pin',
        'Color': 'Titanium Gray',
        'RAM': '12 GB',
        'Storage': '256 GB',
        'Operating System': 'Android 14'
      }),
      deal_tag: 'Top Offer'
    },
    {
      id: 3,
      title: 'OnePlus 12 (Silky Black, 256 GB)',
      slug: 'oneplus-12-silky-black',
      brand: 'OnePlus',
      category_id: 1,
      price: 59999,
      original_price: 64999,
      discount_percent: 7,
      rating: 4.5,
      rating_count: 22100,
      review_count: 1980,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 60,
      thumbnail: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800'
      ]),
      description: 'Elite performance with Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, and 100W SUPERVOOC charging with 5400 mAh battery.',
      highlights: JSON.stringify([
        '12 GB RAM | 256 GB ROM',
        '17.32 cm (6.82 inch) 2K 120Hz ProXDR Display',
        '50MP + 48MP + 64MP Camera',
        '5400 mAh Battery with 100W Fast Charging'
      ]),
      specifications: JSON.stringify({
        'Color': 'Silky Black',
        'RAM': '12 GB',
        'Battery': '5400 mAh',
        'Fast Charging': '100W'
      }),
      deal_tag: 'Best Seller'
    },
    {
      id: 4,
      title: 'Google Pixel 8 (Hazel, 128 GB)',
      slug: 'google-pixel-8-hazel',
      brand: 'Google',
      category_id: 1,
      price: 53999,
      original_price: 75999,
      discount_percent: 28,
      rating: 4.4,
      rating_count: 14200,
      review_count: 1200,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 25,
      thumbnail: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'
      ]),
      description: 'Meet Pixel 8. Engineered by Google, powered by Google Tensor G3 chip for cutting-edge photo and video capabilities, and all-day battery life.',
      highlights: JSON.stringify([
        '8 GB RAM | 128 GB ROM',
        '15.75 cm (6.2 inch) Actua OLED 120Hz Display',
        '50MP + 12MP | 10.5MP Front Camera',
        'Google Tensor G3 Processor'
      ]),
      specifications: JSON.stringify({
        'Color': 'Hazel',
        'RAM': '8 GB',
        'Processor': 'Google Tensor G3'
      }),
      deal_tag: 'Trending'
    },

    // Electronics & Laptops
    {
      id: 5,
      title: 'Apple MacBook Air M2 (Space Grey, 8GB / 256GB SSD)',
      slug: 'apple-macbook-air-m2',
      brand: 'Apple',
      category_id: 2,
      price: 84990,
      original_price: 99900,
      discount_percent: 15,
      rating: 4.8,
      rating_count: 15400,
      review_count: 1420,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 40,
      thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'
      ]),
      description: 'Redesigned around next-generation M2 chip, MacBook Air is impossibly thin, delivering exceptional speed and power efficiency up to 18 hours.',
      highlights: JSON.stringify([
        'Apple M2 Processor',
        '8 GB Unified Memory',
        '256 GB SSD Storage',
        '34.54 cm (13.6 inch) Liquid Retina Display',
        'macOS Sonoma, Backlit Magic Keyboard'
      ]),
      specifications: JSON.stringify({
        'Processor Brand': 'Apple',
        'Processor Name': 'M2',
        'RAM': '8 GB Unified',
        'Storage Type': 'SSD',
        'Capacity': '256 GB',
        'Battery Backup': 'Up to 18 hours'
      }),
      deal_tag: 'Deal of the Day'
    },
    {
      id: 6,
      title: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones',
      slug: 'sony-wh-1000xm5-headphones',
      brand: 'Sony',
      category_id: 2,
      price: 26990,
      original_price: 34990,
      discount_percent: 22,
      rating: 4.6,
      rating_count: 9800,
      review_count: 850,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 50,
      thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800'
      ]),
      description: 'Industry-leading noise cancellation with two processors and 8 microphones. Magnificent sound engineered to perfection with 30-hour battery life.',
      highlights: JSON.stringify([
        'With Mic: Yes',
        'Bluetooth version: 5.2',
        'Wireless range: 10 m',
        'Battery life: 30 hr | Charging time: 3.5 hr',
        'Industry Leading Active Noise Cancellation (ANC)'
      ]),
      specifications: JSON.stringify({
        'Brand': 'Sony',
        'Model': 'WH-1000XM5',
        'Color': 'Black',
        'Connectivity': 'Bluetooth 5.2'
      }),
      deal_tag: 'Best Seller'
    },
    {
      id: 7,
      title: 'Samsung 32-inch Odyssey G5 Curved Gaming Monitor 165Hz',
      slug: 'samsung-32-inch-odyssey-g5-gaming-monitor',
      brand: 'Samsung',
      category_id: 2,
      price: 21499,
      original_price: 32000,
      discount_percent: 32,
      rating: 4.5,
      rating_count: 4500,
      review_count: 420,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 20,
      thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'
      ]),
      description: 'WQHD resolution with 1000R curved screen fills your peripheral vision. 165Hz refresh rate and 1ms response time ensure smooth gameplay.',
      highlights: JSON.stringify([
        'Display: 81.28 cm (32 inch) WQHD 2560 x 1440 Pixels',
        '1000R Optimal Curved Screen',
        '165Hz Refresh Rate & 1ms MPRT',
        'AMD FreeSync Premium'
      ]),
      specifications: JSON.stringify({
        'Resolution': '2560 x 1440',
        'Refresh Rate': '165 Hz',
        'Curvature': '1000R'
      }),
      deal_tag: 'Trending'
    },
    {
      id: 8,
      title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminium Case',
      slug: 'apple-watch-series-9-gps-45mm',
      brand: 'Apple',
      category_id: 2,
      price: 38999,
      original_price: 44900,
      discount_percent: 13,
      rating: 4.7,
      rating_count: 6700,
      review_count: 610,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 35,
      thumbnail: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800'
      ]),
      description: 'Powered by S9 SiP chip with Double Tap gesture, brighter Always-On Retina display, advanced health sensors including ECG and Blood Oxygen.',
      highlights: JSON.stringify([
        'S9 SiP with 64-bit dual-core processor',
        'Always-On Retina display up to 2000 nits',
        'Blood Oxygen & ECG apps',
        'Crash Detection & Fall Detection',
        'Water resistant 50 metres'
      ]),
      specifications: JSON.stringify({
        'Case Size': '45 mm',
        'Dial Shape': 'Rectangle',
        'Strap Color': 'Midnight'
      }),
      deal_tag: 'Top Offer'
    },

    // TVs & Appliances
    {
      id: 9,
      title: 'LG 55 inch Ultra HD (4K) Smart WebOS TV (55UR7500PSC)',
      slug: 'lg-55-inch-4k-smart-webos-tv',
      brand: 'LG',
      category_id: 3,
      price: 43990,
      original_price: 71990,
      discount_percent: 38,
      rating: 4.5,
      rating_count: 19200,
      review_count: 1840,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 25,
      thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'
      ]),
      description: 'Alpha 5 AI Processor 4K Gen6 delivers vivid colors and remarkable detail. Features WebOS 23, AI Acoustic Tuning, Game Optimizer, and Filmmaker Mode.',
      highlights: JSON.stringify([
        'Ultra HD (4K) 3840 x 2160 Pixels',
        'Operating System: WebOS',
        'Speaker Output: 20 W with AI Sound',
        'Refresh Rate: 60 Hz',
        '3 x HDMI | 2 x USB Ports'
      ]),
      specifications: JSON.stringify({
        'Screen Size': '139 cm (55 inch)',
        'Display Type': 'LED',
        'Smart TV': 'Yes',
        'Warranty': '3 Years Comprehensive Warranty'
      }),
      deal_tag: 'Deal of the Day'
    },
    {
      id: 10,
      title: 'LG 242 L Frost Free Double Door 3 Star Refrigerator',
      slug: 'lg-242l-double-door-refrigerator',
      brand: 'LG',
      category_id: 3,
      price: 24990,
      original_price: 36999,
      discount_percent: 32,
      rating: 4.4,
      rating_count: 14800,
      review_count: 1320,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 15,
      thumbnail: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800'
      ]),
      description: 'Smart Inverter Compressor refrigerator with Door Cooling+, Smart Diagnosis, Toughened Glass shelves, and 3 Star energy efficiency rating.',
      highlights: JSON.stringify([
        'Capacity: 242 L for Families with 2-3 members',
        '3 Star Energy Rating',
        'Smart Inverter Compressor',
        'Door Cooling+ & Multi Air Flow'
      ]),
      specifications: JSON.stringify({
        'Type': 'Double Door',
        'Star Rating': '3 Star',
        'Defrosting Type': 'Frost Free'
      }),
      deal_tag: 'Best Seller'
    },

    // Fashion
    {
      id: 11,
      title: 'Nike Air Max SC Running & Lifestyle Shoes for Men',
      slug: 'nike-air-max-sc-mens-running-shoes',
      brand: 'Nike',
      category_id: 4,
      price: 4495,
      original_price: 5995,
      discount_percent: 25,
      rating: 4.4,
      rating_count: 11200,
      review_count: 980,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 60,
      thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800'
      ]),
      description: 'With its easy-going lines, heritage track look, and visible Air cushioning, the Nike Air Max SC is the ideal finish to any modern outfit.',
      highlights: JSON.stringify([
        'Color: University Red / White',
        'Outer Material: Genuine Mesh & Leather',
        'Sole Material: Rubber with Air-Sole unit',
        'Closure: Lace-Ups'
      ]),
      specifications: JSON.stringify({
        'Ideal For': 'Men',
        'Type': 'Sneakers / Running',
        'Style Code': 'CW4555-102'
      }),
      deal_tag: 'Top Offer'
    },
    {
      id: 12,
      title: 'Levi\'s Men Slim Fit Washed Denim Casual Shirt',
      slug: 'levis-mens-slim-fit-denim-shirt',
      brand: "Levi's",
      category_id: 4,
      price: 1899,
      original_price: 3599,
      discount_percent: 47,
      rating: 4.3,
      rating_count: 8700,
      review_count: 740,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 80,
      thumbnail: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'
      ]),
      description: 'Classic western denim styling from Levi\'s crafted with 100% premium cotton, dual flap chest pockets, and pearlescent snap buttons.',
      highlights: JSON.stringify([
        '100% Breathable Cotton Denim',
        'Fit: Slim Fit',
        'Sleeve: Full Sleeve',
        'Pattern: Solid Washed'
      ]),
      specifications: JSON.stringify({
        'Fabric': 'Pure Cotton Denim',
        'Occasion': 'Casual',
        'Collar': 'Spread Collar'
      }),
      deal_tag: 'Trending'
    },
    {
      id: 13,
      title: 'Fossil Grant Chronograph Analog Dial Men\'s Watch',
      slug: 'fossil-grant-chronograph-watch',
      brand: 'Fossil',
      category_id: 4,
      price: 8495,
      original_price: 13495,
      discount_percent: 37,
      rating: 4.6,
      rating_count: 6300,
      review_count: 510,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 40,
      thumbnail: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800'
      ]),
      description: 'Vintage-inspired Fossil Grant watch with Roman numeral hour markers, three subdials for chronograph stopwatch functions, and genuine leather strap.',
      highlights: JSON.stringify([
        'Water Resistant: 50m / 5 ATM',
        'Dial Color: Blue / Rose Gold accents',
        'Strap Material: Genuine Brown Leather',
        'Movement: Quartz Chronograph'
      ]),
      specifications: JSON.stringify({
        'Case Diameter': '44 mm',
        'Strap Width': '22 mm',
        'Warranty': '2 Years International Warranty'
      }),
      deal_tag: 'Deal of the Day'
    },

    // Home & Furniture
    {
      id: 14,
      title: 'Green Soul Monster Ultimate High Back Ergonomic Gaming & Office Chair',
      slug: 'green-soul-monster-ergonomic-chair',
      brand: 'Green Soul',
      category_id: 5,
      price: 16499,
      original_price: 24990,
      discount_percent: 34,
      rating: 4.5,
      rating_count: 9400,
      review_count: 1100,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 25,
      thumbnail: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?w=800'
      ]),
      description: 'Premium breathable spandex fabric with internal moulded foam, heavy duty metal base, 4D adjustable armrests, and 180 degree recline.',
      highlights: JSON.stringify([
        'Frame Material: Metal & High Density Cold-Cure Foam',
        'Adjustable Seat Height & 4D Armrests',
        '180 Degree Tilt Mechanism with Rocking Lock',
        'Weight Capacity: Up to 135 kg'
      ]),
      specifications: JSON.stringify({
        'Material': 'Spandex & PU Leather',
        'Color': 'Black & Ash Grey',
        'Warranty': '3 Years Manufacturer Warranty'
      }),
      deal_tag: 'Best Seller'
    },
    {
      id: 15,
      title: 'Wakefit Orthopedic Memory Foam 6-inch King Size Mattress',
      slug: 'wakefit-orthopedic-memory-foam-mattress',
      brand: 'Wakefit',
      category_id: 5,
      price: 12499,
      original_price: 18999,
      discount_percent: 34,
      rating: 4.6,
      rating_count: 32000,
      review_count: 4100,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 30,
      thumbnail: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800'
      ]),
      description: 'Engineered with Next-Gen Memory Foam to adapt to your body contours, relieve pressure points, and promote healthy spinal alignment.',
      highlights: JSON.stringify([
        'Size: 78x72x6 inches (King)',
        'Removable & Washable Breathable Cover',
        'Zero Partner Motion Disturbance',
        '10 Years Manufacturer Warranty'
      ]),
      specifications: JSON.stringify({
        'Comfort Level': 'Medium Firm',
        'Layers': 'High Resilience Base + Memory Foam',
        'Warranty': '10 Years'
      }),
      deal_tag: 'Top Offer'
    },

    // Beauty & Grooming
    {
      id: 16,
      title: 'Philips All-in-One Series 7000 Trimmer (14-in-1 Grooming Kit)',
      slug: 'philips-series-7000-trimmer-14-in-1',
      brand: 'Philips',
      category_id: 6,
      price: 3799,
      original_price: 4995,
      discount_percent: 24,
      rating: 4.5,
      rating_count: 18600,
      review_count: 1540,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 75,
      thumbnail: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800'
      ]),
      description: 'DualCut self-sharpening stainless steel blades with up to 120 minutes of cordless runtime. Includes 14 attachments for face, head, and body hair.',
      highlights: JSON.stringify([
        '120 mins runtime on 1 hour charge',
        '100% Showerproof for wet & dry usage',
        'Self-sharpening DualCut blades',
        '5 min quick charge for 1 full trim'
      ]),
      specifications: JSON.stringify({
        'Blade Material': 'Stainless Steel',
        'Battery Type': 'Lithium-ion',
        'Warranty': '2 Years'
      }),
      deal_tag: 'Best Seller'
    },

    // Grocery
    {
      id: 17,
      title: 'Happilo 100% Natural California Almonds Value Pack (1kg)',
      slug: 'happilo-natural-california-almonds-1kg',
      brand: 'Happilo',
      category_id: 7,
      price: 849,
      original_price: 1399,
      discount_percent: 39,
      rating: 4.6,
      rating_count: 54000,
      review_count: 3900,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 120,
      thumbnail: 'https://images.unsplash.com/photo-1508061252224-43775270e0a4?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1508061252224-43775270e0a4?w=800'
      ]),
      description: 'Handpicked premium crunchy California Badam. High in protein, dietary fiber, vitamin E, and antioxidants for your daily healthy nutrition.',
      highlights: JSON.stringify([
        '100% Real California Almonds',
        'Zero Trans Fat & Zero Cholesterol',
        'Rich in Vitamin E, Magnesium and Protein',
        'Resealable zip-lock freshness pouch'
      ]),
      specifications: JSON.stringify({
        'Quantity': '1 kg',
        'Container Type': 'Pouch',
        'Shelf Life': '12 Months'
      }),
      deal_tag: 'Deal of the Day'
    },
    {
      id: 18,
      title: 'Tata Tea Gold Assam Long Leaves Tea Pouch (1 kg)',
      slug: 'tata-tea-gold-assam-1kg',
      brand: 'Tata Tea',
      category_id: 7,
      price: 520,
      original_price: 690,
      discount_percent: 24,
      rating: 4.7,
      rating_count: 48000,
      review_count: 2900,
      is_assured: 1,
      in_stock: 1,
      stock_quantity: 90,
      thumbnail: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800'
      ]),
      description: 'A delicate blend of fine Assam CTC teas with 15% gently rolled long tea leaves that release irresistible aroma with a rich taste in every cup.',
      highlights: JSON.stringify([
        'Blend of 85% CTC and 15% Long Leaves',
        'Exquisite aroma and deep amber color',
        'Rich in healthy antioxidants'
      ]),
      specifications: JSON.stringify({
        'Weight': '1 kg',
        'Tea Type': 'Black Tea',
        'Form': 'Leaves & Granules'
      }),
      deal_tag: 'Best Seller'
    }
  ];

  const insertProduct = db.raw.prepare(`
    INSERT INTO products (
      id, title, slug, brand, category_id, price, original_price, discount_percent,
      rating, rating_count, review_count, is_assured, in_stock, stock_quantity,
      thumbnail, images, description, highlights, specifications, deal_tag
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `);

  for (const prod of products) {
    insertProduct.run(
      prod.id, prod.title, prod.slug, prod.brand, prod.category_id,
      prod.price, prod.original_price, prod.discount_percent,
      prod.rating, prod.rating_count, prod.review_count,
      prod.is_assured, prod.in_stock, prod.stock_quantity,
      prod.thumbnail, prod.images, prod.description,
      prod.highlights, prod.specifications, prod.deal_tag
    );
  }
  console.log('[Seed] Products seeded successfully.');

  // 4. Seed Reviews
  const reviews = [
    {
      product_id: 1,
      user_id: 1,
      user_name: 'Rahul Sharma',
      rating: 5,
      title: 'Mind-blowing camera and smooth performance!',
      comment: 'Upgraded from iPhone 11 to iPhone 15 and the difference is massive. Dynamic Island is so useful, battery easily lasts 1.5 days. Delivered in 24 hours via Flipkart Assured!',
      is_verified: 1
    },
    {
      product_id: 1,
      user_id: 3,
      user_name: 'Priya Patel',
      rating: 5,
      title: 'Best smartphone in this price range',
      comment: 'Super fast delivery by Flipkart! The blue color looks subtle and gorgeous. USB-C makes life so much easier since I can use one cable for laptop and phone.',
      is_verified: 1
    },
    {
      product_id: 5,
      user_id: 1,
      user_name: 'Rahul Sharma',
      rating: 5,
      title: 'Best laptop for coding and everyday productivity',
      comment: 'M2 chip handles 50+ Chrome tabs, VS Code, Docker, and Photoshop without even breaking a sweat. Battery easily lasts 14+ hours. Screen is gorgeous.',
      is_verified: 1
    },
    {
      product_id: 6,
      user_id: 3,
      user_name: 'Priya Patel',
      rating: 5,
      title: 'ANC is pure magic for flights and offices',
      comment: 'Drowns out engine noise and crying babies effortlessly. Audio quality is punchy and balanced. Extremely lightweight and comfortable.',
      is_verified: 1
    },
    {
      product_id: 9,
      user_id: 1,
      user_name: 'Rahul Sharma',
      rating: 4,
      title: 'Great 4K panel at this price point',
      comment: 'LG webOS is snappy, 4K streaming looks crisp. Sound is good enough for a 20x15 living room. Free installation was arranged the next morning.',
      is_verified: 1
    }
  ];

  const insertReview = db.raw.prepare(`
    INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const rev of reviews) {
    insertReview.run(rev.product_id, rev.user_id, rev.user_name, rev.rating, rev.title, rev.comment, rev.is_verified);
  }
  console.log('[Seed] Reviews seeded successfully.');

  // 5. Seed Demo Cart for User 1
  const insertCart = db.raw.prepare(`
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES (?, ?, ?)
  `);
  insertCart.run(1, 1, 1); // iPhone 15
  insertCart.run(1, 6, 1); // Sony headphones
  console.log('[Seed] Demo cart items seeded for Rahul.');

  // 6. Seed Demo Order for User 1
  const insertOrder = db.raw.prepare(`
    INSERT INTO orders (id, order_id, user_id, total_amount, discount_amount, delivery_charges, payment_method, payment_status, order_status, shipping_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run(
    1,
    'OD987123654129',
    1,
    84990,
    14910,
    0,
    'UPI',
    'COMPLETED',
    'DELIVERED',
    JSON.stringify({
      name: 'Rahul Sharma',
      phone: '9876543210',
      pincode: '560001',
      address: 'Flat 402, Prestige Tower, MG Road, Bengaluru, Karnataka',
      type: 'HOME'
    })
  );

  const insertOrderItem = db.raw.prepare(`
    INSERT INTO order_items (order_id, product_id, product_title, product_thumbnail, price, quantity)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertOrderItem.run(
    1,
    5,
    'Apple MacBook Air M2 (Space Grey, 8GB / 256GB SSD)',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
    84990,
    1
  );
  console.log('[Seed] Sample delivered order seeded.');

  console.log('[Seed] Flipkart Database successfully seeded!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
