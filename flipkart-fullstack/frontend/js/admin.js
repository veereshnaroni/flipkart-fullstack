/**
 * Flipkart Admin Panel & Store Management
 */

const Admin = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) {
      adminLink.addEventListener('click', () => this.openAdminModal());
    }

    const modalBackdrop = document.getElementById('admin-modal');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeAdminModal();
      });
    }

    const closeBtn = document.getElementById('btn-close-admin');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeAdminModal());
    }

    // Tabs inside admin
    const tabStats = document.getElementById('admin-tab-stats');
    const tabProducts = document.getElementById('admin-tab-products');
    const tabOrders = document.getElementById('admin-tab-orders');

    if (tabStats) tabStats.addEventListener('click', () => this.switchTab('stats'));
    if (tabProducts) tabProducts.addEventListener('click', () => this.switchTab('products'));
    if (tabOrders) tabOrders.addEventListener('click', () => this.switchTab('orders'));

    // Add Product Form
    const addProductForm = document.getElementById('form-add-product');
    if (addProductForm) {
      addProductForm.addEventListener('submit', (e) => this.handleAddProduct(e));
    }
  },

  async openAdminModal() {
    if (!Auth.currentUser || Auth.currentUser.role !== 'admin') {
      showToast('Admin access required. Please login with admin credentials.', 'error');
      Auth.openModal('login');
      return;
    }

    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    modal.classList.add('active');
    this.switchTab('stats');
  },

  closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.classList.remove('active');
  },

  switchTab(tab) {
    document.querySelectorAll('.fk-admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`admin-tab-${tab}`).classList.add('active');

    const statsSec = document.getElementById('admin-sec-stats');
    const prodsSec = document.getElementById('admin-sec-products');
    const ordersSec = document.getElementById('admin-sec-orders');

    if (statsSec) statsSec.style.display = tab === 'stats' ? 'block' : 'none';
    if (prodsSec) prodsSec.style.display = tab === 'products' ? 'block' : 'none';
    if (ordersSec) ordersSec.style.display = tab === 'orders' ? 'block' : 'none';

    if (tab === 'stats') this.loadStats();
    if (tab === 'products') this.loadProducts();
    if (tab === 'orders') this.loadOrders();
  },

  async loadStats() {
    try {
      const res = await API.admin.getStats();
      const stats = res.stats;

      document.getElementById('stat-val-revenue').textContent = `₹${stats.totalRevenue.toLocaleString('en-IN')}`;
      document.getElementById('stat-val-orders').textContent = stats.totalOrders;
      document.getElementById('stat-val-products').textContent = stats.totalProducts;
      document.getElementById('stat-val-users').textContent = stats.totalUsers;

      // Render recent orders
      const tbody = document.getElementById('admin-recent-orders-tbody');
      if (tbody) {
        tbody.innerHTML = res.recentOrders.map(ord => `
          <tr>
            <td><strong>#${ord.order_id}</strong></td>
            <td>${ord.customer_name}<br><small style="color: #878787;">${ord.customer_email}</small></td>
            <td>₹${ord.total_amount.toLocaleString('en-IN')}</td>
            <td>${ord.payment_method}</td>
            <td><span class="fk-badge-status fk-status-${ord.order_status.toLowerCase()}">${ord.order_status}</span></td>
            <td>${new Date(ord.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async loadProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    try {
      const res = await API.products.getAll({ limit: 50 });
      tbody.innerHTML = res.products.map(p => `
        <tr>
          <td><img src="${p.thumbnail}" style="width: 40px; height: 40px; object-fit: contain;"></td>
          <td><strong>${p.title}</strong><br><small style="color: #878787;">Brand: ${p.brand}</small></td>
          <td>${p.category_name || 'General'}</td>
          <td>₹${p.price.toLocaleString('en-IN')}</td>
          <td>${p.deal_tag || '-'}</td>
          <td>${p.stock_quantity}</td>
          <td>
            <button onclick="Admin.deleteProduct(${p.id})" style="background: none; color: #d32f2f; font-weight: 600;">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async loadOrders() {
    const tbody = document.getElementById('admin-all-orders-tbody');
    if (!tbody) return;

    try {
      const res = await API.admin.getOrders();
      tbody.innerHTML = res.orders.map(ord => `
        <tr>
          <td><strong>#${ord.order_id}</strong></td>
          <td>${ord.customer_name}<br><small style="color: #878787;">${ord.customer_phone}</small></td>
          <td>${ord.shipping_address.city}, ${ord.shipping_address.pincode}</td>
          <td>₹${ord.total_amount.toLocaleString('en-IN')}</td>
          <td>
            <select onchange="Admin.updateOrderStatus(${ord.id}, this.value)" style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;">
              <option value="ORDERED" ${ord.order_status === 'ORDERED' ? 'selected' : ''}>ORDERED</option>
              <option value="PACKED" ${ord.order_status === 'PACKED' ? 'selected' : ''}>PACKED</option>
              <option value="SHIPPED" ${ord.order_status === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
              <option value="OUT_FOR_DELIVERY" ${ord.order_status === 'OUT_FOR_DELIVERY' ? 'selected' : ''}>OUT_FOR_DELIVERY</option>
              <option value="DELIVERED" ${ord.order_status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
              <option value="CANCELLED" ${ord.order_status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
            </select>
          </td>
          <td>${new Date(ord.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      await API.admin.updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async handleAddProduct(e) {
    e.preventDefault();
    const title = document.getElementById('prod-title').value.trim();
    const brand = document.getElementById('prod-brand').value.trim();
    const category_id = document.getElementById('prod-category').value;
    const price = document.getElementById('prod-price').value;
    const original_price = document.getElementById('prod-original-price').value;
    const thumbnail = document.getElementById('prod-thumbnail').value.trim();
    const description = document.getElementById('prod-desc').value.trim();
    const deal_tag = document.getElementById('prod-deal-tag').value;

    try {
      showToast('Adding new product to Flipkart catalog...', 'info');
      await API.admin.addProduct({
        title, brand, category_id, price, original_price, thumbnail, description, deal_tag
      });
      showToast(`Product "${title}" added successfully!`, 'success');
      e.target.reset();
      this.loadProducts();
      // Refresh catalog on main screen
      if (window.App) App.loadFeaturedDeals();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await API.admin.deleteProduct(id);
      showToast('Product deleted from catalog.', 'info');
      this.loadProducts();
      if (window.App) App.loadFeaturedDeals();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

window.Admin = Admin;
