<?php
// backend/cart.php
require_once 'config.php';
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login first.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'add') {
        $book_id = $_POST['book_id'] ?? 0;
        $quantity = $_POST['quantity'] ?? 1;

        // Check stock availability
        $stmtBook = $pdo->prepare("SELECT stock FROM books WHERE id = ?");
        $stmtBook->execute([$book_id]);
        $book = $stmtBook->fetch();

        if (!$book) {
            echo json_encode(['success' => false, 'message' => 'Book not found.']);
            exit;
        }

        if ($quantity > $book['stock']) {
            echo json_encode(['success' => false, 'message' => "Only {$book['stock']} item(s) available in stock."]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO cart (user_id, book_id, quantity) VALUES (?, ?, ?) 
                                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)");
        $stmt->execute([$user_id, $book_id, $quantity]);
        
        // Verify final cart quantity doesn't exceed stock
        $stmtCart = $pdo->prepare("SELECT quantity FROM cart WHERE user_id = ? AND book_id = ?");
        $stmtCart->execute([$user_id, $book_id]);
        $cartItem = $stmtCart->fetch();
        
        if ($cartItem['quantity'] > $book['stock']) {
            echo json_encode(['success' => false, 'message' => "Only {$book['stock']} item(s) available. Please reduce quantity."]);
            exit;
        }
        
        echo json_encode(['success' => true, 'message' => 'Added to cart.']);
    } elseif ($action === 'update') {
        $book_id = $_POST['book_id'] ?? $_POST['id'] ?? 0;
        $quantity = $_POST['quantity'] ?? 1;

        if ($quantity <= 0) {
            $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND book_id = ?");
            $stmt->execute([$user_id, $book_id]);
        } else {
            // Check stock availability before updating
            $stmtBook = $pdo->prepare("SELECT stock FROM books WHERE id = ?");
            $stmtBook->execute([$book_id]);
            $book = $stmtBook->fetch();

            if (!$book) {
                echo json_encode(['success' => false, 'message' => 'Book not found.']);
                exit;
            }

            if ($quantity > $book['stock']) {
                echo json_encode(['success' => false, 'message' => "Only {$book['stock']} item(s) available in stock."]);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND book_id = ?");
            $stmt->execute([$quantity, $user_id, $book_id]);
        }
        echo json_encode(['success' => true, 'message' => 'Cart updated.']);
    } elseif ($action === 'remove') {
        $book_id = $_POST['book_id'] ?? $_POST['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND book_id = ?");
        $stmt->execute([$user_id, $book_id]);
        echo json_encode(['success' => true, 'message' => 'Removed from cart.']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT c.book_id, c.quantity, b.title, b.author, b.price, b.image_url, b.stock 
                                FROM cart c JOIN books b ON c.book_id = b.id WHERE c.user_id = ?");
        $stmt->execute([$user_id]);
        $items = $stmt->fetchAll();
        echo json_encode($items);
    } elseif ($action === 'count') {
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(quantity), 0) AS count FROM cart WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $count = $stmt->fetchColumn();
        echo json_encode(['count' => (int)$count]);
    }
}
?>
