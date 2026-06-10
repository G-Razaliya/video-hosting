<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_clean();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'uploaded_at';

$allowedSort = ['title', 'likes', 'uploaded_at'];
if (!in_array($sort, $allowedSort)) {
    $sort = 'uploaded_at';
}

$order = ($sort === 'likes') ? 'DESC' : 'ASC';

$sql = "SELECT * FROM videos WHERE title LIKE :search ORDER BY $sort $order";
$stmt = $pdo->prepare($sql);
$stmt->execute(['search' => "%$search%"]);
$videos = $stmt->fetchAll(PDO::FETCH_ASSOC);

session_start();
$user_id = $_SESSION['user_id'] ?? 0;

if ($user_id) {
    $stmtLikes = $pdo->prepare("SELECT video_id FROM video_likes WHERE user_id = ?");
    $stmtLikes->execute([$user_id]);
    $userLikes = $stmtLikes->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($videos as &$video) {
        $video['user_liked'] = in_array($video['id'], $userLikes);
    }
}

echo json_encode($videos);
?>