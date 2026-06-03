# Online Bookstore - Documentation

## 1. Project Overview
The Online Bookstore is a web application designed to provide users with a platform to browse, search, and purchase books. It features a secure authentication system, a searchable book catalog, a persistent shopping cart, and a detailed order history. Administrators have access to a dedicated panel for managing the inventory and viewing sales performance.

### Goals
- Provide a responsive and intuitive user interface.
- Ensure secure data management for users and orders.
- Facilitate efficient book management for administrators.

## 2. Database Schema (ERD)
The system uses a MySQL relational database with the following tables:

### Users Table
- `id`: Primary Key
- `username`: Unique username for login
- `email`: Unique email address
- `password`: Hashed password (bcrypt)
- `role`: 'user' or 'admin'
- `created_at`: Registration timestamp

### Books Table
- `id`: Primary Key
- `title`: Book title
- `author`: Book author
- `description`: Full description of the book
- `price`: Unit price
- `genre`: Category/Genre
- `image_url`: Path or link to cover image
- `stock`: Current quantity in inventory

### Cart Table
- `id`: Primary Key
- `user_id`: Foreign Key to Users
- `book_id`: Foreign Key to Books
- `quantity`: Number of items in cart

### Orders Table
- `id`: Primary Key
- `user_id`: Foreign Key to Users
- `total_price`: Total order amount
- `shipping_address`: Destination address
- `payment_method`: Method of payment
- `status`: Pending, Processing, Shipped, Delivered
- `created_at`: Order timestamp

### Order_Items Table
- `id`: Primary Key
- `order_id`: Foreign Key to Orders
- `book_id`: Foreign Key to Books
- `quantity`: Quantity purchased
- `price_at_purchase`: Historical price at time of order

## 3. Architecture Description

### Backend Architecture
- **Language:** PHP 8.x
- **Data Access:** PDO (PHP Data Objects) for secure, prepared SQL statements.
- **Session Management:** Native PHP sessions for user authentication and state.
- **API Design:** REST-like JSON endpoints for modular communication with the frontend.

### Frontend Architecture
- **Styling:** Bootstrap 5 for responsive design and UI components.
- **Client Logic:** Vanilla JavaScript (ES6+) using `fetch` API for asynchronous data fetching.
- **Structure:** Single-page-like behavior for forms and lists while maintaining separate HTML files for distinct views.

## 4. Setup Instructions

### Local Environment
1. **Requirements:** XAMPP, WAMP, or any environment with PHP and MySQL.
2. **Database Setup:**
   - Create a database named `bookstore_db`.
   - Import the `backend/database.sql` script.
3. **Configuration:**
   - Edit `backend/config.php` with your database credentials (host, username, password).
4. **Running the App:**
   - Place the project folder in your web root (e.g., `htdocs`).
   - Access `http://localhost/advanced_web_dev/frontend/index.html`.

## 5. User Manual

### For Customers
1. **Registration/Login:** Use the "Login/Register" link in the navbar to create an account or sign in.
2. **Browsing:** The homepage displays the book catalog. Use the search bar or genre filter to find specific books.
3. **Purchasing:**
   - Click "Details" to view more info.
   - Click "Add to Cart" to add a book.
   - Go to "Cart" to review items and proceed to "Checkout".
4. **Order History:** View your past orders in the "My Orders" section.

### For Administrators
1. **Access:** Log in with an admin account (default: `admin` / `password`).
2. **Management:**
   - Use the "Admin" link in the navbar.
   - "Manage Books" allows adding, editing, and deleting inventory.
   - "Sales Report" shows all orders and allows updating their status (e.g., Shipped).
