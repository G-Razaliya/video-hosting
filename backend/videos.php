<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_clean();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'uploaded_at';

// Безопасное преобразование sort
$allowedSort = ['title', 'likes', 'uploaded_at'];
if (!in_array($sort, $allowedSort)) {
    $sort = 'uploaded_at';
}

$order = ($sort === 'likes') ? 'DESC' : 'ASC';

$sql = "SELECT * FROM videos WHERE title LIKE :search ORDER BY $sort $order";
$stmt = $pdo->prepare($sql);
$stmt->execute(['search' => "%$search%"]);
$videos = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($videos);
?>