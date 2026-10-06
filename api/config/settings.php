<?php
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    die("Error: config.php not found.");
}
require_once $configFile;
?>
