<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_clean();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'] ?? '';
    $file = $_FILES['video'] ?? null;

    if (empty($title) || !$file || $file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'Название и файл обязательны']);
        exit;
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $allowed = ['mp4', 'webm', 'ogg', 'mov'];
    if (!in_array(strtolower($ext), $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Недопустимый формат видео (разрешены: mp4, webm, ogg, mov)']);
        exit;
    }

    if ($file['size'] > 200 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'Файл слишком большой (макс. 200MB)']);
        exit;
    }

    $filename = uniqid() . '.' . $ext;
    $uploadPath = __DIR__ . '/videos/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        $stmt = $pdo->prepare("INSERT INTO videos (title, filename) VALUES (?, ?)");
        $stmt->execute([$title, $filename]);
        echo json_encode(['success' => true, 'message' => 'Видео загружено']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Ошибка сохранения файла']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
?>