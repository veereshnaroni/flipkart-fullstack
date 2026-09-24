/**
 * Flipkart Authentication & User Session Manager
 */

const Auth = {
  currentUser: null,

  init() {
    this.currentUser = API.getUser();
    this.updateHeaderUI();
    this.bindEvents();
  },

  bindEvents() {
    const loginModalBtn = document.getElementById('btn-open-login');
    if (loginModalBtn) {
      loginModalBtn.addEventListener('click', () => this.openModal('login'));
    }

    const authModalBackdrop = document.getElementById('auth-modal');
    if (authModalBackdrop) {
      authModalBackdrop.addEventListener('click', (e) => {
        if (e.target === authModalBackdrop) this.closeModal();
      });
    }

    const authCloseBtn = document.getElementById('btn-close-auth');
    if (authCloseBtn) {
      authCloseBtn.addEventListener('click', () => this.closeModal());
    }

    // Tab switches
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => this.switchTab('login'));
      tabRegister.addEventListener('click', () => this.switchTab('register'));
    }

    // Forms
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    const registerForm = document.getElementById('form-register');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Demo login buttons
    const demoCustomerBtn = document.getElementById('btn-demo-customer');
    if (demoCustomerBtn) {
      demoCustomerBtn.addEventListener('click', () => this.handleDemoLogin('customer'));
    }

    const demoAdminBtn = document.getElementById('btn-demo-admin');
    if (demoAdminBtn) {
      demoAdminBtn.addEventListener('click', () => this.handleDemoLogin('admin'));
    }

    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  },

  openModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.switchTab(tab);
    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
  },

  switchTab(tab) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const leftTitle = document.getElementById('auth-left-title');
    const leftSubtitle = document.getElementById('auth-left-subtitle');

    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'block';
      formRegister.style.display = 'none';
      if (leftTitle) leftTitle.textContent = 'Login';
      if (leftSubtitle) leftSubtitle.textContent = 'Get access to your Orders, Wishlist and Recommendations';
    } else {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formRegister.style.display = 'block';
      formLogin.style.display = 'none';
      if (leftTitle) leftTitle.textContent = "Looks like you're new here!";
      if (leftSubtitle) leftSubtitle.textContent = 'Sign up with your email or mobile to get started';
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const emailOrPhone = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      showToast('Logging in...', 'info');
      const res = await API.auth.login({ emailOrPhone, password });
      this.loginSuccess(res);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      showToast('Creating account...', 'info');
      const res = await API.auth.register({ name, email, phone, password });
      this.loginSuccess(res);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async handleDemoLogin(role) {
    try {
      showToast(`Logging in as Demo ${role}...`, 'info');
      const res = await API.auth.demoLogin(role);
      this.loginSuccess(res);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  loginSuccess(res) {
    API.setToken(res.token);
    API.setUser(res.user);
    this.currentUser = res.user;
    this.updateHeaderUI();
    this.closeModal();
    showToast(res.message || 'Logged in successfully!', 'success');

    // Refresh cart & orders
    if (window.Cart) Cart.loadCart();
  },

  logout() {
    API.setToken(null);
    API.setUser(null);
    this.currentUser = null;
    this.updateHeaderUI();
    showToast('Logged out of Flipkart.', 'info');
    if (window.Cart) Cart.loadCart();
  },

  updateHeaderUI() {
    const loginBtn = document.getElementById('btn-open-login');
    const userMenu = document.getElementById('user-menu');
    const userNameSpan = document.getElementById('user-name-display');
    const adminLink = document.getElementById('nav-admin-link');

    if (this.currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
      if (userNameSpan) userNameSpan.textContent = this.currentUser.name.split(' ')[0];
      if (adminLink) adminLink.style.display = this.currentUser.role === 'admin' ? 'block' : 'none';
    } else {
      if (loginBtn) loginBtn.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
    }
  }
};

window.Auth = Auth;
