const app = {
    user: null,
    cartCount: 0,
    isRegistering: false,
    FALLBACK_IMG: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='42%25' font-size='70' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%93%96%3C/text%3E%3Ctext x='50%25' y='58%25' font-family='system-ui, -apple-system, sans-serif' font-size='22' font-weight='700' fill='%23475569' text-anchor='middle'%3ECover Not Found%3C/text%3E%3Ctext x='50%25' y='65%25' font-family='system-ui, -apple-system, sans-serif' font-size='15' font-weight='500' fill='%2394a3b8' text-anchor='middle'%3EBut the story is still great!%3C/text%3E%3C/svg%3E",

    formatCurrency(value) {
        const number = Number(value) || 0;
        return number.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' FCFA';
    },

    async init() {
        this.injectStyles();
        await this.checkAuth();
        if (this.user) await this.loadCartCount();
        this.renderNav();

        // MPA Page Routing based on active HTML container
        if (document.getElementById('catalog-page')) this.loadCatalog();
        if (document.getElementById('auth-page')) this.initAuth();
        if (document.getElementById('book-page')) this.loadBookDetails();
        if (document.getElementById('cart-page')) this.loadCart();
        if (document.getElementById('profile-page')) this.loadProfile();
        if (document.getElementById('admin-page')) this.initAdmin();
        if (document.getElementById('invoice-page')) this.loadInvoice();
    },

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --bs-primary: #4f46e5;
                --bs-primary-rgb: 79, 70, 229;
                --bs-body-bg: #f8fafc;
            }
            body { background-color: var(--bs-body-bg); font-family: 'Inter', system-ui, -apple-system, sans-serif; }
            .navbar { background: rgba(255, 255, 255, 0.85) !important; backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.05); }
            .navbar-brand { color: var(--bs-primary) !important; font-weight: 800; letter-spacing: -0.5px; }
            .nav-link { font-weight: 600; color: #475569 !important; transition: color 0.2s; }
            .nav-link:hover { color: var(--bs-primary) !important; }
            
            .book-card { transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; border: 1px solid rgba(0,0,0,0.05); }
            .book-card:hover { transform: translateY(-6px); box-shadow: 0 16px 32px rgba(0,0,0,0.08) !important; }
            
            .btn-primary { background: var(--bs-primary); border: none; box-shadow: 0 4px 6px rgba(79,70,229,0.25); transition: all 0.2s; }
            .btn-primary:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 6px 12px rgba(79,70,229,0.3); }
            .btn-outline-primary { color: var(--bs-primary); border-color: var(--bs-primary); }
            .btn-outline-primary:hover { background: var(--bs-primary); color: white; }
            
            .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: #f1f5f9; }
            ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `;
        document.head.appendChild(style);
    },

    // --- Universal Navbar ---
    renderNav() {
        const navHtml = `
            <nav class="navbar navbar-expand-lg sticky-top shadow-sm mb-5 pb-2 pt-2">
                <div class="container">
                    <a class="navbar-brand fs-4" href="index.html">
                        <span class="fs-3 me-2">📚</span>Book<span class="text-dark">Store</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"><span class="navbar-toggler-icon"></span></button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                            <li class="nav-item"><a class="nav-link" href="index.html">Catalog</a></li>
                            ${this.user ? `<li class="nav-item"><a class="nav-link position-relative" href="cart.html">Cart<span class="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle" style="font-size:0.7rem; min-width:22px;">${this.cartCount || 0}</span></a></li>` : ''}
                            ${this.user && this.user.role === 'admin' ? `<li class="nav-item ms-lg-2"><a class="nav-link text-primary bg-primary bg-opacity-10 px-3 rounded-pill" href="admin.html">Admin Panel</a></li>` : ''}
                        </ul>
                        <ul class="navbar-nav align-items-center">
                            ${this.user ? `
                                <li class="nav-item me-3"><a class="nav-link fw-bold text-dark" href="profile.html">👋 Hi, ${this.user.username}</a></li>
                                <li class="nav-item"><button class="btn btn-outline-danger rounded-pill px-4 btn-sm fw-bold" onclick="app.logout()">Logout</button></li>
                            ` : `<li class="nav-item"><a class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" href="auth.html">Login / Register</a></li>`}
                        </ul>
                    </div>
                </div>
            </nav>`;
        // Alert container for app-wide Bootstrap alerts (positioned top-right)
        const alertContainerHtml = `<div id="app-alerts" class="position-fixed top-0 end-0 p-3" style="z-index:1080; margin-top:4.5rem; width:320px;"></div>`;
        const container = document.getElementById('nav-container');
        if (container) container.innerHTML = navHtml + alertContainerHtml;
    },

    showAlert(message, type = 'info', timeout = 4000) {
        const map = { info: 'primary', error: 'danger', danger: 'danger', success: 'success', warning: 'warning' };
        const cls = map[type] || map.info;
        let alerts = document.getElementById('app-alerts');
        if (!alerts) {
            const d = document.createElement('div');
            d.id = 'app-alerts';
            d.className = 'position-fixed top-0 end-0 p-3';
            d.style.zIndex = '1080';
            d.style.marginTop = '4.5rem';
            d.style.width = '320px';
            document.body.prepend(d);
            alerts = d;
        }

        const id = `alert-${Date.now()}`;
        const div = document.createElement('div');
        div.id = id;
        div.className = `alert alert-${cls} alert-dismissible fade show shadow-sm rounded-3 mb-2`;
        div.role = 'alert';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="me-3">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        alerts.appendChild(div);

        if (timeout > 0) setTimeout(() => {
            try { div.classList.remove('show'); div.classList.add('hide'); div.remove(); } catch (e) { }
        }, timeout);
    },

    async loadCartCount() {
        try {
            const res = await fetch('../backend/cart.php?action=count');
            const data = await res.json();
            this.cartCount = data.count || 0;
        } catch (e) {
            console.error('Cart count failed', e);
            this.cartCount = 0;
        }
    },

    async updateCartCount() {
        await this.loadCartCount();
        this.renderNav();
    },

    // --- Auth Logic ---
    async checkAuth() {
        try {
            const res = await fetch('../backend/auth.php?action=check');
            const data = await res.json();
            this.user = data.isLoggedIn ? data.user : null;
        } catch (e) { console.error('Auth check failed', e); }
    },

    initAuth() {
        if (this.user) window.location.href = 'index.html';
    },

    toggleAuthMode() {
        this.isRegistering = !this.isRegistering;
        document.getElementById('auth-title').innerText = this.isRegistering ? 'Register' : 'Login';
        document.getElementById('auth-btn').innerText = this.isRegistering ? 'Register' : 'Login';
        document.getElementById('auth-toggle-link').innerText = this.isRegistering ? 'Already have an account? Login' : 'Need an account? Register';
        document.getElementById('auth-email-group').classList.toggle('d-none', !this.isRegistering);
        document.getElementById('auth-email').required = this.isRegistering;
    },

    async handleAuth(e) {
        e.preventDefault();
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const email = this.isRegistering ? document.getElementById('auth-email').value.trim() : null;

        // Client-side validation
        if (!username || username.length < 3) {
            this.showAlert('Username must be at least 3 characters.', 'danger');
            return;
        }

        if (username.length > 30) {
            this.showAlert('Username cannot exceed 30 characters.', 'danger');
            return;
        }

        if (!password || password.length < 6) {
            this.showAlert('Password must be at least 6 characters.', 'danger');
            return;
        }

        if (this.isRegistering) {
            if (!email) {
                this.showAlert('Email is required.', 'danger');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showAlert('Please enter a valid email address.', 'danger');
                return;
            }
        }

        const action = this.isRegistering ? 'register' : 'login';
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        if (this.isRegistering) formData.append('email', email);

        const res = await fetch(`../backend/auth.php?action=${action}`, { method: 'POST', body: formData });
        const data = await res.json();
        this.showAlert(data.message, data.success ? 'success' : 'danger');

        if (data.success) {
            if (action === 'register') this.toggleAuthMode();
            else window.location.href = 'index.html';
        }
    },

    async logout() {
        await fetch('../backend/auth.php?action=logout');
        window.location.href = 'index.html';
    },

    clearCatalogFilters() {
        const title = document.getElementById('search-title');
        const author = document.getElementById('search-author');
        const genre = document.getElementById('search-genre');
        if (title) title.value = '';
        if (author) author.value = '';
        if (genre) genre.value = '';
        this.loadCatalog(1);
    },

    // --- Catalog & Search (Features 2 & 3) ---
    async loadCatalog(page = 1) {
        document.getElementById('books-container').innerHTML = `
            <div class="col-12 text-center my-5 py-5">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                <h5 class="mt-3 text-muted fw-bold">Loading brilliant books...</h5>
            </div>`;

        const title = document.getElementById('search-title')?.value || '';
        const author = document.getElementById('search-author')?.value || '';
        const genre = document.getElementById('search-genre')?.value || '';

        const res = await fetch(`../backend/books.php?action=list&page=${page}&search=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&genre=${encodeURIComponent(genre)}`);
        const data = await res.json();

        if (data.success) {
            const container = document.getElementById('books-container');
            if (data.data.length === 0) container.innerHTML = '<div class="col-12 my-5 py-5 text-center"><h3 class="text-muted fw-bold mb-3">No books found.</h3><p class="text-secondary">Try adjusting your search criteria!</p></div>';
            else {
                container.innerHTML = data.data.map(book => `
                    <div class="col-md-4 col-lg-3 mb-4">
                        <div class="card h-100 book-card bg-white rounded-4 overflow-hidden">
                            <div class="position-relative">
                                <img src="${book.image_url || app.FALLBACK_IMG}" onerror="this.onerror=null; this.src='${app.FALLBACK_IMG}';" class="card-img-top" style="height:280px; object-fit:cover;" alt="${book.title}">
                                ${book.genre ? `<span class="badge bg-dark bg-opacity-75 position-absolute top-0 end-0 m-3 rounded-pill px-3 py-2">${book.genre}</span>` : ''}
                            </div>
                            <div class="card-body d-flex flex-column p-4">
                                <h5 class="card-title fw-bold text-dark mb-1 text-truncate" title="${book.title}">${book.title}</h5>
                                <h6 class="card-subtitle mb-3 text-muted small fw-semibold">${book.author}</h6>
                                <p class="card-text text-secondary small text-truncate-2 mb-4">${book.description}</p>
                                <div class="mt-auto d-flex justify-content-between align-items-center">
                                    <span class="fw-bolder fs-4 text-primary">${this.formatCurrency(book.price)}</span>
                                    <a href="book.html?id=${book.id}" class="btn btn-outline-primary rounded-pill px-4 fw-bold">View</a>
                                </div>
                            </div>
                        </div>
                    </div></div>`).join('');
            }

            document.getElementById('pagination-controls').innerHTML = Array.from({ length: data.pages }, (_, i) =>
                `<li class="page-item ${i + 1 === page ? 'active' : ''}"><button class="page-link rounded mx-1 shadow-sm" onclick="app.loadCatalog(${i + 1})">${i + 1}</button></li>`
            ).join('');
        }
    },

    // --- Book Details & Add to Cart (Feature 4 & 5) ---
    async loadBookDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (!id) return window.location.href = 'index.html';

        const res = await fetch(`../backend/books.php?action=list&id=${id}&limit=1`);
        const data = await res.json();
        const book = data.data[0];

        if (!book) return document.getElementById('book-details-container').innerHTML = '<p class="text-danger">Book not found.</p>';

        document.getElementById('book-details-container').innerHTML = `
            <div class="col-md-5 text-center mb-5 mb-md-0">
                <img src="${book.image_url || app.FALLBACK_IMG}" onerror="this.onerror=null; this.src='${app.FALLBACK_IMG}';" class="img-fluid rounded-4 shadow-lg" alt="${book.title}" style="max-height: 550px; object-fit: cover; width: 100%;">
            </div>
            <div class="col-md-7 d-flex flex-column justify-content-center ps-md-5">
                ${book.genre ? `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary rounded-pill px-3 py-2 align-self-start mb-3 fs-6">${book.genre}</span>` : ''}
                <h1 class="display-5 fw-bolder text-dark mb-2">${book.title}</h1>
                <h3 class="text-secondary mb-4">By <span class="text-dark">${book.author}</span></h3>
                
                <div class="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
                    <div>
                        <p class="text-muted mb-0 small text-uppercase fw-bold">Publisher</p>
                        <p class="mb-0 fw-medium text-dark fs-5">${book.publisher || 'Independent'}</p>
                    </div>
                    <div class="vr"></div>
                    <div>
                        <p class="text-muted mb-0 small text-uppercase fw-bold">Availability</p>
                        <p class="mb-0 fw-bold fs-5 ${book.stock > 0 ? 'text-success' : 'text-danger'}">${book.stock > 0 ? book.stock + ' in stock' : 'Out of Stock'}</p>
                    </div>
                </div>
                
                <p class="lead text-secondary fs-6 lh-lg mb-5">${book.description}</p>
                
                <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between bg-white p-4 rounded-4 shadow-sm border mt-auto">
                    <div class="mb-3 mb-sm-0">
                        <span class="text-muted small fw-bold d-block mb-1">Total Price</span>
                        <h2 class="text-primary fw-bold mb-0">${this.formatCurrency(book.price)}</h2>
                    </div>
                    <button class="btn btn-lg btn-primary rounded-pill px-5 fw-bold" onclick="app.addToCart(${book.id})" ${book.stock === 0 ? 'disabled' : ''}>
                        <span class="fs-5 me-2">🛒</span> Add to Cart
                    </button>
                </div>
            </div>
        `;
    },

    async addToCart(bookId, qty = 1) {
        if (!this.user) return window.location.href = 'auth.html';
        const fd = new FormData();
        fd.append('book_id', bookId);
        fd.append('quantity', qty);
        const res = await fetch('../backend/cart.php?action=add', { method: 'POST', body: fd });
        const data = await res.json();
        this.showAlert(data.message, data.success ? 'success' : 'danger');
        if (data.success) {
            this.updateCartCount();
            this.loadCart();
        }
    },

    // --- Cart & Checkout (Features 5 & 6) ---
    async loadCart() {
        if (!this.user) return window.location.href = 'auth.html';
        const res = await fetch('../backend/cart.php?action=list');
        const items = await res.json();
        const container = document.getElementById('cart-items');
        let total = 0;

        const proceedBtn = document.getElementById('proceed-checkout-btn');
        const summaryTotalEl = document.getElementById('cart-summary-total');

        if (items.length === 0) {
            container.innerHTML = '<p class="text-muted">Your cart is empty.</p>';
            if (proceedBtn) proceedBtn.disabled = true;
        } else {
            container.innerHTML = items.map(item => {
                total += item.price * item.quantity;
                const stockWarning = item.quantity > item.stock ? '<div class="text-danger small mt-2 fw-bold bg-danger bg-opacity-10 p-2 rounded">⚠ Stock reduced! Adjust quantity before checkout.</div>' : '';
                return `
                <div class="card mb-3 border-0 shadow-sm rounded-4 overflow-hidden">
                    <div class="card-body p-4 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
                        <div class="d-flex align-items-center mb-3 mb-md-0 w-100">
                            <img src="${item.image_url || app.FALLBACK_IMG}" onerror="this.onerror=null; this.src='${app.FALLBACK_IMG}';" class="rounded-3 shadow-sm me-4" style="width: 80px; height: 110px; object-fit: cover;" alt="${item.title}">
                            <div>
                                <h5 class="fw-bold text-dark mb-1">${item.title}</h5>
                                <span class="text-muted fw-medium">${this.formatCurrency(item.price)} each</span>
                                ${stockWarning}
                            </div>
                        </div>
                        <div class="d-flex align-items-center justify-content-between w-100 w-md-auto gap-4">
                            <div class="d-flex align-items-center bg-light rounded-pill p-1 shadow-sm border border-white">
                                <button class="btn btn-sm btn-light rounded-circle fw-bold text-dark fs-5 py-0 px-2 shadow-sm" onclick="app.updateCart(${item.book_id}, ${item.quantity - 1})">-</button>
                                <span class="fw-bolder px-4 fs-5">${item.quantity}</span>
                                <button class="btn btn-sm btn-light rounded-circle fw-bold text-dark fs-5 py-0 px-2 shadow-sm" onclick="app.updateCart(${item.book_id}, ${item.quantity + 1})">+</button>
                            </div>
                            <h4 class="fw-bold text-primary mb-0 me-md-4 text-end w-25">${this.formatCurrency(item.price * item.quantity)}</h4>
                            <button class="btn btn-outline-danger rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2" onclick="app.removeFromCart(${item.book_id})">
                                <span>✕</span> <span class="d-none d-sm-inline">Remove</span>
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('');
            if (proceedBtn) proceedBtn.disabled = false;
        }
        const formatted = this.formatCurrency(total);
        document.getElementById('cart-total').innerText = formatted;
        if (summaryTotalEl) summaryTotalEl.innerText = formatted;
    },

    loadAddressHistory() {
        const addresses = JSON.parse(localStorage.getItem('addressHistory') || '[]');
        const datalist = document.getElementById('address-history');
        if (datalist) {
            datalist.innerHTML = addresses.map(addr => `<option value="${addr}">`).join('');
        }
    },

    saveAddressToHistory(address) {
        if (!address || address.trim().length < 5) return;
        const addresses = JSON.parse(localStorage.getItem('addressHistory') || '[]');
        if (!addresses.includes(address)) {
            addresses.unshift(address);
            if (addresses.length > 10) addresses.pop(); // Keep only 10 most recent
            localStorage.setItem('addressHistory', JSON.stringify(addresses));
        }
    },

    async updateCart(bookId, qty) {
        if (!this.user) return window.location.href = 'auth.html';
        const fd = new FormData();
        fd.append('book_id', bookId);
        fd.append('quantity', qty);
        const res = await fetch('../backend/cart.php?action=update', { method: 'POST', body: fd });
        const data = await res.json();
        if (!data.success) {
            this.showAlert(data.message, 'danger');
            this.loadCart(); // Refresh to revert invalid change
        } else {
            this.updateCartCount();
            this.loadCart();
        }
    },

    async removeFromCart(bookId) {
        if (!this.user) return window.location.href = 'auth.html';
        const fd = new FormData();
        fd.append('book_id', bookId);
        const res = await fetch('../backend/cart.php?action=remove', { method: 'POST', body: fd });
        const data = await res.json();
        this.showAlert(data.message, data.success ? 'success' : 'danger');
        this.updateCartCount();
        this.loadCart(); // Refresh the cart to immediately update the total
    },

    async handleCheckout(e) {
        e.preventDefault();
        const paymentMethod = document.getElementById('payment-method').value;
        const paymentPhone = document.getElementById('payment-phone')?.value.trim();
        const address = document.getElementById('shipping-address').value.trim();

        if (!address || address.length < 10) {
            this.showAlert('Please enter a valid shipping address (at least 10 characters).', 'danger');
            return;
        }

        if (paymentMethod !== 'Cash on Delivery' && !paymentPhone) {
            this.showAlert('Please enter your phone number for mobile money payment.', 'danger');
            return;
        }

        if (paymentPhone && !/^[0-9]{8,12}$/.test(paymentPhone)) {
            this.showAlert('Phone number must be 8-12 digits.', 'danger');
            return;
        }

        const fd = new FormData();
        fd.append('address', address);
        fd.append('payment-method', paymentMethod);
        fd.append('payment-details', paymentPhone);

        const res = await fetch('../backend/orders.php?action=create', { method: 'POST', body: fd });
        const data = await res.json();
        this.showAlert(data.message, data.success ? 'success' : 'danger');
        if (data.success) {
            this.saveAddressToHistory(address);
            this.updateCartCount();
            window.location.href = `confirmation.html?order_id=${data.order_id}`;
        }
    },

    // --- User Profile & Orders (Features 1 & 7) ---
    async loadProfile() {
        if (!this.user) return window.location.href = 'auth.html';

        // Load Profile Info
        const res = await fetch('../backend/user.php');
        const data = await res.json();
        if (data.success) {
            document.getElementById('profile-email').value = data.user.email;
        }

        // Load Order History
        const resOrders = await fetch('../backend/orders.php?action=list');
        const orders = await resOrders.json();
        const container = document.getElementById('orders-container');
        const summary = document.getElementById('order-summary');

        const stats = orders.reduce((acc, o) => {
            acc.count += 1;
            acc.total += parseFloat(o.total_price);
            return acc;
        }, { count: 0, total: 0 });

        summary.innerHTML = `
            <div class="col-md-4 mb-3"><div class="card shadow-sm border-0 rounded-4 p-4 bg-primary text-white"><div class="d-flex justify-content-between"><h6 class="small text-uppercase text-white-50 fw-bold">Total Orders</h6><span class="fs-4">📦</span></div><p class="fs-2 fw-bold mb-0">${stats.count}</p></div></div>
            <div class="col-md-4 mb-3"><div class="card shadow-sm border-0 rounded-4 p-4 bg-dark text-white"><div class="d-flex justify-content-between"><h6 class="small text-uppercase text-white-50 fw-bold">Total Spent</h6><span class="fs-4">💸</span></div><p class="fs-2 fw-bold mb-0">${this.formatCurrency(stats.total)}</p></div></div>
            <div class="col-md-4 mb-3"><div class="card shadow-sm border-0 rounded-4 p-4 bg-white"><div class="d-flex justify-content-between"><h6 class="small text-uppercase text-muted fw-bold">Latest Order</h6><span class="fs-4">🕒</span></div><p class="fs-4 fw-bold text-dark mb-0 mt-2">${orders[0] ? new Date(orders[0].created_at).toLocaleDateString() : 'N/A'}</p></div></div>`;

        if (orders.length === 0) container.innerHTML = '<div class="alert alert-light border shadow-sm rounded-4 p-5 text-center"><h4 class="text-muted fw-bold">No past orders.</h4><p class="text-secondary mb-0">Start exploring our catalog to make your first purchase!</p></div>';
        else {
            const statusColors = { 'Pending': 'warning', 'Processing': 'info', 'Shipped': 'primary', 'Delivered': 'success' };

            container.innerHTML = orders.map(o => {
                const badgeClass = statusColors[o.status] || 'secondary';
                return `
                <div class="card mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
                    <div class="card-header bg-white border-bottom p-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div>
                            <span class="text-muted small fw-bold d-block text-uppercase">Order Placed</span>
                            <strong class="fs-6">${new Date(o.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                        </div>
                        <div>
                            <span class="text-muted small fw-bold d-block text-uppercase">Total Amount</span>
                            <strong class="text-primary fs-5">${this.formatCurrency(o.total_price)}</strong>
                        </div>
                        <div class="d-none d-sm-block text-end">
                            <span class="text-muted small fw-bold d-block text-uppercase">Order #</span>
                            <strong class="fs-6">${o.id}</strong>
                        </div>
                        <div>
                            <span class="badge bg-${badgeClass} bg-opacity-10 text-${badgeClass} border border-${badgeClass} rounded-pill px-4 py-2 fw-bold fs-6">${o.status}</span>
                        </div>
                    </div>
                    <div class="card-body p-4 bg-light">
                        <div class="row g-3 mb-4">
                            <div class="col-md-6"><strong class="small text-uppercase text-muted">Delivery Address</strong><p class="mb-0 text-secondary">${o.shipping_address}</p></div>
                            <div class="col-md-6"><strong class="small text-uppercase text-muted">Payment Method</strong><p class="mb-0 text-secondary">${o.payment_method}</p></div>
                            <div class="col-md-6"><strong class="small text-uppercase text-muted">Payment Details</strong><p class="mb-0 text-secondary">${o.payment_details || 'N/A'}</p></div>
                        </div>
                        <button class="btn btn-outline-primary rounded-pill px-4 fw-bold shadow-sm" onclick="app.viewOrderDetails(${o.id})">View Ordered Items</button>
                        <div id="order-details-${o.id}" class="mt-3 text-dark fw-medium"></div>
                    </div>
                </div>`;
            }).join('');
        }
    },

    async viewOrderDetails(orderId) {
        const res = await fetch(`../backend/orders.php?action=details&id=${orderId}`);
        const items = await res.json();

        const detailsHtml = items.map(i => `
            <div class="d-flex align-items-center bg-white p-3 rounded-3 shadow-sm mb-2 border">
                <img src="${i.image_url || app.FALLBACK_IMG}" onerror="this.onerror=null; this.src='${app.FALLBACK_IMG}';" style="width: 40px; height: 60px; object-fit: cover;" class="rounded me-3 shadow-sm">
                <div class="flex-grow-1"><h6 class="mb-0 fw-bold">${i.title}</h6><span class="text-muted small">Qty: ${i.quantity}</span></div>
                <strong class="text-primary">${this.formatCurrency(i.price_at_purchase)}</strong>
            </div>
        `).join('');
        document.getElementById(`order-details-${orderId}`).innerHTML = detailsHtml;
    },

    async handleProfileUpdate(e) {
        e.preventDefault();
        const email = document.getElementById('profile-email').value.trim();
        const password = document.getElementById('profile-password').value;

        // Client-side validation
        if (!email) {
            this.showAlert('Email is required.', 'danger');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showAlert('Please enter a valid email address.', 'danger');
            return;
        }

        if (password && password.length < 6) {
            this.showAlert('Password must be at least 6 characters if provided.', 'danger');
            return;
        }

        const fd = new FormData();
        fd.append('email', email);
        fd.append('password', password);
        const res = await fetch('../backend/user.php', { method: 'POST', body: fd });
        const data = await res.json();
        this.showAlert(data.message, data.success ? 'success' : 'danger');
    },

    // --- Admin Panel (Feature 8) ---
    async initAdmin() {
        if (!this.user || this.user.role !== 'admin') return window.location.href = 'index.html';
        await this.loadAdminDashboard();
        this.loadSales();
    },

    switchAdminTab(tab) {
        document.getElementById('admin-books-tab').classList.toggle('d-none', tab !== 'books');
        document.getElementById('admin-sales-tab').classList.toggle('d-none', tab !== 'sales');
        if (tab === 'books') this.loadAdminBooks();
        if (tab === 'sales') this.loadSales();
    },

    async loadSales() {
        await this.loadAdminDashboard();

        const params = new URLSearchParams({
            book_title: document.getElementById('sales-book-filter').value,
            customer: document.getElementById('sales-customer-filter').value,
            start_date: document.getElementById('sales-start-date').value,
            end_date: document.getElementById('sales-end-date').value
        });

        const res = await fetch(`../backend/admin.php?action=sales_report&${params.toString()}`);
        const data = await res.json();
        const container = document.getElementById('sales-report-container');

        if (data.success) {
            container.innerHTML = `<div class="table-responsive rounded-4 shadow-sm border bg-white mt-4"><table class="table table-hover align-middle mb-0">
                <thead class="bg-light text-secondary"><tr><th class="ps-4">ID</th><th>Customer</th><th>Book</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th><th>Invoice</th></tr></thead>
                <tbody>${data.data.map(r => `
                    <tr>
                        <td class="ps-4 fw-bold">#${r.id}</td>
                        <td><div class="d-flex align-items-center"><span class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2 fw-bold" style="width: 30px; height: 30px;">${r.username.charAt(0).toUpperCase()}</span><span class="fw-medium">${r.username}</span></div></td>
                        <td class="text-truncate" style="max-width: 200px;" title="${r.title}">${r.title}</td>
                        <td class="fw-medium">${r.quantity}</td>
                        <td class="fw-bold text-dark">${this.formatCurrency(r.total_price)}</td>
                        <td>
                            <select class="form-select form-select-sm rounded-pill shadow-sm fw-bold bg-light border-0 px-3 py-1" onchange="app.updateOrderStatus(${r.id}, this.value)">
                                ${['Pending', 'Processing', 'Shipped', 'Delivered'].map(status => `<option value="${status}" ${status === r.status ? 'selected' : ''}>${status}</option>`).join('')}
                            </select>
                        </td>
                        <td class="text-muted small">${new Date(r.created_at).toLocaleDateString()}</td>
                        <td><a href="invoice.html?order_id=${r.id}" target="_blank" class="btn btn-outline-primary btn-sm">View</a></td>
                    </tr>
                `).join('')}</tbody></table></div>`;
        }
    },

    clearSalesFilters() {
        document.getElementById('sales-book-filter').value = '';
        document.getElementById('sales-customer-filter').value = '';
        document.getElementById('sales-start-date').value = '';
        document.getElementById('sales-end-date').value = '';
        this.loadSales();
    },

    async loadAdminDashboard() {
        const res = await fetch('../backend/admin.php?action=dashboard_stats');
        const data = await res.json();
        const container = document.getElementById('admin-dashboard-summary');
        if (!data.success || !container) return;

        const stats = data.stats;
        container.innerHTML = `
            <div class="col-12 col-md-4">
                <div class="card border-0 shadow-sm rounded-4 p-4">
                    <div class="text-uppercase text-secondary small mb-2">Total Orders</div>
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <h3 class="fw-bold mb-1">${stats.total_orders}</h3>
                            <div class="text-muted">Placed by ${stats.total_customers} customers</div>
                        </div>
                        <span class="badge bg-primary rounded-pill py-2 px-3">${stats.total_books_sold} items</span>
                    </div>
                </div>
            </div>
            <div class="col-12 col-md-4">
                <div class="card border-0 shadow-sm rounded-4 p-4">
                    <div class="text-uppercase text-secondary small mb-2">Total Revenue</div>
                    <h3 class="fw-bold mb-1">${this.formatCurrency(stats.total_revenue)}</h3>
                    <div class="text-muted">Avg order ${this.formatCurrency(stats.average_order_value)}</div>
                </div>
            </div>
            <div class="col-12 col-md-4">
                <div class="card border-0 shadow-sm rounded-4 p-4">
                    <div class="text-uppercase text-secondary small mb-2">Top Performer</div>
                    <div class="fw-semibold mb-2">${stats.top_book_title || 'No sales yet'}</div>
                    <div class="text-muted small">Best customer: ${stats.top_customer_name || 'N/A'}</div>
                    <div class="text-muted small">${stats.status_breakdown || ''}</div>
                </div>
            </div>
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4 p-4 mt-3">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div><h6 class="fw-bold mb-1">Recent Orders</h6><p class="text-muted small mb-0">Latest five order summaries</p></div>
                        <span class="badge bg-secondary rounded-pill py-2 px-3">Updated now</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-borderless align-middle mb-0">
                            <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
                            <tbody>
                                ${stats.recent_orders.map(order => `
                                    <tr>
                                        <td class="fw-bold">#${order.id}</td>
                                        <td>${order.username}</td>
                                        <td>${order.status}</td>
                                        <td>${this.formatCurrency(order.total_price)}</td>
                                        <td class="text-muted small">${new Date(order.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    },

    async loadInvoice() {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('order_id');
        const container = document.getElementById('invoice-container');

        if (!orderId || !container) {
            if (container) container.innerHTML = '<div class="alert alert-warning">Missing order number in invoice link.</div>';
            return;
        }

        const res = await fetch(`../backend/orders.php?action=invoice&id=${encodeURIComponent(orderId)}`);
        const data = await res.json();

        if (!data.success) {
            container.innerHTML = `<div class="alert alert-danger">${data.message || 'Unable to load invoice.'}</div>`;
            return;
        }

        const order = data.order;
        const items = data.items;
        const subtotal = items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0);
        const statusClass = {
            'Pending': 'bg-warning text-dark',
            'Processing': 'bg-info text-dark',
            'Shipped': 'bg-primary text-white',
            'Delivered': 'bg-success text-white'
        }[order.status] || 'bg-secondary text-white';

        container.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 p-4">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4">
                    <div>
                        <h2 class="fw-bold mb-1">Invoice</h2>
                        <div class="text-muted">Order #ORD-${order.id}</div>
                        <div class="text-muted">${new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    <div class="mt-3 mt-md-0 text-md-end">
                        <span class="badge ${statusClass} rounded-pill px-3 py-2 fs-6">${order.status}</span>
                    </div>
                </div>

                <div class="row gy-4 mb-4">
                    <div class="col-md-4">
                        <div class="fw-semibold text-uppercase text-secondary small mb-2">Customer</div>
                        <div>${order.username}</div>
                        <div class="text-muted">${order.email}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="fw-semibold text-uppercase text-secondary small mb-2">Shipping Address</div>
                        <div>${order.shipping_address.replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="fw-semibold text-uppercase text-secondary small mb-2">Payment</div>
                        <div>${order.payment_method}</div>
                        <div class="text-muted">${order.payment_details || ''}</div>
                    </div>
                </div>

                <div class="table-responsive mb-4">
                    <table class="table table-borderless align-middle mb-0">
                        <thead class="bg-light text-secondary"><tr><th>Book</th><th class="text-center">Qty</th><th class="text-end">Unit</th><th class="text-end">Total</th></tr></thead>
                        <tbody>
                            ${items.map(item => `
                                <tr class="border-bottom">
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <img src="${item.image_url || app.FALLBACK_IMG}" width="60" class="rounded-3 me-3" />
                                            <div>
                                                <div class="fw-semibold">${item.title}</div>
                                                <div class="text-muted small">${item.author}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center">${item.quantity}</td>
                                    <td class="text-end">${this.formatCurrency(item.price_at_purchase)}</td>
                                    <td class="text-end">${this.formatCurrency(item.price_at_purchase * item.quantity)}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="row justify-content-end gx-0">
                    <div class="col-md-6 col-lg-5">
                        <div class="border rounded-4 p-4 bg-light">
                            <div class="d-flex justify-content-between mb-3"><span class="text-muted">Subtotal</span><strong>${this.formatCurrency(subtotal)}</strong></div>
                            <div class="d-flex justify-content-between mb-3"><span class="text-muted">Shipping</span><strong>0 FCFA</strong></div>
                            <div class="d-flex justify-content-between fs-5 fw-bold"><span>Total</span><strong>${this.formatCurrency(order.total_price)}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async openBookForm(book = null) {
        document.getElementById('admin-book-id').value = book?.id || '';
        document.getElementById('admin-book-title').value = book?.title || '';
        document.getElementById('admin-book-author').value = book?.author || '';
        document.getElementById('admin-book-publisher').value = book?.publisher || '';
        document.getElementById('admin-book-genre').value = book?.genre || '';
        document.getElementById('admin-book-price').value = book?.price || '';
        document.getElementById('admin-book-stock').value = book?.stock || '';
        document.getElementById('admin-book-image_url').value = book?.image_url || '';
        document.getElementById('admin-book-description').value = book?.description || '';
        document.getElementById('admin-book-form-title').innerText = book ? 'Edit Book' : 'Add Book';
        document.getElementById('admin-book-form').classList.remove('d-none');
    },

    async saveBook(e) {
        e.preventDefault();
        const bookId = document.getElementById('admin-book-id').value;
        const title = document.getElementById('admin-book-title').value.trim();
        const author = document.getElementById('admin-book-author').value.trim();
        const price = parseFloat(document.getElementById('admin-book-price').value);
        const stock = parseInt(document.getElementById('admin-book-stock').value) || 0;

        // Client-side validation
        if (!title || title.length < 3) {
            this.showAlert('Title must be at least 3 characters.', 'danger');
            return;
        }

        if (!author || author.length < 2) {
            this.showAlert('Author must be at least 2 characters.', 'danger');
            return;
        }

        if (!price || price <= 0) {
            this.showAlert('Price must be greater than 0.', 'danger');
            return;
        }

        if (stock < 0) {
            this.showAlert('Stock cannot be negative.', 'danger');
            return;
        }

        const action = bookId ? 'update_book' : 'create_book';
        const fd = new FormData();
        if (bookId) fd.append('id', bookId);
        fd.append('title', title);
        fd.append('author', author);
        fd.append('publisher', document.getElementById('admin-book-publisher').value.trim());
        fd.append('description', document.getElementById('admin-book-description').value.trim());
        fd.append('price', price);
        fd.append('genre', document.getElementById('admin-book-genre').value.trim());
        fd.append('stock', stock);
        fd.append('image_url', document.getElementById('admin-book-image_url').value.trim());

        const res = await fetch(`../backend/admin.php?action=${action}`, { method: 'POST', body: fd });
        const data = await res.json();
        this.showAlert(data.message, data.success ? 'success' : 'danger');
        if (data.success) {
            document.getElementById('admin-book-form').classList.add('d-none');
            this.loadAdminBooks();
        }
    },

    async loadAdminBooks() {
        const res = await fetch('../backend/books.php?action=list&page=1&limit=1000');
        const data = await res.json();
        const body = document.getElementById('admin-books-table-body');
        if (!data.success) {
            body.innerHTML = '<tr><td colspan="7">Failed to load books.</td></tr>';
            return;
        }
        body.innerHTML = data.data.map(book => `
            <tr class="align-middle">
                <td class="fw-bold text-muted">${book.id}</td>
                <td class="fw-bold text-dark"><img src="${book.image_url || app.FALLBACK_IMG}" onerror="this.onerror=null; this.src='${app.FALLBACK_IMG}';" class="rounded me-2 shadow-sm" style="width:30px;height:45px;object-fit:cover;"> ${book.title}</td>
                <td class="fw-medium text-secondary">${book.author}</td>
                <td>${book.genre || 'N/A'}</td>
                <td class="fw-bold text-primary">${this.formatCurrency(book.price)}</td>
                <td><span class="badge ${book.stock > 0 ? 'bg-success' : 'bg-danger'} rounded-pill">${book.stock}</span></td>
                <td>
                    <button class="btn btn-sm btn-light border shadow-sm fw-bold me-2" onclick="app.editBook(${book.id})">Edit</button>
                    <button class="btn btn-sm btn-danger border-0 shadow-sm fw-bold" onclick="app.deleteBook(${book.id})">Delete</button>
                </td>
            </tr>`).join('');
    },

    async editBook(bookId) {
        const res = await fetch(`../backend/books.php?action=list&id=${bookId}&limit=1`);
        const data = await res.json();
        const book = data.data?.[0];
        if (!book) return this.showAlert('Book not found.', 'danger');
        this.openBookForm(book);
    },

    async deleteBook(bookId) {
        if (!confirm('Delete this book?')) return;
        const fd = new FormData();
        fd.append('id', bookId);
        const res = await fetch('../backend/admin.php?action=delete_book', { method: 'POST', body: fd });
        const data = await res.json();
        this.showAlert(data.message, data.success ? 'success' : 'danger');
        if (data.success) this.loadAdminBooks();
    },

    async updateOrderStatus(orderId, status) {
        const fd = new FormData();
        fd.append('order_id', orderId);
        fd.append('status', status);
        const res = await fetch('../backend/admin.php?action=update_order_status', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) this.loadSales();
        else this.showAlert(data.message, 'danger');
    }
};

window.onload = () => app.init();