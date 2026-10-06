<?php
// Mencegah kode rahasia terekspos, kita mewajibkan file config.php
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    die("Error: File config.php tidak ditemukan di folder api/config/. Silakan buat file tersebut secara manual di cPanel.");
}
require_once $configFile;
?>
