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

        if (empty($payment_phone)) {
            echo json_encode(['success' => false, 'message' => 'Payment phone number is required.']);
            exit;
        }

        if (!in_array(explode('(', $payment_method)[0], ['MTN MoMo', 'Orange Money', 'Cash on Delivery'])) {
            echo json_encode(['success' => false, 'message' => 'Invalid payment method.']);
            exit;
        }

        // Validate phone number format (basic check for 8-12 digits)
        if (!preg_match('/^[0-9]{8,12}$/', $payment_phone)) {
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
        $order_id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("SELECT oi.*, b.title, b.author, b.image_url 
                                FROM order_items oi JOIN books b ON oi.book_id = b.id 
                                WHERE oi.order_id = ?");
        $stmt->execute([$order_id]);
        $details = $stmt->fetchAll();
        echo json_encode($details);
    }
}
?>
