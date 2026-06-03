<?php
// backend/books.php
require_once 'config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? 'list';

if ($action === 'list') {
    $search = $_GET['search'] ?? '';
    $genre = $_GET['genre'] ?? '';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 6;
    $offset = ($page - 1) * $limit;

    $query = "SELECT * FROM books WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $query .= " AND (title LIKE ? OR author LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    if (!empty($genre)) {
        $query .= " AND genre = ?";
        $params[] = $genre;
    }

    // Count total for pagination
    $countQuery = str_replace("SELECT *", "SELECT COUNT(*)", $query);
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($params);
    $totalBooks = $countStmt->fetchColumn();
    $totalPages = ceil($totalBooks / $limit);

    $query .= " LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $books = $stmt->fetchAll();

    echo json_encode([
        'books' => $books,
        'totalPages' => $totalPages,
        'currentPage' => $page
    ]);
} elseif ($action === 'genres') {
    $stmt = $pdo->query("SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL AND genre != ''");
    $genres = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($genres);
} elseif ($action === 'details') {
    $id = $_GET['id'] ?? 0;
    $stmt = $pdo->prepare("SELECT * FROM books WHERE id = ?");
    $stmt->execute([$id]);
    $book = $stmt->fetch();
    echo json_encode($book);
}
?>
