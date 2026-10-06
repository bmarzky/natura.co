<?php
require_once __DIR__ . '/config/settings.php';
require_once __DIR__ . '/core/logger.php';
require_once __DIR__ . '/handlers/intent_parser.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = $_GET['hub_mode'] ?? '';
    $token = $_GET['hub_verify_token'] ?? '';
    $challenge = $_GET['hub_challenge'] ?? '';

    if ($mode === 'subscribe' && $token === $verifyToken) {
        http_response_code(200);
        echo $challenge;
        exit;
    }
    
    http_response_code(403);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    logWebhook($input);
    
    http_response_code(200);
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }

    $data = json_decode($input, true);

    if (isset($data['object']) && $data['object'] === 'whatsapp_business_account') {
        foreach ($data['entry'] as $entry) {
            foreach ($entry['changes'] as $change) {
                if (isset($change['value']['messages'])) {
                    $message = $change['value']['messages'][0];
                    $senderPhone = $message['from']; 
                    $messageId = $message['id']; 
                    $messageText = $message['text']['body'] ?? ''; 

                    prosesPesanMasuk($senderPhone, $messageId, $messageText);
                }
            }
        }
    }
    exit;
}

http_response_code(404);
?>
