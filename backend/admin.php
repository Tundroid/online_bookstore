<?php
// backend/admin.php
require_once 'config.php';
session_start();

header('Content-Type: application/json');

// Security check: Only admins allowed
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'add_book') {
        $title = $_POST['title'] ?? '';
        $author = $_POST['author'] ?? '';
        $price = $_POST['price'] ?? 0;
        $genre = $_POST['genre'] ?? '';
        $stock = $_POST['stock'] ?? 0;
        $description = $_POST['description'] ?? '';
        $image_url = $_POST['image_url'] ?? '';

        $stmt = $pdo->prepare("INSERT INTO books (title, author, price, genre, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $author, $price, $genre, $stock, $description, $image_url]);
        echo json_encode(['success' => true, 'message' => 'Book added successfully.']);
    } elseif ($action === 'update_book') {
        $id = $_POST['id'] ?? 0;
        $title = $_POST['title'] ?? '';
        $author = $_POST['author'] ?? '';
        $price = $_POST['price'] ?? 0;
        $genre = $_POST['genre'] ?? '';
        $stock = $_POST['stock'] ?? 0;
        $description = $_POST['description'] ?? '';
        $image_url = $_POST['image_url'] ?? '';

        $stmt = $pdo->prepare("UPDATE books SET title=?, author=?, price=?, genre=?, stock=?, description=?, image_url=? WHERE id=?");
        $stmt->execute([$title, $author, $price, $genre, $stock, $description, $image_url, $id]);
        echo json_encode(['success' => true, 'message' => 'Book updated successfully.']);
    } elseif ($action === 'delete_book') {
        $id = $_POST['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM books WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Book deleted successfully.']);
    } elseif ($action === 'update_order_status') {
        $id = $_POST['id'] ?? 0;
        $status = $_POST['status'] ?? 'Pending';
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        echo json_encode(['success' => true, 'message' => 'Order status updated.']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'sales_report') {
        $stmt = $pdo->query("SELECT o.id, u.username, o.total_price, o.status, o.created_at 
                             FROM orders o JOIN users u ON o.user_id = u.id 
                             ORDER BY o.created_at DESC");
        $report = $stmt->fetchAll();
        echo json_encode($report);
    } elseif ($action === 'stats') {
        $total_sales = $pdo->query("SELECT SUM(total_price) FROM orders WHERE status != 'Cancelled'")->fetchColumn() ?: 0;
        $total_orders = $pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $total_books = $pdo->query("SELECT COUNT(*) FROM books")->fetchColumn();
        echo json_encode([
            'totalSales' => $total_sales,
            'totalOrders' => $total_orders,
            'totalBooks' => $total_books
        ]);
    }
}
?>
