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

$config = require '/home/naturash/meta_config.php';

$appId = $config['meta_app_id'];
$appSecret = $config['meta_app_secret'];

$redirectUri = 'https://developers.facebook.com/es/oauth/callback/?product_route=whatsapp-business&business_id=1548900637261966&nonce=jvdkWeNWehszlaSNFAaXAMRgyk0xrpPx';

$url = 'https://graph.facebook.com/v25.0/oauth/access_token';

$data = [
    'client_id' => $appId,
    'client_secret' => $appSecret,
    'code' => $code,
    'redirect_uri' => $redirectUri,
    'grant_type' => 'authorization_code'
];

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($response === false) {
    curl_close($ch);

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to connect to Meta'
    ]);
    exit;
}

curl_close($ch);

$result = json_decode($response, true);

if ($httpCode < 200 || $httpCode >= 300) {

    error_log(
        'Meta token exchange failed. HTTP ' .
        $httpCode .
        '. Response: ' .
        $response
    );

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => 'Meta token exchange failed'
    ]);

    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Authorization code successfully exchanged.'
]);