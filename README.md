# Online Bookstore Web Application

## Project Overview
This project implements a fully functional Online Bookstore using PHP, MySQL, HTML, CSS, Bootstrap, and vanilla JavaScript. It supports user authentication, book browsing, search and filter functionality, a shopping cart, checkout flow, order history, and an admin panel for inventory and sales management.

## Key Features
- User registration, login, logout, and session management
- Responsive book catalog with title, author, genre, price, and cover image
- Search by book title, author, and genre
- Book details page with full information and Add to Cart functionality
- Shopping cart with quantity update, removal, and running totals
- Checkout workflow with shipping address, payment details, and order submission
- Order history and invoice retrieval for authenticated users
- Admin panel with secure access, book CRUD operations, sales reporting, and order status management
- Backend built with PHP and PDO, frontend built with Bootstrap and client-side JavaScript

## Repository Structure
- `frontend/` - all user-facing HTML, CSS, and JavaScript files
- `backend/` - PHP API endpoints and database configuration
- `docs/` - project documentation and report material
- `package.json` - Playwright test setup for end-to-end testing
- `e2e.spec.js` - sample end-to-end test file
- `playwright.config.js` - Playwright configuration

## Requirements
- PHP 8.x
- MySQL or MariaDB
- Web server such as Apache or Nginx
- Optional: Node.js and Playwright for automated testing

## Local Setup
1. Copy the project folder into your web server root directory.
2. Start your web server and database server.
3. Import the database schema and sample data from `backend/database.sql`.
4. Open `backend/config.php` and update the database credentials to match your environment.
5. Access the application in the browser at:
   - `http://localhost/<project-folder>/frontend/index.html`

## Default Admin Account
- Username: `admin`
- Email: `admin@bookstore.com`
- Password: `password`

## Running the App
- Use the catalog page at `frontend/index.html` to browse books.
- Use `frontend/auth.html` to register or login.
- Use `frontend/cart.html` to manage your cart.
- Use `frontend/checkout.html` to place an order.
- Use `frontend/orders.html` to view order history.
- Use `frontend/admin.html` if logged in as an administrator.

## Backend Endpoints
- `backend/auth.php` - user registration, login, logout, and status check
- `backend/books.php` - fetch book listings and book details
- `backend/cart.php` - add, update, remove, and list cart items
- `backend/orders.php` - create orders, list order history, and fetch invoice details
- `backend/admin.php` - admin book CRUD, order status updates, sales reports, and dashboard stats

## Testing
- Install dependencies:
  ```bash
  npm install
  ```
- Run Playwright tests:
  ```bash
  npm test
  ```

## Deployment Notes
- Ensure PHP has access to the `backend/` files and the database is reachable.
- For production, serve the app over HTTPS and set `session.cookie_secure = 1` in `backend/config.php`.
- Protect `backend/` files from direct browsing if needed by server configuration.

## Documentation
See `docs/DOCUMENTATION.md` for a full project overview, database schema description, architecture details, setup steps, and user manual.

## Notes
- This project is organized as a multi-page application with shared JavaScript logic in `frontend/app.js`.
- All database interactions use prepared statements to improve security.
- The `backend/database.sql` file includes sample data and an initial admin account.
