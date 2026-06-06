<?php
// backend/orders.php
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
    if ($action === 'create') {
        $shipping_address = trim($_POST['address'] ?? '');
        $payment_method = trim($_POST['payment-method'] ?? '');
        $payment_phone = trim($_POST['payment-details'] ?? '');

        // Server-side validation
        if (empty($shipping_address) || strlen($shipping_address) < 10) {
            echo json_encode(['success' => false, 'message' => 'Shipping address must be at least 10 characters.']);
            exit;
        }
        
        if (empty($payment_method)) {
            echo json_encode(['success' => false, 'message' => 'Payment method is required.']);
            exit;
        }

        $validPaymentMethods = ['MTN MoMo', 'Orange Money', 'Cash on Delivery'];
        if (!in_array($payment_method, $validPaymentMethods, true)) {
            echo json_encode(['success' => false, 'message' => 'Invalid payment method.']);
            exit;
        }

        // Phone is required for mobile money, optional for COD
        if (empty($payment_phone)) {
            if ($payment_method !== 'Cash on Delivery') {
                echo json_encode(['success' => false, 'message' => 'Payment phone number is required for mobile money payments.']);
                exit;
            }
        } elseif (!preg_match('/^[0-9]{8,12}$/', $payment_phone)) {
            // Only validate format if a phone was provided
            echo json_encode(['success' => false, 'message' => 'Invalid phone number format.']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // 1. Get cart items
            $stmt = $pdo->prepare("SELECT c.book_id, c.quantity, b.price, b.stock FROM cart c JOIN books b ON c.book_id = b.id WHERE c.user_id = ?");
            $stmt->execute([$user_id]);
            $items = $stmt->fetchAll();

            if (empty($items)) {
                echo json_encode(['success' => false, 'message' => 'Cart is empty.']);
                $pdo->rollBack();
                exit;
            }

            // Validate stock availability for all items
            foreach ($items as $item) {
                if ($item['quantity'] > $item['stock']) {
                    $pdo->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Insufficient stock for one or more items. Please update your cart.']);
                    exit;
                }
            }

            $total_price = 0;
            foreach ($items as $item) {
                $total_price += $item['price'] * $item['quantity'];
            }

            // 2. Create Order
            $stmt = $pdo->prepare("INSERT INTO orders (user_id, total_price, shipping_address, payment_method, payment_details) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$user_id, $total_price, $shipping_address, $payment_method, $payment_phone]);
            $order_id = $pdo->lastInsertId();

            // 3. Move items to order_items and update stock
            $insertItem = $pdo->prepare("INSERT INTO order_items (order_id, book_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)");
            $updateStock = $pdo->prepare("UPDATE books SET stock = stock - ? WHERE id = ?");

            foreach ($items as $item) {
                $insertItem->execute([$order_id, $item['book_id'], $item['quantity'], $item['price']]);
                $updateStock->execute([$item['quantity'], $item['book_id']]);
            }

            // 4. Clear Cart
            $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
            $stmt->execute([$user_id]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Order placed successfully.', 'order_id' => $order_id]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Order failed: ' . $e->getMessage()]);
        }
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $orders = $stmt->fetchAll();
        echo json_encode($orders);
    } elseif ($action === 'details') {
        $order_id = (int)($_GET['id'] ?? 0);
        if ($order_id <= 0) {
            echo json_encode([]);
            exit;
        }

        if ($_SESSION['role'] !== 'admin') {
            $stmt = $pdo->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ?");
            $stmt->execute([$order_id, $user_id]);
            if (!$stmt->fetch()) {
                echo json_encode([]);
                exit;
            }
        }

        $stmt = $pdo->prepare("SELECT oi.*, b.title, b.author, b.image_url FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?");
        $stmt->execute([$order_id]);
        $details = $stmt->fetchAll();
        echo json_encode($details);
    } elseif ($action === 'invoice') {
        $order_id = (int)($_GET['id'] ?? 0);
        if ($order_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid order identifier.']);
            exit;
        }

        $query = "SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?";
        $params = [$order_id];

        if ($_SESSION['role'] !== 'admin') {
            $query .= " AND o.user_id = ?";
            $params[] = $user_id;
        }

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $order = $stmt->fetch();

        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'Invoice not found or access denied.']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT oi.*, b.title, b.author, b.image_url FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?");
        $stmt->execute([$order_id]);
        $items = $stmt->fetchAll();

        echo json_encode(['success' => true, 'order' => $order, 'items' => $items]);
    }
}
?>
