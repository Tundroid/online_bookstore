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

        $stmt = $pdo->prepare("INSERT INTO cart (user_id, book_id, quantity) VALUES (?, ?, ?) 
                                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)");
        $stmt->execute([$user_id, $book_id, $quantity]);
        echo json_encode(['success' => true, 'message' => 'Added to cart.']);
    } elseif ($action === 'update') {
        $book_id = $_POST['book_id'] ?? 0;
        $quantity = $_POST['quantity'] ?? 1;

        if ($quantity <= 0) {
            $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND book_id = ?");
            $stmt->execute([$user_id, $book_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND book_id = ?");
            $stmt->execute([$quantity, $user_id, $book_id]);
        }
        echo json_encode(['success' => true, 'message' => 'Cart updated.']);
    } elseif ($action === 'remove') {
        $book_id = $_POST['book_id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND book_id = ?");
        $stmt->execute([$user_id, $book_id]);
        echo json_encode(['success' => true, 'message' => 'Removed from cart.']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT c.book_id, c.quantity, b.title, b.author, b.price, b.image_url 
                                FROM cart c JOIN books b ON c.book_id = b.id WHERE c.user_id = ?");
        $stmt->execute([$user_id]);
        $items = $stmt->fetchAll();
        echo json_encode($items);
    }
}
?>
