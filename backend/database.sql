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
INSERT INTO books (title, author, publisher, description, price, genre, stock, image_url) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 'Scribner', 'A story of wealth and love.', 10000, 'Classic', 50, 'https://covers.openlibrary.org/b/id/12818862-L.jpg'),
('1984', 'George Orwell', 'Secker & Warburg', 'Dystopian future.', 8990, 'Sci-Fi', 30, 'https://covers.openlibrary.org/b/id/14571901-L.jpg'),
('To Kill a Mockingbird', 'Harper Lee', 'J. B. Lippincott & Co.', 'A classic novel.', 12500, 'Fiction', 20, 'https://covers.openlibrary.org/b/id/14515155-L.jpg'),
('Sous la Cendre', 'Hervé Basile Ngoné', 'Clé', 'A powerful exploration of identity and tradition in Cameroon.', 12000, 'Fiction', 45, 'https://covers.openlibrary.org/b/id/11145265-L.jpg'),
('Le Vieux Nègre et la Médaille', 'Ferdinand Oyono', 'Julliard', 'A satirical Cameroonian classic critiquing colonialism.', 10500, 'Classic', 38, 'https://covers.openlibrary.org/b/id/12574169-L.jpg'),
('Une Vie de Boy', 'Ferdinand Oyono', 'Julliard', 'Life through the eyes of a houseboy in colonial Cameroon.', 9500, 'Fiction', 40, 'https://covers.openlibrary.org/b/id/12024765-L.jpg'),
('L\'Enfant de Sable', 'Tahar Ben Jelloun', 'Seuil', 'A mysterious tale from the Francophone world.', 11000, 'Fiction', 35, 'https://covers.openlibrary.org/b/id/9242940-L.jpg'),
('Tropiques Amers', 'Maryse Condé', 'Dalloz', 'Historical fiction connecting Africa and the Caribbean.', 13500, 'Historical', 28, 'https://covers.openlibrary.org/b/id/10459807-L.jpg'),
('Le Pauvre Christ de Bomba', 'Mongo Beti', 'Présence Africaine', 'A sharp critique of missionary work in colonial Cameroon.', 11500, 'Classic', 42, 'https://covers.openlibrary.org/b/id/10204732-L.jpg'),
('Things Fall Apart', 'Chinua Achebe', 'Heinemann', 'The definitive modern African novel tracking colonial collision.', 9900, 'Fiction', 60, 'https://covers.openlibrary.org/b/id/12711656-L.jpg'),
('C\'est le Soleil qui m\'a Brûlée', 'Calixthe Beyala', 'Stock', 'A powerful feminist perspective on life in an African city.', 10800, 'Fiction', 25, 'https://covers.openlibrary.org/b/id/9378945-L.jpg'),
('Mission Terminée', 'Mongo Beti', 'Corrêa', 'A witty social comedy about a young man returning to his village.', 9800, 'Classic', 30, 'https://covers.openlibrary.org/b/id/12833074-L.jpg'),
('Chronique d\'une Mort Annoncée', 'Gabriel García Márquez', 'Grasset', 'A brilliant short novel about honor, fate, and memory.', 8500, 'Fiction', 50, 'https://covers.openlibrary.org/b/id/12644265-L.jpg'),
('Balafon', 'Engelbert Mveng', 'Clé', 'A beautiful collection of poetry celebrating African cultural heritage.', 7500, 'Poetry', 22, 'https://covers.openlibrary.org/b/id/10198905-L.jpg'),
('L\'Étranger', 'Albert Camus', 'Gallimard', 'The famous existentialist novel set in French Algeria.', 9200, 'Classic', 48, 'https://covers.openlibrary.org/b/id/12918451-L.jpg'),
('Le Pleurer-Rire', 'Henri Lopes', 'Présence Africaine', 'A brilliant satirical look at political dictatorship in Africa.', 12200, 'Fiction', 18, 'https://covers.openlibrary.org/b/id/2967681-L.jpg'),
('Americanah', 'Chimamanda Ngozi Adichie', 'Knopf', 'A modern tale of race, love, and identity across continents.', 14000, 'Fiction', 35, 'https://covers.openlibrary.org/b/id/14580211-L.jpg'),
('Dune', 'Frank Herbert', 'Chilton Books', 'The epic masterpiece of sci-fi politics and desert ecology.', 15000, 'Sci-Fi', 55, 'https://covers.openlibrary.org/b/id/14574921-L.jpg'),
('L\'Aventure Ambiguë', 'Cheikh Hamidou Kane', 'Julliard', 'A profound philosophical conflict between Western and African thought.', 10000, 'Classic', 27, 'https://covers.openlibrary.org/b/id/11993217-L.jpg'),
('Petit Pays', 'Gaël Faye', 'Grasset', 'A heartbreaking yet beautiful story of childhood disrupted by war.', 11800, 'Historical', 33, 'https://covers.openlibrary.org/b/id/12536838-L.jpg');