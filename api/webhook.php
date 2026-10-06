<?php

$verify_token = "NATURA_HOUSE_VERIFY_2026";

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $mode = $_GET['hub_mode'] ?? '';
    $token = $_GET['hub_verify_token'] ?? '';
    $challenge = $_GET['hub_challenge'] ?? '';

    if ($mode === 'subscribe' && $token === $verify_token) {
        echo $challenge;
        exit;
    }

    http_response_code(403);
    echo "Verification failed";
    exit;
}

http_response_code(200);
echo "OK";