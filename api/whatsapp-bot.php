<?php
// ==========================================
// PENGATURAN CHATBOT WHATSAPP NATURA HOUSE
// ==========================================

// 1. Masukkan Access Token yang Anda dapatkan setelah klik "Generate token"
$accessToken = 'EAAXSP4fgN0ABSoWPlOEiEzYLm7Cxz1kga4Xnme1OnccyK83SZCtjEi8YFgZAS65TczC12Y7nPZCrRwyZCnDj1GgdezciC9lXM1gRyy0rwSPa4wMlgDPb3tED6b9asjnmfbFUrkQZAMaoQdKrmZAk1z5N3c4mVFH2Kg8ddGZCu1on02J2FFwCbrn5MHF83vzvxFb4iUxVOWVtyGda2Lh2Kw0fnszZBzwDZBzqHZCLjzAzNN62Y1Sm1MKRVyIsD3ZAIwtKbnpr2m3gmJ2QyJSxmZAVr4nsjz6G';

// 2. Phone Number ID Anda (sudah saya masukkan berdasarkan foto)
$phoneNumberId = '1394926080368074';

// 3. Buat password rahasia untuk verifikasi Webhook (Anda akan masukkan ini di dashboard Meta nanti)
$verifyToken = 'natura_house_secret_token';


// ==========================================
// LOGIKA 1: VERIFIKASI WEBHOOK DARI META
// ==========================================
// Saat Anda mendaftarkan URL bot ini di Meta, Meta akan mengirimkan permintaan GET untuk memastikan URL ini valid.
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = $_GET['hub_mode'] ?? '';
    $token = $_GET['hub_verify_token'] ?? '';
    $challenge = $_GET['hub_challenge'] ?? '';

    if ($mode === 'subscribe' && $token === $verifyToken) {
        http_response_code(200);
        echo $challenge; // Wajib mengembalikan challenge dari Meta
        exit;
    } else {
        http_response_code(403);
        exit;
    }
}


// ==========================================
// LOGIKA 2: MENERIMA & MEMBALAS PESAN MASUK
// ==========================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Ambil isi pesan masuk (format JSON)
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Cek apakah ini benar-benar pesan WhatsApp
    if (isset($data['object']) && $data['object'] === 'whatsapp_business_account') {
        foreach ($data['entry'] as $entry) {
            foreach ($entry['changes'] as $change) {
                if (isset($change['value']['messages'])) {
                    $message = $change['value']['messages'][0];
                    $senderPhone = $message['from']; // Nomor pengirim
                    $messageText = strtolower($message['text']['body'] ?? ''); // Isi teks pengirim

                    // Tentukan Balasan Bot
                    $replyText = "Halo! Ini adalah balasan otomatis dari Natura House. Pesan Anda: " . $messageText;

                    if (strpos($messageText, 'halo') !== false) {
                        $replyText = "Halo! Selamat datang di Natura House. Ada yang bisa kami bantu?";
                    } elseif (strpos($messageText, 'harga') !== false) {
                        $replyText = "Untuk informasi harga, silakan kunjungi katalog di website kami ya!";
                    }

                    // Kirim Balasan (Send Message API)
                    kirimBalasanWhatsApp($senderPhone, $replyText, $phoneNumberId, $accessToken);
                }
            }
        }
        http_response_code(200);
        exit;
    }
    http_response_code(404);
}

// ==========================================
// FUNGSI UNTUK MENGIRIM PESAN
// ==========================================
function kirimBalasanWhatsApp($to, $text, $phoneNumberId, $accessToken) {
    $url = "https://graph.facebook.com/v26.0/" . $phoneNumberId . "/messages";

    $data = [
        'messaging_product' => 'whatsapp',
        'recipient_type' => 'individual',
        'to' => $to,
        'type' => 'text',
        'text' => [
            'preview_url' => false,
            'body' => $text
        ]
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
    
    // Log response untuk debugging
    error_log("WhatsApp Reply Response: " . $response);
}
?>
