/**
 * Flipkart Full-Stack REST API Client
 */

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : '/api';

const API = {
  getToken() {
    return localStorage.getItem('fk_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('fk_token', token);
    } else {
      localStorage.removeItem('fk_token');
    }
  },

  getUser() {
    const u = localStorage.getItem('fk_user');
    return u ? JSON.parse(u) : null;
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('fk_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fk_user');
    }
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth APIs
  auth: {
    login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    demoLogin: (role = 'customer') => API.request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
    getProfile: () => API.request('/auth/me')
  },

  // Products APIs
  products: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return API.request(`/products?${query}`);
    },
    getById: (id) => API.request(`/products/${id}`),
    getFeatured: () => API.request('/products/featured'),
    getSuggestions: (q) => API.request(`/products/suggestions?q=${encodeURIComponent(q)}`)
  },

  // Categories APIs
  categories: {
    getAll: () => API.request('/categories'),
    getBySlug: (slug) => API.request(`/categories/${slug}`)
  },

  // Cart APIs
  cart: {
    get: () => API.request('/cart'),
    add: (productId, quantity = 1) => API.request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
    update: (cartItemId, quantity) => API.request(`/cart/${cartItemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    remove: (cartItemId) => API.request(`/cart/${cartItemId}`, { method: 'DELETE' }),
    clear: () => API.request('/cart', { method: 'DELETE' })
  },

  // Orders APIs
  orders: {
    create: (orderData) => API.request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
    getAll: () => API.request('/orders'),
    getById: (id) => API.request(`/orders/${id}`),
    cancel: (id) => API.request(`/orders/${id}/cancel`, { method: 'PUT' })
  },

  // Reviews APIs
  reviews: {
    getByProduct: (productId) => API.request(`/reviews/product/${productId}`),
    create: (reviewData) => API.request('/reviews', { method: 'POST', body: JSON.stringify(reviewData) })
  },

  // Admin APIs
  admin: {
    getStats: () => API.request('/admin/stats'),
    getOrders: () => API.request('/admin/orders'),
    updateOrderStatus: (id, status) => API.request(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    addProduct: (productData) => API.request('/admin/products', { method: 'POST', body: JSON.stringify(productData) }),
    deleteProduct: (id) => API.request(`/admin/products/${id}`, { method: 'DELETE' })
  }
};

window.API = API;
