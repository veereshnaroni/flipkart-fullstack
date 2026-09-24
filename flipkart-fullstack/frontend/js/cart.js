/**
 * Flipkart Shopping Cart Manager
 */

const Cart = {
  items: [],
  summary: {
    itemCount: 0,
    totalMRP: 0,
    discount: 0,
    deliveryCharges: 0,
    totalAmount: 0,
    savings: 0
  },

  init() {
    this.bindEvents();
    this.loadCart();
  },

  bindEvents() {
    const cartNavBtn = document.getElementById('nav-cart-btn');
    if (cartNavBtn) {
      cartNavBtn.addEventListener('click', () => this.showCartView());
    }

    const placeOrderBtn = document.getElementById('btn-cart-place-order');
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', () => {
        if (this.items.length === 0) {
          showToast('Your cart is empty! Add products first.', 'error');
          return;
        }
        if (!Auth.currentUser) {
          showToast('Please login to place your order.', 'info');
          Auth.openModal('login');
          return;
        }
        if (window.Checkout) {
          Checkout.openCheckoutModal(null); // null means order from cart
        }
      });
    }
  },

  async loadCart() {
    if (!Auth.currentUser) {
      // Guest cart from localStorage
      const localCart = JSON.parse(localStorage.getItem('fk_guest_cart') || '[]');
      this.items = localCart;
      this.calculateLocalSummary();
      this.updateBadge();
      this.renderCart();
      return;
    }

    try {
      const res = await API.cart.get();
      this.items = res.items || [];
      this.summary = res.summary || this.summary;
      this.updateBadge();
      this.renderCart();
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  },

  calculateLocalSummary() {
    let totalMRP = 0;
    let totalAmount = 0;
    let itemCount = 0;

    for (const item of this.items) {
      totalMRP += (item.original_price || item.price) * item.quantity;
      totalAmount += item.price * item.quantity;
      itemCount += item.quantity;
    }

    const discount = totalMRP - totalAmount;
    const deliveryCharges = totalAmount >= 500 || totalAmount === 0 ? 0 : 40;
    this.summary = {
      itemCount,
      totalMRP,
      discount,
      deliveryCharges,
      totalAmount: totalAmount + deliveryCharges,
      savings: discount + (deliveryCharges === 0 && totalAmount > 0 ? 40 : 0)
    };
  },

  async addToCart(product, quantity = 1) {
    if (!Auth.currentUser) {
      // Guest cart
      const existing = this.items.find(i => i.product_id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        this.items.push({
          cart_item_id: Date.now(),
          product_id: product.id,
          title: product.title,
          brand: product.brand,
          price: product.price,
          original_price: product.original_price,
          discount_percent: product.discount_percent,
          thumbnail: product.thumbnail,
          rating: product.rating,
          is_assured: product.is_assured,
          quantity
        });
      }
      localStorage.setItem('fk_guest_cart', JSON.stringify(this.items));
      this.calculateLocalSummary();
      this.updateBadge();
      showToast(`Added "${product.title}" to cart!`, 'success');
      return;
    }

    try {
      await API.cart.add(product.id, quantity);
      showToast(`Added "${product.title}" to your Flipkart Cart!`, 'success');
      await this.loadCart();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async updateQuantity(cartItemId, newQty) {
    if (!Auth.currentUser) {
      if (newQty <= 0) {
        this.items = this.items.filter(i => i.cart_item_id !== cartItemId);
      } else {
        const item = this.items.find(i => i.cart_item_id === cartItemId);
        if (item) item.quantity = newQty;
      }
      localStorage.setItem('fk_guest_cart', JSON.stringify(this.items));
      this.calculateLocalSummary();
      this.updateBadge();
      this.renderCart();
      return;
    }

    try {
      await API.cart.update(cartItemId, newQty);
      await this.loadCart();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async removeItem(cartItemId) {
    if (!Auth.currentUser) {
      this.items = this.items.filter(i => i.cart_item_id !== cartItemId);
      localStorage.setItem('fk_guest_cart', JSON.stringify(this.items));
      this.calculateLocalSummary();
      this.updateBadge();
      this.renderCart();
      showToast('Item removed from cart.', 'info');
      return;
    }

    try {
      await API.cart.remove(cartItemId);
      showToast('Item removed from cart.', 'info');
      await this.loadCart();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  updateBadge() {
    const badge = document.getElementById('cart-badge');
    const totalQty = this.items.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'flex' : 'none';
    }
  },

  renderCart() {
    const cartContainer = document.getElementById('cart-items-list');
    const emptyView = document.getElementById('cart-empty-view');
    const layout = document.getElementById('cart-layout-view');
    if (!cartContainer) return;

    if (this.items.length === 0) {
      if (emptyView) emptyView.style.display = 'block';
      if (layout) layout.style.display = 'none';
      return;
    }

    if (emptyView) emptyView.style.display = 'none';
    if (layout) layout.style.display = 'grid';

    cartContainer.innerHTML = this.items.map(item => `
      <div class="fk-cart-item">
        <img src="${item.thumbnail}" alt="${item.title}" class="fk-cart-item-img">
        <div class="fk-cart-item-info">
          <div class="fk-cart-item-title">${item.title}</div>
          <div class="fk-cart-item-brand">Seller: SuperComNet | Flipkart Assured</div>
          <div class="fk-cart-item-pricing">
            <span class="fk-price-current">₹${item.price.toLocaleString('en-IN')}</span>
            <span class="fk-price-original">₹${(item.original_price || item.price).toLocaleString('en-IN')}</span>
            <span class="fk-price-discount">${item.discount_percent || 0}% Off</span>
          </div>
          <div class="fk-cart-qty-ctrls">
            <button class="fk-qty-btn" onclick="Cart.updateQuantity(${item.cart_item_id}, ${item.quantity - 1})">-</button>
            <span class="fk-qty-val">${item.quantity}</span>
            <button class="fk-qty-btn" onclick="Cart.updateQuantity(${item.cart_item_id}, ${item.quantity + 1})">+</button>
            <button class="fk-cart-remove-btn" onclick="Cart.removeItem(${item.cart_item_id})">REMOVE</button>
          </div>
        </div>
        <div style="font-size: 13px; color: #212121; text-align: right;">
          Delivery by <strong>Tomorrow, 11 PM</strong> | <span style="color: var(--fk-green); font-weight: 600;">FREE</span>
        </div>
      </div>
    `).join('');

    // Update Price Details Summary Card
    const elMRP = document.getElementById('price-total-mrp');
    const elDiscount = document.getElementById('price-discount');
    const elDelivery = document.getElementById('price-delivery');
    const elTotal = document.getElementById('price-final-total');
    const elSavings = document.getElementById('price-savings-text');
    const elItemsCount = document.getElementById('price-items-count');

    if (elMRP) elMRP.textContent = `₹${this.summary.totalMRP.toLocaleString('en-IN')}`;
    if (elDiscount) elDiscount.textContent = `-₹${this.summary.discount.toLocaleString('en-IN')}`;
    if (elDelivery) {
      elDelivery.textContent = this.summary.deliveryCharges === 0 ? 'FREE' : `₹${this.summary.deliveryCharges}`;
      if (this.summary.deliveryCharges === 0) elDelivery.classList.add('fk-green-text');
      else elDelivery.classList.remove('fk-green-text');
    }
    if (elTotal) elTotal.textContent = `₹${this.summary.totalAmount.toLocaleString('en-IN')}`;
    if (elSavings) elSavings.textContent = `You will save ₹${this.summary.savings.toLocaleString('en-IN')} on this order`;
    if (elItemsCount) elItemsCount.textContent = `Price (${this.items.reduce((sum, item) => sum + item.quantity, 0)} items)`;
  },

  showCartView() {
    if (window.App) {
      App.switchView('cart');
    }
    this.renderCart();
  }
};

window.Cart = Cart;
