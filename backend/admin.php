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
        $title = trim($_POST['title'] ?? '');
        $author = trim($_POST['author'] ?? '');
        $publisher = trim($_POST['publisher'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $price = (float)($_POST['price'] ?? 0);
        $genre = trim($_POST['genre'] ?? '');
        $stock = (int)($_POST['stock'] ?? 0);
        $image_url = trim($_POST['image_url'] ?? '');
        
        if (empty($title) || strlen($title) < 3) {
            echo json_encode(['success' => false, 'message' => 'Title must be at least 3 characters.']);
            exit;
        }
        
        if (empty($author) || strlen($author) < 2) {
            echo json_encode(['success' => false, 'message' => 'Author must be at least 2 characters.']);
            exit;
        }
        
        if ($price <= 0) {
            echo json_encode(['success' => false, 'message' => 'Price must be greater than 0.']);
            exit;
        }
        
        if ($stock < 0) {
            echo json_encode(['success' => false, 'message' => 'Stock cannot be negative.']);
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
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid book ID.']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM books WHERE id=?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Book deleted successfully.']);
        
    } elseif ($action === 'update_order_status') {
        $id = (int)($_POST['order_id'] ?? 0);
        $status = $_POST['status'] ?? '';
        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid order ID.']);
            exit;
        }
        if (in_array($status, ['Pending', 'Processing', 'Shipped', 'Delivered'])) {
            $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            echo json_encode(['success' => true, 'message' => 'Order status updated.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid status value.']);
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

    if ($action === 'dashboard_stats') {
        $stats = [
            'total_orders' => 0,
            'total_revenue' => 0,
            'average_order_value' => 0,
            'total_books_sold' => 0,
            'total_customers' => 0,
            'top_book_title' => null,
            'top_customer_name' => null,
            'status_breakdown' => null,
            'recent_orders' => []
        ];

        $stmt = $pdo->query("SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_price), 0) AS total_revenue, COALESCE(AVG(total_price), 0) AS average_order_value, COUNT(DISTINCT user_id) AS total_customers FROM orders");
        $stats = array_merge($stats, $stmt->fetch());

        $stmt = $pdo->query("SELECT COALESCE(SUM(oi.quantity), 0) AS total_books_sold FROM order_items oi");
        $stats['total_books_sold'] = (int)$stmt->fetchColumn();

        $stmt = $pdo->query("SELECT b.title FROM order_items oi JOIN books b ON oi.book_id = b.id GROUP BY b.id ORDER BY SUM(oi.quantity) DESC LIMIT 1");
        $stats['top_book_title'] = $stmt->fetchColumn() ?: 'N/A';

        $stmt = $pdo->query("SELECT u.username FROM orders o JOIN users u ON o.user_id = u.id GROUP BY u.id ORDER BY SUM(o.total_price) DESC LIMIT 1");
        $stats['top_customer_name'] = $stmt->fetchColumn() ?: 'N/A';

        $stmt = $pdo->query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY FIELD(status, 'Pending', 'Processing', 'Shipped', 'Delivered')");
        $breakdown = [];
        while ($row = $stmt->fetch()) {
            $breakdown[] = "{$row['status']}: {$row['count']}";
        }
        $stats['status_breakdown'] = implode(' • ', $breakdown);

        $stmt = $pdo->query("SELECT o.id, o.created_at, o.total_price, o.status, u.username FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5");
        $stats['recent_orders'] = $stmt->fetchAll();

        echo json_encode(['success' => true, 'stats' => $stats]);
    }
}
?>