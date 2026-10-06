<?php
function kirimBalasanWhatsApp($to, $text) {
    global $phoneNumberId, $accessToken;
    $url = "https://graph.facebook.com/v20.0/" . $phoneNumberId . "/messages";
    $data = [
        'messaging_product' => 'whatsapp',
        'recipient_type' => 'individual',
        'to' => $to,
        'type' => 'text',
        'text' => [ 'preview_url' => false, 'body' => $text ]
    ];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    error_log("WhatsApp Reply Response: " . $response);
}

function kirimStatusTypingWhatsApp($messageId) {
    global $phoneNumberId, $accessToken;
    $url = "https://graph.facebook.com/v20.0/" . $phoneNumberId . "/messages";
    $data = [
        'messaging_product' => 'whatsapp',
        'status' => 'read',
        'message_id' => $messageId,
        'typing_indicator' => [ 'type' => 'text' ]
    ];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}
?>
