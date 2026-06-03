const app = {
    user: null,
    isRegistering: false,

    async init() {
        await this.checkAuth();
        this.renderNav();

        // MPA Page Routing based on active HTML container
        if (document.getElementById('catalog-page')) this.loadCatalog();
        if (document.getElementById('auth-page')) this.initAuth();
        if (document.getElementById('book-page')) this.loadBookDetails();
        if (document.getElementById('cart-page')) this.loadCart();
        if (document.getElementById('profile-page')) this.loadProfile();
        if (document.getElementById('admin-page')) this.initAdmin();
    },

    // --- Universal Navbar ---
    renderNav() {
        const navHtml = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4 shadow-sm">
                <div class="container">
                    <a class="navbar-brand fw-bold" href="index.html">📚 Online Bookstore</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"><span class="navbar-toggler-icon"></span></button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item"><a class="nav-link" href="index.html">Catalog</a></li>
                            ${this.user ? `<li class="nav-item"><a class="nav-link" href="cart.html">Cart</a></li>` : ''}
                            ${this.user && this.user.role === 'admin' ? `<li class="nav-item"><a class="nav-link text-warning" href="admin.html">Admin Panel</a></li>` : ''}
                        </ul>
                        <ul class="navbar-nav">
                            ${this.user ? `
                                <li class="nav-item"><a class="nav-link" href="profile.html">Profile (${this.user.username})</a></li>
                                <li class="nav-item"><button class="btn btn-outline-danger btn-sm mt-1 ms-2" onclick="app.logout()">Logout</button></li>
                            ` : `<li class="nav-item"><a class="btn btn-primary btn-sm mt-1 ms-2" href="auth.html">Login / Register</a></li>`}
                        </ul>
                    </div>
                </div>
            </nav>`;
        const container = document.getElementById('nav-container');
        if (container) container.innerHTML = navHtml;
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
        const action = this.isRegistering ? 'register' : 'login';
        const formData = new FormData();
        formData.append('username', document.getElementById('auth-username').value);
        formData.append('password', document.getElementById('auth-password').value);
        if (this.isRegistering) formData.append('email', document.getElementById('auth-email').value);

        const res = await fetch(`../backend/auth.php?action=${action}`, { method: 'POST', body: formData });
        const data = await res.json();
        alert(data.message);
        
        if (data.success) {
            if (action === 'register') this.toggleAuthMode();
            else window.location.href = 'index.html';
        }
    },

    async logout() {
        await fetch('../backend/auth.php?action=logout');
        window.location.href = 'index.html';
    },

    // --- Catalog & Search (Features 2 & 3) ---
    async loadCatalog(page = 1) {
        document.getElementById('books-container').innerHTML = '<div class="col-12 text-center my-5"><div class="spinner-border text-primary"></div></div>';
        
        const title = document.getElementById('search-title')?.value || '';
        const author = document.getElementById('search-author')?.value || '';
        const genre = document.getElementById('search-genre')?.value || '';

        const res = await fetch(`../backend/books.php?action=list&page=${page}&search=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&genre=${encodeURIComponent(genre)}`);
        const data = await res.json();
        
        if (data.success) {
            const container = document.getElementById('books-container');
            if (data.data.length === 0) container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No books found.</p></div>';
            else {
                container.innerHTML = data.data.map(book => `
                    <div class="col-md-4 col-lg-3 mb-4"><div class="card h-100 book-card shadow-sm">
                        <img src="${book.image_url || 'https://via.placeholder.com/250x350?text=No+Cover'}" class="card-img-top" style="height:250px; object-fit:cover;" alt="${book.title}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${book.title}</h5><h6 class="card-subtitle mb-2 text-muted">${book.author}</h6>
                            <p class="card-text small text-truncate">${book.description}</p>
                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                <span class="fw-bold fs-5">$${parseFloat(book.price).toFixed(2)}</span>
                                <a href="book.html?id=${book.id}" class="btn btn-sm btn-outline-primary">Details</a>
                            </div>
                        </div>
                    </div></div>`).join('');
            }
            
            document.getElementById('pagination-controls').innerHTML = Array.from({length: data.pages}, (_, i) => 
                `<li class="page-item ${i+1 === page ? 'active' : ''}"><button class="page-link" onclick="app.loadCatalog(${i+1})">${i+1}</button></li>`
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
            <div class="col-md-4"><img src="${book.image_url || 'https://via.placeholder.com/400x600?text=No+Cover'}" class="img-fluid rounded shadow" alt="${book.title}"></div>
            <div class="col-md-8">
                <h2>${book.title}</h2><h4 class="text-muted">by ${book.author}</h4>
                <p class="mt-3"><strong>Publisher:</strong> ${book.publisher || 'N/A'} | <strong>Genre:</strong> ${book.genre}</p>
                <p>${book.description}</p><h3 class="text-primary mt-4">$${parseFloat(book.price).toFixed(2)}</h3>
                <button class="btn btn-lg btn-success mt-3" onclick="app.addToCart(${book.id})">Add to Cart</button>
            </div>
        `;
    },

    async addToCart(bookId, qty = 1) {
        if (!this.user) return window.location.href = 'auth.html';
        const fd = new FormData(); fd.append('book_id', bookId); fd.append('quantity', qty);
        await fetch('../backend/cart.php?action=add', { method: 'POST', body: fd });
        alert('Added to cart!');
    },

    // --- Cart & Checkout (Features 5 & 6) ---
    async loadCart() {
        if (!this.user) return window.location.href = 'auth.html';
        const res = await fetch('../backend/cart.php?action=list'); // Assuming standard cart endpoint
        const items = await res.json();
        const container = document.getElementById('cart-items');
        let total = 0;
        
        if (items.length === 0) {
            container.innerHTML = '<p class="text-muted">Your cart is empty.</p>';
            document.getElementById('checkout-btn').disabled = true;
        } else {
            container.innerHTML = items.map(item => {
                total += item.price * item.quantity;
                return `<div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <div><h5>${item.title}</h5><small class="text-muted">$${item.price} each</small></div>
                    <div>Qty: <input type="number" value="${item.quantity}" min="1" class="form-control d-inline w-auto" onchange="app.updateCart(${item.book_id}, this.value)"></div>
                    <button class="btn btn-sm btn-danger" onclick="app.removeFromCart(${item.book_id})">Remove</button>
                </div>`;
            }).join('');
            document.getElementById('checkout-btn').disabled = false;
        }
        document.getElementById('cart-total').innerText = total.toFixed(2);
    },

    async updateCart(bookId, qty) {
        if (!this.user) return window.location.href = 'auth.html';
        const fd = new FormData(); 
        fd.append('book_id', bookId); 
        fd.append('quantity', qty);
        await fetch('../backend/cart.php?action=update', { method: 'POST', body: fd });
        this.loadCart(); // Refresh the cart to immediately update the total
    },

    async removeFromCart(bookId) {
        if (!this.user) return window.location.href = 'auth.html';
        const fd = new FormData(); 
        fd.append('book_id', bookId);
        await fetch('../backend/cart.php?action=remove', { method: 'POST', body: fd });
        this.loadCart(); // Refresh the cart to immediately update the total
    },

    async handleCheckout(e) {
        e.preventDefault();
        const fd = new FormData();
        fd.append('address', document.getElementById('shipping-address').value);
        fd.append('payment', document.getElementById('payment-method').value);

        const res = await fetch('../backend/orders.php?action=create', { method: 'POST', body: fd });
        const data = await res.json();
        alert(data.message);
        if (data.success) window.location.href = `confirmation.html?order_id=${data.order_id}`;
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

        summary.innerHTML = `<div class="col-md-4 mb-3"><div class="card shadow-sm p-3"><h6 class="small text-uppercase text-muted">Total Orders</h6><p class="fs-3 mb-0">${stats.count}</p></div></div>
            <div class="col-md-4 mb-3"><div class="card shadow-sm p-3"><h6 class="small text-uppercase text-muted">Total Spent</h6><p class="fs-3 mb-0">$${stats.total.toFixed(2)}</p></div></div>
            <div class="col-md-4 mb-3"><div class="card shadow-sm p-3"><h6 class="small text-uppercase text-muted">Latest Order</h6><p class="fs-3 mb-0">${orders[0]?.created_at || 'N/A'}</p></div></div>`;

        if (orders.length === 0) container.innerHTML = '<p>No past orders.</p>';
        else {
            container.innerHTML = orders.map(o => `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <strong>Order #${o.id}</strong> <span class="badge bg-info">${o.status}</span>
                    </div>
                    <div class="card-body">
                        <p>Total: $${o.total_price} | Date: ${o.created_at}</p>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.viewOrderDetails(${o.id})">View Items</button>
                        <ul id="order-details-${o.id}" class="mt-2 text-muted"></ul>
                    </div>
                </div>`).join('');
        }
    },

    async viewOrderDetails(orderId) {
        const res = await fetch(`../backend/orders.php?action=details&id=${orderId}`);
        const items = await res.json();
        document.getElementById(`order-details-${orderId}`).innerHTML = items.map(i => `<li>${i.title} (Qty: ${i.quantity}) - $${i.price_at_purchase}</li>`).join('');
    },

    async handleProfileUpdate(e) {
        e.preventDefault();
        const fd = new FormData();
        fd.append('email', document.getElementById('profile-email').value);
        fd.append('password', document.getElementById('profile-password').value);
        const res = await fetch('../backend/user.php', { method: 'POST', body: fd });
        const data = await res.json();
        alert(data.message);
    },

    // --- Admin Panel (Feature 8) ---
    initAdmin() {
        if (!this.user || this.user.role !== 'admin') return window.location.href = 'index.html';
        this.loadSales();
    },

    switchAdminTab(tab) {
        document.getElementById('admin-books-tab').classList.toggle('d-none', tab !== 'books');
        document.getElementById('admin-sales-tab').classList.toggle('d-none', tab !== 'sales');
        if (tab === 'books') this.loadAdminBooks();
        if (tab === 'sales') this.loadSales();
    },

    async loadSales() {
        const params = new URLSearchParams({
            book_title: document.getElementById('sales-book-filter').value,
            customer: document.getElementById('sales-customer-filter').value,
            start_date: document.getElementById('sales-start-date').value,
            end_date: document.getElementById('sales-end-date').value
        });

        const res = await fetch(`../backend/admin.php?action=sales_report&${params.toString()}`);
        const data = await res.json();
        const container = document.getElementById('sales-report-container');
        
        if(data.success) {
            container.innerHTML = `<table class="table table-striped">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Book</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>${data.data.map(r => `
                    <tr><td>${r.id}</td><td>${r.username}</td><td>${r.title}</td><td>${r.quantity}</td>
                    <td>$${r.total_price}</td><td>
                        <select class="form-select form-select-sm" onchange="app.updateOrderStatus(${r.id}, this.value)">
                            ${['Pending','Processing','Shipped','Delivered'].map(status => `<option value="${status}" ${status === r.status ? 'selected' : ''}>${status}</option>`).join('')}
                        </select>
                    </td><td>${r.created_at}</td></tr>
                `).join('')}</tbody></table>`;
        }
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
        const action = bookId ? 'update_book' : 'create_book';
        const fd = new FormData();
        if (bookId) fd.append('id', bookId);
        fd.append('title', document.getElementById('admin-book-title').value);
        fd.append('author', document.getElementById('admin-book-author').value);
        fd.append('publisher', document.getElementById('admin-book-publisher').value);
        fd.append('description', document.getElementById('admin-book-description').value);
        fd.append('price', document.getElementById('admin-book-price').value);
        fd.append('genre', document.getElementById('admin-book-genre').value);
        fd.append('stock', document.getElementById('admin-book-stock').value);
        fd.append('image_url', document.getElementById('admin-book-image_url').value);

        const res = await fetch(`../backend/admin.php?action=${action}`, { method: 'POST', body: fd });
        const data = await res.json();
        alert(data.message);
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
            <tr>
                <td>${book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.genre || 'N/A'}</td>
                <td>$${parseFloat(book.price).toFixed(2)}</td>
                <td>${book.stock}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="app.editBook(${book.id})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteBook(${book.id})">Delete</button>
                </td>
            </tr>`).join('');
    },

    async editBook(bookId) {
        const res = await fetch(`../backend/books.php?action=list&id=${bookId}&limit=1`);
        const data = await res.json();
        const book = data.data?.[0];
        if (!book) return alert('Book not found.');
        this.openBookForm(book);
    },

    async deleteBook(bookId) {
        if (!confirm('Delete this book?')) return;
        const fd = new FormData();
        fd.append('id', bookId);
        const res = await fetch('../backend/admin.php?action=delete_book', { method: 'POST', body: fd });
        const data = await res.json();
        alert(data.message);
        if (data.success) this.loadAdminBooks();
    },

    async updateOrderStatus(orderId, status) {
        const fd = new FormData();
        fd.append('order_id', orderId);
        fd.append('status', status);
        const res = await fetch('../backend/admin.php?action=update_order_status', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) this.loadSales();
        else alert(data.message);
    }
};

window.onload = () => app.init();