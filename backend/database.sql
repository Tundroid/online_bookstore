-- Database: bookstore_db

CREATE DATABASE IF NOT EXISTS bookstore_db;
USE bookstore_db;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: books
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    publisher VARCHAR(255),
    price INT NOT NULL,
    genre VARCHAR(100),
    image_url VARCHAR(255),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_price INT NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50),
    payment_details VARCHAR(100),
    status ENUM('Pending', 'Processing', 'Shipped', 'Delivered') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: order_items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Table: cart
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY user_book (user_id, book_id)
);

-- Initial Admin (Password: admin123 - hashed for production)
-- Note: This is a placeholder for development.
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@bookstore.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'); 
-- password is 'password' in the hash above

-- Sample Books
INSERT INTO books (title, author, publisher, description, price, genre, stock) VALUES
('Sous la Cendre', 'Hervé Basile Ngoné', 'Clé', 'A powerful exploration of identity and tradition in Cameroon.', 12000, 'Fiction', 45),
('Le Vieux Nègre et la Médaille', 'Ferdinand Oyono', 'Julliard', 'A satirical Cameroonian classic critiquing colonialism.', 10500, 'Classic', 38),
('Une Vie de Boy', 'Ferdinand Oyono', 'Julliard', 'Life through the eyes of a houseboy in colonial Cameroon.', 9500, 'Fiction', 40),
('L\'Enfant de Sable', 'Tahar Ben Jelloun', 'Seuil', 'A mysterious tale from the Francophone world.', 11000, 'Fiction', 35),
('Tropiques Amers', 'Maryse Condé', 'Dalloz', 'Historical fiction connecting Africa and the Caribbean.', 13500, 'Historical', 28);
