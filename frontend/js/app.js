/**
 * Flipkart App - Core Application Controller
 */

// Global Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `fk-toast ${type}`;
  toast.innerHTML = `
    <i class="material-icons" style="font-size: 18px;">
      ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
    </i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
window.showToast = showToast;

const App = {
  activeView: 'home',
  currentCategory: null,
  currentSearchQuery: '',
  currentSort: 'relevance',
  selectedFilters: {
    minPrice: null,
    maxPrice: null,
    rating: null,
    brand: null
  },
  carouselIndex: 0,
  carouselTimer: null,
  activeDetailProduct: null,

  init() {
    this.bindEvents();
    this.initCarousel();
    this.startDealTimer();
    this.loadCategories();
    this.loadFeaturedDeals();

    // Check URL parameters for search or category
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    const searchParam = urlParams.get('q');
    if (catParam) {
      this.filterByCategory(catParam);
    } else if (searchParam) {
      this.handleSearch(searchParam);
    }
  },

  bindEvents() {
    // Brand click (Home)
    const brand = document.getElementById('brand-home-link');
    if (brand) brand.addEventListener('click', () => this.switchView('home'));

    // Search input & button
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsBox = document.getElementById('search-suggestions');

    let debounceTimer;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        if (query.length < 2) {
          if (suggestionsBox) suggestionsBox.style.display = 'none';
          return;
        }
        debounceTimer = setTimeout(() => this.fetchSuggestions(query), 250);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (suggestionsBox) suggestionsBox.style.display = 'none';
          this.handleSearch(searchInput.value.trim());
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        this.handleSearch(searchInput.value.trim());
      });
    }

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (suggestionsBox && !e.target.closest('.fk-search-wrapper')) {
        suggestionsBox.style.display = 'none';
      }
    });

    // Carousel buttons
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());

    // Sort buttons
    const sortBtns = document.querySelectorAll('.fk-sort-btn');
    sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sortBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSort = btn.dataset.sort;
        this.loadCatalogProducts();
      });
    });

    // Product Detail Modal Close
    const pdpModal = document.getElementById('pdp-modal');
    if (pdpModal) {
      pdpModal.addEventListener('click', (e) => {
        if (e.target === pdpModal) this.closeDetailModal();
      });
    }
    const pdpClose = document.getElementById('btn-close-pdp');
    if (pdpClose) pdpClose.addEventListener('click', () => this.closeDetailModal());

    // Filter clear
    const clearFiltersBtn = document.getElementById('btn-clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }

    // Price range filters
    const priceRadios = document.querySelectorAll('input[name="filter_price"]');
    priceRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const val = radio.value;
        if (val === 'all') {
          this.selectedFilters.minPrice = null;
          this.selectedFilters.maxPrice = null;
        } else if (val.includes('-')) {
          const [min, max] = val.split('-');
          this.selectedFilters.minPrice = Number(min);
          this.selectedFilters.maxPrice = Number(max);
        } else if (val.startsWith('>')) {
          this.selectedFilters.minPrice = Number(val.slice(1));
          this.selectedFilters.maxPrice = null;
        }
        this.loadCatalogProducts();
      });
    });

    // Rating filters
    const ratingRadios = document.querySelectorAll('input[name="filter_rating"]');
    ratingRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.selectedFilters.rating = radio.value === 'all' ? null : Number(radio.value);
        this.loadCatalogProducts();
      });
    });

    // Pincode checker in PDP
    const checkPinBtn = document.getElementById('btn-check-pincode');
    if (checkPinBtn) {
      checkPinBtn.addEventListener('click', () => {
        const pin = document.getElementById('pdp-pincode-input')?.value.trim();
        const resEl = document.getElementById('pdp-pincode-result');
        if (pin && pin.length === 6 && !isNaN(pin)) {
          if (resEl) resEl.innerHTML = `<span style="color: var(--fk-green);">✓ Delivery by <strong>Tomorrow, 11 PM</strong> | FREE</span>`;
        } else {
          if (resEl) resEl.innerHTML = `<span style="color: #d32f2f;">Please enter a valid 6-digit PIN code.</span>`;
        }
      });
    }

    // Review submission in PDP
    const reviewForm = document.getElementById('form-submit-review');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => this.handleSubmitReview(e));
    }
  },

  switchView(viewName) {
    this.activeView = viewName;
    const homeView = document.getElementById('view-home');
    const catalogView = document.getElementById('view-catalog');
    const cartView = document.getElementById('view-cart');
    const ordersView = document.getElementById('view-orders');

    if (homeView) homeView.style.display = viewName === 'home' ? 'block' : 'none';
    if (catalogView) catalogView.style.display = viewName === 'catalog' ? 'block' : 'none';
    if (cartView) cartView.style.display = viewName === 'cart' ? 'block' : 'none';
    if (ordersView) ordersView.style.display = viewName === 'orders' ? 'block' : 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ================= Carousel ================= */
  initCarousel() {
    this.carouselTimer = setInterval(() => {
      this.nextSlide();
    }, 4500);
  },

  updateCarousel() {
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('.fk-carousel-dot');
    if (track) {
      track.style.transform = `translateX(-${this.carouselIndex * 100}%)`;
    }
    dots.forEach((dot, idx) => {
      if (idx === this.carouselIndex) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  },

  nextSlide() {
    const slides = document.querySelectorAll('.fk-carousel-slide');
    this.carouselIndex = (this.carouselIndex + 1) % slides.length;
    this.updateCarousel();
  },

  prevSlide() {
    const slides = document.querySelectorAll('.fk-carousel-slide');
    this.carouselIndex = (this.carouselIndex - 1 + slides.length) % slides.length;
    this.updateCarousel();
  },

  goToSlide(idx) {
    this.carouselIndex = idx;
    this.updateCarousel();
  },

  /* ================= Deal Countdown Timer ================= */
  startDealTimer() {
    let secondsLeft = 14 * 3600 + 42 * 60 + 19;
    const timerHours = document.getElementById('deal-timer-h');
    const timerMins = document.getElementById('deal-timer-m');
    const timerSecs = document.getElementById('deal-timer-s');

    setInterval(() => {
      secondsLeft--;
      if (secondsLeft < 0) secondsLeft = 24 * 3600;
      const h = Math.floor(secondsLeft / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;

      if (timerHours) timerHours.textContent = String(h).padStart(2, '0');
      if (timerMins) timerMins.textContent = String(m).padStart(2, '0');
      if (timerSecs) timerSecs.textContent = String(s).padStart(2, '0');
    }, 1000);
  },

  /* ================= Categories & Deals ================= */
  async loadCategories() {
    const container = document.getElementById('categories-bar-list');
    if (!container) return;

    try {
      const res = await API.categories.getAll();
      container.innerHTML = res.categories.map(cat => `
        <div class="fk-category-item" onclick="App.filterByCategory('${cat.slug}')">
          <div class="fk-category-img-wrap">
            <img src="${cat.image}" alt="${cat.name}" class="fk-category-img">
          </div>
          <span class="fk-category-name">${cat.name}</span>
        </div>
      `).join('');

      // Also populate the admin product category dropdown
      const adminCatSelect = document.getElementById('prod-category');
      if (adminCatSelect) {
        adminCatSelect.innerHTML = res.categories.map(c => `
          <option value="${c.id}">${c.name}</option>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  async loadFeaturedDeals() {
    try {
      const res = await API.products.getFeatured();
      const { dealsOfDay, topOffers, bestSellers, trending } = res.data;

      this.renderHorizontalSlider('deals-of-day-list', dealsOfDay);
      this.renderHorizontalSlider('top-offers-list', topOffers);
      this.renderHorizontalSlider('best-sellers-list', bestSellers);
      this.renderHorizontalSlider('trending-list', trending);
    } catch (err) {
      console.error('Failed to load featured deals:', err);
    }
  },

  renderHorizontalSlider(containerId, products = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = '<p style="padding: 20px; color: #878787;">No products in this section.</p>';
      return;
    }

    container.innerHTML = products.map(p => this.createProductCardHTML(p)).join('');
  },

  createProductCardHTML(p) {
    return `
      <div class="fk-product-card" onclick="App.openDetailModal(${p.id})">
        <button class="fk-wishlist-btn" onclick="event.stopPropagation(); App.toggleWishlist(${p.id}, this)">
          <i class="material-icons" style="font-size: 18px;">favorite</i>
        </button>
        <div class="fk-product-img-wrap">
          <img src="${p.thumbnail}" alt="${p.title}" class="fk-product-img" loading="lazy">
        </div>
        <div class="fk-product-title" title="${p.title}">${p.title}</div>
        <div class="fk-rating-row">
          <span class="fk-rating-badge">${p.rating} ★</span>
          <span class="fk-rating-count">(${p.rating_count ? p.rating_count.toLocaleString('en-IN') : 0})</span>
          ${p.is_assured ? `
            <span class="fk-assured-badge" title="Flipkart Assured">
              <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png" alt="FAssured">
            </span>
          ` : ''}
        </div>
        <div class="fk-price-row">
          <span class="fk-price-current">₹${p.price.toLocaleString('en-IN')}</span>
          <span class="fk-price-original">₹${p.original_price.toLocaleString('en-IN')}</span>
          <span class="fk-price-discount">${p.discount_percent}% off</span>
        </div>
        ${p.deal_tag ? `<span class="fk-deal-pill">${p.deal_tag}</span>` : ''}
      </div>
    `;
  },

  /* ================= Search & Suggestions ================= */
  async fetchSuggestions(query) {
    const box = document.getElementById('search-suggestions');
    if (!box) return;

    try {
      const res = await API.products.getSuggestions(query);
      if (res.suggestions.length === 0) {
        box.style.display = 'none';
        return;
      }

      box.innerHTML = res.suggestions.map(s => `
        <div class="fk-suggestion-item" onclick="App.handleSearch('${s.replace(/'/g, "\\'")}')">
          <i class="material-icons">search</i>
          <span>${s}</span>
        </div>
      `).join('');
      box.style.display = 'block';
    } catch (e) {
      box.style.display = 'none';
    }
  },

  handleSearch(query) {
    this.currentSearchQuery = query;
    this.currentCategory = null;
    document.getElementById('search-input').value = query;
    this.switchView('catalog');
    this.loadCatalogProducts();
  },

  filterByCategory(slug) {
    this.currentCategory = slug;
    this.currentSearchQuery = '';
    document.getElementById('search-input').value = '';
    this.switchView('catalog');
    this.loadCatalogProducts();
  },

  async loadCatalogProducts() {
    const grid = document.getElementById('catalog-products-grid');
    const countLabel = document.getElementById('catalog-results-count');
    const titleLabel = document.getElementById('catalog-heading-title');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="material-icons" style="font-size: 36px; color: var(--fk-blue); animation: spin 1s infinite;">autorenew</i><p>Loading Flipkart catalog...</p></div>';

    const params = {
      sort: this.currentSort,
      limit: 40
    };
    if (this.currentSearchQuery) params.q = this.currentSearchQuery;
    if (this.currentCategory) params.category = this.currentCategory;
    if (this.selectedFilters.minPrice) params.minPrice = this.selectedFilters.minPrice;
    if (this.selectedFilters.maxPrice) params.maxPrice = this.selectedFilters.maxPrice;
    if (this.selectedFilters.rating) params.rating = this.selectedFilters.rating;

    try {
      const res = await API.products.getAll(params);
      const products = res.products || [];

      if (titleLabel) {
        if (this.currentSearchQuery) {
          titleLabel.textContent = `Search results for "${this.currentSearchQuery}"`;
        } else if (this.currentCategory) {
          titleLabel.textContent = `${this.currentCategory.toUpperCase()} Store`;
        } else {
          titleLabel.textContent = 'All Products';
        }
      }

      if (countLabel) {
        countLabel.textContent = `(Showing 1 – ${products.length} of ${res.total} items)`;
      }

      if (products.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <i class="material-icons" style="font-size: 64px; color: #878787;">search_off</i>
            <h3 style="margin: 12px 0 8px 0;">Sorry, no products found!</h3>
            <p style="color: #878787; font-size: 14px;">Try checking your spelling or use more general terms.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = products.map(p => this.createProductCardHTML(p)).join('');
    } catch (err) {
      grid.innerHTML = `<div style="grid-column: 1/-1; color: red; padding: 20px;">Failed to load products: ${err.message}</div>`;
    }
  },

  clearFilters() {
    this.selectedFilters = { minPrice: null, maxPrice: null, rating: null, brand: null };
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    const defaultPrice = document.querySelector('input[name="filter_price"][value="all"]');
    if (defaultPrice) defaultPrice.checked = true;
    const defaultRating = document.querySelector('input[name="filter_rating"][value="all"]');
    if (defaultRating) defaultRating.checked = true;
    this.loadCatalogProducts();
  },

  /* ================= Product Details Modal ================= */
  async openDetailModal(productId) {
    const modal = document.getElementById('pdp-modal');
    if (!modal) return;

    try {
      const res = await API.products.getById(productId);
      const p = res.product;
      this.activeDetailProduct = p;

      // Populate PDP Content
      const mainImg = document.getElementById('pdp-main-image');
      const thumbsContainer = document.getElementById('pdp-thumbnails-list');
      const title = document.getElementById('pdp-title');
      const rating = document.getElementById('pdp-rating-badge');
      const ratingCount = document.getElementById('pdp-ratings-count');
      const price = document.getElementById('pdp-price');
      const mrp = document.getElementById('pdp-mrp');
      const discount = document.getElementById('pdp-discount');
      const highlightsList = document.getElementById('pdp-highlights-list');
      const specsTable = document.getElementById('pdp-specs-tbody');
      const reviewsList = document.getElementById('pdp-reviews-list');

      if (mainImg) mainImg.src = p.thumbnail;
      if (title) title.textContent = p.title;
      if (rating) rating.textContent = `${p.rating} ★`;
      if (ratingCount) ratingCount.textContent = `${p.rating_count ? p.rating_count.toLocaleString('en-IN') : 0} Ratings & ${p.review_count || 0} Reviews`;
      if (price) price.textContent = `₹${p.price.toLocaleString('en-IN')}`;
      if (mrp) mrp.textContent = `₹${p.original_price.toLocaleString('en-IN')}`;
      if (discount) discount.textContent = `${p.discount_percent}% off`;

      // Thumbnails
      if (thumbsContainer) {
        const imgs = p.images && p.images.length > 0 ? p.images : [p.thumbnail];
        thumbsContainer.innerHTML = imgs.map((imgUrl, i) => `
          <div class="fk-pdp-thumb ${i === 0 ? 'active' : ''}" onmouseover="App.setPDPMainImage('${imgUrl}', this)">
            <img src="${imgUrl}" alt="thumb">
          </div>
        `).join('');
      }

      // Highlights
      if (highlightsList) {
        highlightsList.innerHTML = (p.highlights || []).map(h => `<li>${h}</li>`).join('');
      }

      // Specifications
      if (specsTable) {
        const specs = p.specifications || {};
        specsTable.innerHTML = Object.entries(specs).map(([key, val]) => `
          <tr>
            <td>${key}</td>
            <td>${val}</td>
          </tr>
        `).join('');
      }

      // Reviews
      if (reviewsList) {
        if (!p.reviews || p.reviews.length === 0) {
          reviewsList.innerHTML = '<p style="color: #878787; font-size: 13px;">No reviews yet. Be the first to review this product!</p>';
        } else {
          reviewsList.innerHTML = p.reviews.map(r => `
            <div class="fk-review-item">
              <div class="fk-review-header">
                <span class="fk-rating-badge">${r.rating} ★</span>
                <span class="fk-review-title">${r.title}</span>
              </div>
              <div class="fk-review-comment">${r.comment}</div>
              <div class="fk-review-footer">
                <span>${r.user_name}</span>
                <span class="fk-verified-tag"><i class="material-icons" style="font-size: 14px;">verified</i> Certified Buyer</span>
                <span>• ${new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          `).join('');
        }
      }

      // Setup PDP Buttons
      const btnAddCart = document.getElementById('pdp-btn-add-cart');
      const btnBuyNow = document.getElementById('pdp-btn-buy-now');

      if (btnAddCart) {
        btnAddCart.onclick = () => {
          Cart.addToCart(p, 1);
        };
      }

      if (btnBuyNow) {
        btnBuyNow.onclick = () => {
          this.closeDetailModal();
          Checkout.openCheckoutModal({
            productId: p.id,
            title: p.title,
            price: p.price,
            thumbnail: p.thumbnail,
            quantity: 1
          });
        };
      }

      modal.classList.add('active');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  setPDPMainImage(imgUrl, thumbEl) {
    const mainImg = document.getElementById('pdp-main-image');
    if (mainImg) mainImg.src = imgUrl;
    document.querySelectorAll('.fk-pdp-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  },

  closeDetailModal() {
    const modal = document.getElementById('pdp-modal');
    if (modal) modal.classList.remove('active');
    this.activeDetailProduct = null;
  },

  async handleSubmitReview(e) {
    e.preventDefault();
    if (!Auth.currentUser) {
      showToast('Please login to submit a review.', 'info');
      Auth.openModal('login');
      return;
    }

    if (!this.activeDetailProduct) return;

    const rating = document.getElementById('rev-rating').value;
    const title = document.getElementById('rev-title').value.trim();
    const comment = document.getElementById('rev-comment').value.trim();

    try {
      showToast('Submitting your review...', 'info');
      await API.reviews.create({
        productId: this.activeDetailProduct.id,
        rating,
        title,
        comment
      });
      showToast('Review submitted successfully!', 'success');
      e.target.reset();
      // Reload PDP
      this.openDetailModal(this.activeDetailProduct.id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  toggleWishlist(productId, btn) {
    btn.classList.toggle('active');
    if (btn.classList.contains('active')) {
      showToast('Saved to your Wishlist!', 'success');
    } else {
      showToast('Removed from Wishlist.', 'info');
    }
  }
};

// Bootstrap application once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  Cart.init();
  Checkout.init();
  Admin.init();
  App.init();
});

window.App = App;
