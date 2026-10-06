<?php

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$code = $input['code'] ?? '';

if (!$code) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Authorization code is required'
    ]);
    exit;
}

/*
 * JANGAN simpan App Secret di file ini.
 *
 * Untuk sementara, kita hanya menerima code dan
 * mengembalikan bahwa backend siap memprosesnya.
 *
 * App Secret akan kita masukkan melalui konfigurasi
 * server setelah struktur backend selesai.
 */

echo json_encode([
    'success' => true,
    'message' => 'Authorization code received by backend.'
]);