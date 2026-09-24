/**
 * Flipkart Checkout, Payment Simulation & Order Tracking
 */

const Checkout = {
  directItem: null, // used when user clicks "BUY NOW"
  selectedPayment: 'UPI',

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const modalBackdrop = document.getElementById('checkout-modal');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeCheckoutModal();
      });
    }

    const closeBtn = document.getElementById('btn-close-checkout');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeCheckoutModal());
    }

    // Payment option clicks
    const paymentOptions = document.querySelectorAll('.fk-payment-option');
    paymentOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        paymentOptions.forEach(p => p.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        this.selectedPayment = opt.dataset.payment || 'UPI';
      });
    });

    // Form submit / Confirm Order button
    const confirmOrderBtn = document.getElementById('btn-confirm-order');
    if (confirmOrderBtn) {
      confirmOrderBtn.addEventListener('click', () => this.handlePlaceOrder());
    }

    // My Orders link in user menu
    const myOrdersLink = document.getElementById('nav-my-orders');
    if (myOrdersLink) {
      myOrdersLink.addEventListener('click', () => this.showOrdersView());
    }
  },

  openCheckoutModal(directItem = null) {
    if (!Auth.currentUser) {
      showToast('Please login to continue with checkout', 'info');
      Auth.openModal('login');
      return;
    }

    this.directItem = directItem;
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    // Reset views inside modal
    document.getElementById('checkout-form-container').style.display = 'block';
    document.getElementById('checkout-success-container').style.display = 'none';

    // Pre-fill user info in address form
    const user = Auth.currentUser;
    const nameInput = document.getElementById('ship-name');
    const phoneInput = document.getElementById('ship-phone');
    if (nameInput && !nameInput.value) nameInput.value = user.name || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '9876543210';

    // Calculate checkout payable amount
    let payableAmount = 0;
    if (directItem) {
      payableAmount = directItem.price * (directItem.quantity || 1);
    } else {
      payableAmount = Cart.summary.totalAmount;
    }

    const payBtnAmount = document.getElementById('checkout-pay-amount');
    if (payBtnAmount) payBtnAmount.textContent = `₹${payableAmount.toLocaleString('en-IN')}`;

    modal.classList.add('active');
  },

  closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('active');
  },

  async handlePlaceOrder() {
    const name = document.getElementById('ship-name').value.trim();
    const phone = document.getElementById('ship-phone').value.trim();
    const pincode = document.getElementById('ship-pincode').value.trim();
    const address = document.getElementById('ship-address').value.trim();
    const city = document.getElementById('ship-city').value.trim();
    const state = document.getElementById('ship-state').value;
    const type = document.querySelector('input[name="addr_type"]:checked')?.value || 'HOME';

    if (!name || !phone || !pincode || !address || !city) {
      showToast('Please fill out all address fields.', 'error');
      return;
    }

    const shippingAddress = { name, phone, pincode, address, city, state, type };

    try {
      showToast('Processing order & payment...', 'info');
      const orderPayload = {
        address: shippingAddress,
        paymentMethod: this.selectedPayment,
        directItem: this.directItem
      };

      const res = await API.orders.create(orderPayload);
      this.showOrderSuccess(res.order);
      await Cart.loadCart();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  showOrderSuccess(order) {
    document.getElementById('checkout-form-container').style.display = 'none';
    const successContainer = document.getElementById('checkout-success-container');
    successContainer.style.display = 'block';

    const orderIdTag = document.getElementById('success-order-id');
    const orderTotalTag = document.getElementById('success-order-total');
    const orderDateTag = document.getElementById('success-delivery-date');

    if (orderIdTag) orderIdTag.textContent = `Order ID: ${order.order_id}`;
    if (orderTotalTag) orderTotalTag.textContent = `₹${order.total_amount.toLocaleString('en-IN')}`;
    if (orderDateTag) orderDateTag.textContent = order.delivery_date || 'Expected in 2-3 business days';

    // Trigger celebration confetti
    this.launchConfetti();
  },

  launchConfetti() {
    // Lightweight canvas confetti effect
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#2874f0', '#ff9f00', '#fb641b', '#388e3c', '#ffe500', '#e91e63'];

    for (let i = 0; i < 80; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 4 + 2,
        angle: Math.random() * 360,
        spin: Math.random() * 6 - 3
      });
    }

    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.speed;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (pieces.some(p => p.y < canvas.height)) {
        animationFrame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrame);
        canvas.remove();
      }
    };
    render();

    setTimeout(() => {
      if (document.getElementById('confetti-canvas')) {
        cancelAnimationFrame(animationFrame);
        canvas.remove();
      }
    }, 4000);
  },

  async showOrdersView() {
    if (!Auth.currentUser) {
      showToast('Please login to view your orders.', 'info');
      Auth.openModal('login');
      return;
    }

    if (window.App) {
      App.switchView('orders');
    }

    const container = document.getElementById('orders-list-container');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="material-icons" style="font-size: 36px; color: var(--fk-blue); animation: spin 1s infinite;">autorenew</i><p>Loading your orders...</p></div>';

    try {
      const res = await API.orders.getAll();
      const orders = res.orders || [];

      if (orders.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 4px;">
            <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/myorders-empty_7e163b.png" style="width: 140px; margin-bottom: 16px;">
            <h3 style="font-size: 18px; margin-bottom: 8px;">You have no orders yet!</h3>
            <p style="color: #878787; font-size: 13px; margin-bottom: 16px;">Start exploring top deals on Flipkart today.</p>
            <button class="fk-view-all-btn" onclick="App.switchView('home')">Start Shopping</button>
          </div>
        `;
        return;
      }

      container.innerHTML = orders.map(ord => `
        <div style="background: #fff; border-radius: 4px; box-shadow: var(--fk-shadow); margin-bottom: 16px; overflow: hidden;">
          <div style="background: #f8f9fa; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0;">
            <div>
              <span style="font-size: 12px; color: #878787;">ORDER PLACED</span>
              <div style="font-size: 13px; font-weight: 600;">${new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            <div>
              <span style="font-size: 12px; color: #878787;">TOTAL</span>
              <div style="font-size: 13px; font-weight: 700; color: #212121;">₹${ord.total_amount.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <span style="font-size: 12px; color: #878787;">SHIP TO</span>
              <div style="font-size: 13px; font-weight: 600;">${ord.shipping_address.name}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 12px; color: #878787;">ORDER # ${ord.order_id}</span>
              <div>
                <span class="fk-badge-status fk-status-${ord.order_status.toLowerCase()}">${ord.order_status}</span>
              </div>
            </div>
          </div>

          <div style="padding: 16px 20px;">
            ${(ord.items || []).map(item => `
              <div style="display: flex; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f9f9f9;">
                <img src="${item.product_thumbnail}" style="width: 60px; height: 60px; object-fit: contain;">
                <div style="flex: 1;">
                  <div style="font-size: 14px; font-weight: 600; color: #212121;">${item.product_title}</div>
                  <div style="font-size: 13px; color: #878787;">Qty: ${item.quantity} | ₹${item.price.toLocaleString('en-IN')} each</div>
                </div>
                <div style="font-size: 13px; font-weight: 600; color: var(--fk-green);">
                  ${ord.order_status === 'DELIVERED' ? 'Delivered successfully' : 'Arriving soon'}
                </div>
              </div>
            `).join('')}
          </div>

          <div style="padding: 10px 20px; background: #fff; border-top: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 12px; color: #878787;">Payment: <strong>${ord.payment_method}</strong></div>
            ${ord.order_status !== 'DELIVERED' && ord.order_status !== 'CANCELLED' ? `
              <button onclick="Checkout.cancelOrder(${ord.id})" style="background: none; color: #d32f2f; font-size: 13px; font-weight: 600;">Cancel Order</button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div style="color: red; padding: 20px;">Failed to load orders: ${err.message}</div>`;
    }
  },

  async cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await API.orders.cancel(orderId);
      showToast('Order cancelled successfully.', 'info');
      this.showOrdersView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.Checkout = Checkout;
