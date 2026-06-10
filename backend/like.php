<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_clean();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$videoId = $data['video_id'] ?? 0;

if (!$videoId) {
    echo json_encode(['success' => false, 'message' => 'ID видео не указан']);
    exit;
}

$stmt = $pdo->prepare("UPDATE videos SET likes = likes + 1 WHERE id = ?");
$stmt->execute([$videoId]);

$stmt = $pdo->prepare("SELECT likes FROM videos WHERE id = ?");
$stmt->execute([$videoId]);
$likes = $stmt->fetchColumn();

echo json_encode(['success' => true, 'likes' => $likes]);
?>