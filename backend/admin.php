<?php
// backend/admin.php
require_once 'config.php';
session_start();
header('Content-Type: application/json');

// Secure Role Check
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Admin access required.']);
    exit;
}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Book CRUD
    if ($action === 'create_book' || $action === 'update_book') {
        $id = $_POST['id'] ?? null;
        $title = $_POST['title'] ?? '';
        $author = $_POST['author'] ?? '';
        $publisher = $_POST['publisher'] ?? '';
        $description = $_POST['description'] ?? '';
        $price = $_POST['price'] ?? 0;
        $genre = $_POST['genre'] ?? '';
        $stock = $_POST['stock'] ?? 0;
        $image_url = $_POST['image_url'] ?? '';
        
        if (empty($title) || empty($author) || empty($price)) {
            echo json_encode(['success' => false, 'message' => 'Title, author, and price required.']);
            exit;
        }

        if ($action === 'create_book') {
            $stmt = $pdo->prepare("INSERT INTO books (title, author, publisher, description, price, genre, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $author, $publisher, $description, $price, $genre, $stock, $image_url]);
            echo json_encode(['success' => true, 'message' => 'Book created successfully.']);
        } else {
            $stmt = $pdo->prepare("UPDATE books SET title=?, author=?, publisher=?, description=?, price=?, genre=?, stock=?, image_url=? WHERE id=?");
            $stmt->execute([$title, $author, $publisher, $description, $price, $genre, $stock, $image_url, $id]);
            echo json_encode(['success' => true, 'message' => 'Book updated successfully.']);
        }
    } elseif ($action === 'delete_book') {
        $id = $_POST['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM books WHERE id=?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Book deleted successfully.']);
        
    } elseif ($action === 'update_order_status') {
        $id = $_POST['order_id'] ?? 0;
        $status = $_POST['status'] ?? '';
        if (in_array($status, ['Pending', 'Processing', 'Shipped', 'Delivered'])) {
            $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            echo json_encode(['success' => true, 'message' => 'Order status updated.']);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Sales Report
    if ($action === 'sales_report') {
        $book_title = $_GET['book_title'] ?? '';
        $customer = $_GET['customer'] ?? '';
        $start_date = $_GET['start_date'] ?? '';
        $end_date = $_GET['end_date'] ?? '';

        $query = "SELECT o.id, o.created_at, o.total_price, o.status, u.username, b.title, oi.quantity 
                  FROM orders o JOIN users u ON o.user_id = u.id 
                  JOIN order_items oi ON o.id = oi.order_id 
                  JOIN books b ON oi.book_id = b.id WHERE 1=1";
        $params = [];

        if ($book_title) { $query .= " AND b.title LIKE ?"; $params[] = "%$book_title%"; }
        if ($customer) { $query .= " AND u.username LIKE ?"; $params[] = "%$customer%"; }
        if ($start_date && $end_date) {
            $query .= " AND DATE(o.created_at) BETWEEN ? AND ?";
            array_push($params, $start_date, $end_date);
        }
        $stmt = $pdo->prepare($query . " ORDER BY o.created_at DESC");
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    }
}
?>