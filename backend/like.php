<?php
session_start();
error_reporting(0);
ini_set('display_errors', 0);
ob_clean();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

$user_id = $_SESSION['user_id'] ?? 0;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Не авторизован']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$video_id = $data['video_id'] ?? 0;

if (!$video_id) {
    echo json_encode(['success' => false, 'message' => 'ID видео не указан']);
    exit;
}

// Проверяем, есть ли уже лайк
$stmt = $pdo->prepare("SELECT id FROM video_likes WHERE user_id = ? AND video_id = ?");
$stmt->execute([$user_id, $video_id]);
$existing = $stmt->fetch();

if ($existing) {
    // Удаляем лайк
    $stmt = $pdo->prepare("DELETE FROM video_likes WHERE user_id = ? AND video_id = ?");
    $stmt->execute([$user_id, $video_id]);
    $stmt = $pdo->prepare("UPDATE videos SET likes = likes - 1 WHERE id = ?");
    $stmt->execute([$video_id]);
    $action = 'unliked';
} else {
    // Добавляем лайк
    $stmt = $pdo->prepare("INSERT INTO video_likes (user_id, video_id) VALUES (?, ?)");
    $stmt->execute([$user_id, $video_id]);
    $stmt = $pdo->prepare("UPDATE videos SET likes = likes + 1 WHERE id = ?");
    $stmt->execute([$video_id]);
    $action = 'liked';
}

// Получаем новое количество лайков
$stmt = $pdo->prepare("SELECT likes FROM videos WHERE id = ?");
$stmt->execute([$video_id]);
$likes = $stmt->fetchColumn();

echo json_encode(['success' => true, 'likes' => $likes, 'action' => $action]);
?>