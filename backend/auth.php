<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_clean();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Подключаем файл с подключением к БД
require_once 'config.php';

$action = $_POST['action'] ?? '';

if ($action === 'register') {
    $email = $_POST['email'] ?? '';
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    if (empty($email) || empty($_POST['password'])) {
        echo json_encode(['success' => false, 'message' => 'Заполните все поля']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Некорректный email']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
        $stmt->execute([$email, $password]);
        echo json_encode(['success' => true, 'message' => 'Регистрация успешна']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Email уже существует']);
    }
    exit;
}

if ($action === 'login') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        session_start();
        $_SESSION['user_id'] = $user['id'];
        echo json_encode(['success' => true, 'message' => 'Вход выполнен']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Неверный email или пароль']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
?>