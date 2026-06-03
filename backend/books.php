<?php
// backend/books.php
require_once 'config.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? 'list';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 10; // Items per page
        $offset = ($page - 1) * $limit;
        
        $search = $_GET['search'] ?? '';
        $author = $_GET['author'] ?? '';
        $genre = $_GET['genre'] ?? '';
        $id = $_GET['id'] ?? '';
        $query = "SELECT * FROM books WHERE 1=1";
        $params = [];
        
        if (!empty($search)) {
            $query .= " AND title LIKE ?";
            $params[] = "%$search%";
        }
        if (!empty($author)) {
            $query .= " AND author LIKE ?";
            $params[] = "%$author%";
        }
        if (!empty($genre)) {
            $query .= " AND genre = ?";
            $params[] = $genre;
        }
        if (!empty($id)) {
            $query .= " AND id = ?";
            $params[] = $id;
        }
        
        // Pagination total
        $countQuery = str_replace("SELECT *", "SELECT COUNT(*)", $query);
        $stmtCount = $pdo->prepare($countQuery);
        $stmtCount->execute($params);
        $total = $stmtCount->fetchColumn();
        
        // Fetch paginated results
        $query .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true, 'data' => $stmt->fetchAll(), 'total' => $total,
            'page' => $page, 'pages' => ceil($total / $limit)
        ]);
    }
}
?>