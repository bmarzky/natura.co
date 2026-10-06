<?php
require_once __DIR__ . '/../core/whatsapp_api.php';

function prosesPesanMasuk($senderPhone, $messageId, $messageText) {
    // 1. Tampilkan status "sedang mengetik..."
    kirimStatusTypingWhatsApp($messageId);
    
    // 2. Beri jeda agar natural
    sleep(2);

    // 3. Tentukan Balasan Bot (Intent Parsing)
    $text = strtolower($messageText);
    
    if (strpos($text, 'halo') !== false || strpos($text, 'hai') !== false) {
        $replyText = "Halo! Selamat datang di Natura House. Ada yang bisa kami bantu hari ini?";
    } elseif (strpos($text, 'harga') !== false) {
        $replyText = "Untuk informasi harga dan pemesanan, silakan kunjungi keranjang/katalog di profil kami ya!";
    } elseif (strpos($text, 'pesan') !== false || strpos($text, 'beli') !== false) {
        $replyText = "Terima kasih! Untuk pemesanan, silakan klik ikon Toko di pojok kanan atas chat ini dan masukkan kue ke keranjang Anda.";
    } elseif (strpos($text, 'alamat') !== false || strpos($text, 'lokasi') !== false) {
        $replyText = "Toko fisik Natura House berlokasi di Dusun Teratai, Desa Geulanggang Baro. Kami tunggu kedatangannya!";
    } else {
        $replyText = "Halo! Ini adalah balasan otomatis Natura House. Pesan Anda: " . $messageText;
    }

    // 4. Kirim Balasan
    kirimBalasanWhatsApp($senderPhone, $replyText);
}
?>
