const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8000/frontend';

test.describe('Online Bookstore - Production Grade E2E Tests', () => {
    // Run tests sequentially as they depend on the state from previous tests
    test.describe.configure({ mode: 'serial' });

    let page;
    
    // Generate unique user data for testing
    const testUser = {
        username: `user_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'securePassword123!'
    };

    const adminUser = {
        username: 'admin',
        password: 'password'
    };

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('1. Registration and Authentication', async () => {
        await page.goto(`${BASE_URL}/auth.html`);
        
        // Toggle to register mode
        await page.click('#auth-toggle-link');
        
        // Fill registration form
        await page.fill('#auth-username', testUser.username);
        await page.fill('#auth-email', testUser.email);
        await page.fill('#auth-password', testUser.password);
        await page.click('#auth-btn');
        
        // Wait for success alert
        await expect(page.locator('.alert-success')).toContainText('Registration successful');
        
        // Login (The UI toggles back automatically per app.js logic)
        await page.fill('#auth-username', testUser.username);
        await page.fill('#auth-password', testUser.password);
        await page.click('#auth-btn');
        
        // Should redirect to index.html and display welcome message
        await page.waitForURL('**/index.html');
        await expect(page.locator(`text=👋 Hi, ${testUser.username}`)).toBeVisible();
    });

    test('2. Book Catalog, Search, and Details', async () => {
        await page.goto(`${BASE_URL}/index.html`);
        
        // Ensure catalog loads books
        await expect(page.locator('.book-card').first()).toBeVisible();
        
        // Search for a specific book (Assuming input triggers search or is ready)
        if (await page.locator('#search-title').isVisible()) {
            await page.fill('#search-title', '1984');
            await page.press('#search-title', 'Enter');
            
            // Wait for network response for the search
            await page.waitForResponse(res => res.url().includes('action=list'));
        }
        
        // Click to view the first available book's details
        await page.click('.book-card a:has-text("View")');
        await page.waitForURL('**/book.html?id=*');
        
        // Verify book details page elements
        await expect(page.locator('h1.display-5')).toBeVisible();
        await expect(page.locator('button:has-text("Add to Cart")')).toBeVisible();
    });

    test('3. Cart Operations', async () => {
        // Add to cart
        await page.click('button:has-text("Add to Cart")');
        await expect(page.locator('.alert-success')).toContainText('success', { ignoreCase: true });
        
        // Navigate to cart
        await page.click('a[href="cart.html"]');
        await page.waitForURL('**/cart.html');
        
        // Check if item is in cart
        await expect(page.locator('.card-body h5').first()).toBeVisible();
        
        // Update quantity
        const currentQty = await page.locator('.card-body span.fw-bolder').first().innerText();
        await page.click('button:has-text("+")');
        
        // Wait for the update request to finish
        await page.waitForResponse(res => res.url().includes('action=update'));
        
        // Verify quantity changed
        await expect(page.locator('.card-body span.fw-bolder').first()).not.toHaveText(currentQty);
    });

    test('4. Checkout Process', async () => {
        // Proceed to checkout
        await page.click('#checkout-btn');
        await page.waitForURL('**/checkout.html');
        
        // Fill checkout form
        await page.fill('#shipping-address', '123 E2E Test Avenue, Validation City');
        await page.selectOption('#payment-method', 'Cash on Delivery');
        
        // Submit order
        await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
        
        // Wait for redirect to confirmation
        await page.waitForURL('**/confirmation.html?order_id=*');
    });

    test('5. Order History and Profile', async () => {
        await page.goto(`${BASE_URL}/profile.html`);
        
        // Profile Email should be visible and match our test user
        await expect(page.locator('#profile-email')).toHaveValue(testUser.email);
        
        // Order History should show at least 1 order from the checkout test
        await expect(page.locator('.card-header:has-text("Order Placed")').first()).toBeVisible();
        
        // Logout
        await page.click('button:has-text("Logout")');
        await page.waitForURL('**/index.html');
        await expect(page.locator('a[href="auth.html"]')).toBeVisible();
    });

    test('6. Admin Authentication & Management', async () => {
        await page.goto(`${BASE_URL}/auth.html`);
        
        // Login as admin
        await page.fill('#auth-username', adminUser.username);
        await page.fill('#auth-password', adminUser.password);
        await page.click('#auth-btn');
        
        await page.waitForURL('**/index.html');
        
        // Check for Admin Panel link and navigate
        await expect(page.locator('a[href="admin.html"]')).toBeVisible();
        await page.goto(`${BASE_URL}/admin.html`);
        
        // Dashboard stats should load
        await expect(page.locator('text=Total Orders')).toBeVisible();
        
        // 6a. Admin Book CRUD Test
        await page.evaluate(() => app.switchAdminTab('books'));
        await page.evaluate(() => app.openBookForm());
        await page.fill('#admin-book-title', 'Playwright Automated Book');
        await page.fill('#admin-book-author', 'QA Bot');
        await page.fill('#admin-book-price', '2500');
        await page.fill('#admin-book-stock', '50');
        await page.click('button:has-text("Save")');
        await expect(page.locator('.alert-success')).toBeVisible();
        
        // 6b. Admin Order Status Update Test
        await page.evaluate(() => app.switchAdminTab('sales'));
        const statusSelect = page.locator('select.form-select').first();
        await expect(statusSelect).toBeVisible();
        await statusSelect.selectOption('Shipped');
        await page.waitForResponse(res => res.url().includes('action=update_order_status'));
    });
});