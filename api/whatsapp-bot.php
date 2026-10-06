<?php
// ==========================================
// PENGATURAN CHATBOT WHATSAPP NATURA HOUSE
// ==========================================

// 1. Masukkan Access Token yang Anda dapatkan setelah klik "Generate token"
$accessToken = 'EAAXSP4fgN0ABSh7iFNRiURlDcUCC8A6lQ6zdZBZA4VkJpbeDFmb0tCU12bNdDMSNrdvNQdWXZAaRTx7VM8B3U2uVZCGRrkb33GRQKQEP4rDC0npPxxtMEzT52jphqH8ZBKjHP6NlZBtBaja4zcYGafQPbyJobbik5e48DZAIPHmCLz99bHXWsl99pJLjnmGAzNmZCGRZAivhllQoMpnNdvalMkv00oNHERQFRrH22yZCxaKnWfZCQoZCN8LfaRX2zokKGWOPCqRTRYgKen6TXJsRUWCJHQVp';

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
    
    // Log semua input yang masuk untuk debugging
    file_put_contents('webhook_log.txt', date('[Y-m-d H:i:s] ') . $input . PHP_EOL, FILE_APPEND);
    
    $data = json_decode($input, true);

    // OPTIMASI: Langsung berikan respons HTTP 200 OK ke Facebook secepat mungkin
    // Ini mencegah delay dari server Facebook
    http_response_code(200);
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request(); // Menutup koneksi dengan Facebook agar mereka tidak menunggu
    }

    // Cek apakah ini benar-benar pesan WhatsApp
    if (isset($data['object']) && $data['object'] === 'whatsapp_business_account') {
        foreach ($data['entry'] as $entry) {
            foreach ($entry['changes'] as $change) {
                if (isset($change['value']['messages'])) {
                    $message = $change['value']['messages'][0];
                    $senderPhone = $message['from']; // Nomor pengirim
                    $messageId = $message['id']; // ID pesan (dibutuhkan untuk typing indicator)
                    $messageText = strtolower($message['text']['body'] ?? ''); // Isi teks pengirim

                    // 1. Ubah centang menjadi biru (Read) dan tampilkan status "sedang mengetik..."
                    kirimStatusTypingWhatsApp($messageId, $phoneNumberId, $accessToken);
                    
                    // 2. Beri jeda 2 detik agar terlihat natural seperti manusia yang sedang mengetik
                    sleep(2);

                    // 3. Tentukan Balasan Bot
                    $replyText = "Halo! Ini adalah balasan otomatis dari Natura House. Pesan Anda: " . $messageText;

                    if (strpos($messageText, 'halo') !== false) {
                        $replyText = "Halo! Selamat datang di Natura House. Ada yang bisa kami bantu?";
                    } elseif (strpos($messageText, 'harga') !== false) {
                        $replyText = "Untuk informasi harga, silakan kunjungi katalog di website kami ya!";
                    }

                    // 4. Kirim Balasan (Send Message API)
                    kirimBalasanWhatsApp($senderPhone, $replyText, $phoneNumberId, $accessToken);
                }
            }
        }
    }
    exit;
}

// ==========================================
// FUNGSI UNTUK MENGIRIM PESAN
// ==========================================
function kirimBalasanWhatsApp($to, $text, $phoneNumberId, $accessToken) {
    $url = "https://graph.facebook.com/v20.0/" . $phoneNumberId . "/messages";

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

// ==========================================
// FUNGSI UNTUK MENAMPILKAN "SEDANG MENGETIK..."
// ==========================================
function kirimStatusTypingWhatsApp($messageId, $phoneNumberId, $accessToken) {
    $url = "https://graph.facebook.com/v20.0/" . $phoneNumberId . "/messages";

    $data = [
        'messaging_product' => 'whatsapp',
        'status' => 'read',
        'message_id' => $messageId,
        'typing_indicator' => [
            'type' => 'text'
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
    curl_exec($ch);
    curl_close($ch);
}
?>
