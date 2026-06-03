# Project Plan: Online Bookstore Web Application

## 1. Overview
A fully functional online bookstore where users can browse, search, and purchase books. Built with a PHP backend and a Bootstrap-enhanced frontend.

## 2. Directory Structure
- `frontend/`: Client-side code (HTML, CSS, JS, Bootstrap).
- `backend/`: Server-side code (PHP, MySQL connection, API logic).
- `docs/`: Documentation, ERD, and user manual.

## 3. Database Schema (MySQL)
- `users`: id, username, email, password, role (admin/user), created_at.
- `books`: id, title, author, description, price, genre, image_url, stock, created_at.
- `orders`: id, user_id, total_price, shipping_address, payment_info, status, created_at.
- `order_items`: id, order_id, book_id, quantity, price_at_purchase.
- `cart`: (Optional for persistent cart) id, user_id, book_id, quantity.

## 4. Implementation Phases

### Phase 1: Foundation (Current)
- [x] Analyze Requirements
- [x] Create Directory Structure
- [ ] Database Schema Design & SQL Script

### Phase 2: Backend Development
- [ ] Database Connection Setup
- [ ] Authentication System (Register/Login/Session)
- [ ] Book API (CRUD for Admin, Search/List for Users)
- [ ] Cart & Order Processing Logic

### Phase 3: Frontend Development
- [ ] Basic Layout & Navigation (Bootstrap)
- [ ] Book Catalog & Search UI
- [ ] Book Details View
- [ ] Shopping Cart & Checkout UI
- [ ] User Profile & Order History Dashboard
- [ ] Admin Panel UI

### Phase 4: Integration & Refinement
- [ ] Connect Frontend to Backend APIs
- [ ] Client-side and Server-side Validation
- [ ] Responsive Design Polish

### Phase 5: Documentation
- [ ] Project Overview
- [ ] ERD Diagram
- [ ] Setup & User Manual

## 5. Technology Stack
- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript (ES6+)
- **Backend:** PHP 8.x
- **Database:** MySQL
- **Environment:** Local PHP server (e.g., Apache/Nginx via XAMPP/Docker)
