<?php
function logWebhook($data) {
    $logFile = __DIR__ . '/../webhook_log.txt';
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . $data . PHP_EOL, FILE_APPEND);
}
?>
