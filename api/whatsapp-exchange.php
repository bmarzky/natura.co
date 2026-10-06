<?php

header('Content-Type: application/json; charset=utf-8');


/*
|--------------------------------------------------------------------------
| Only allow POST
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Read JSON input
|--------------------------------------------------------------------------
*/

$rawInput =
    file_get_contents('php://input');

$input =
    json_decode($rawInput, true);


if (!is_array($input)) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON request'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Authorization code
|--------------------------------------------------------------------------
*/

$code =
    $input['code'] ?? '';


if ($code === '') {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => 'Authorization code is required'
    ]);

    exit;
}



/*
|--------------------------------------------------------------------------
| Load Meta configuration
|--------------------------------------------------------------------------
|
| File location:
| /home/naturash/meta_config.php
|
| This file must remain outside public_html.
|
*/

$config =
    require '/home/naturash/meta_config.php';


$appId =
    $config['meta_app_id']
    ?? '';

$appSecret =
    $config['meta_app_secret']
    ?? '';


if (
    $appId === '' ||
    $appSecret === ''
) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => 'Meta configuration is incomplete'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Meta OAuth endpoint
|--------------------------------------------------------------------------
*/

$url =
    'https://graph.facebook.com/v25.0/oauth/access_token';


$data = [

    'client_id' =>
        $appId,

    'client_secret' =>
        $appSecret,

    'code' =>
        $code,

    'grant_type' =>
        'authorization_code'
];


/*
|--------------------------------------------------------------------------
| Server-to-server request to Meta
|--------------------------------------------------------------------------
*/

$ch =
    curl_init($url);


curl_setopt_array(
    $ch,
    [

        CURLOPT_POST =>
            true,

        CURLOPT_POSTFIELDS =>
            http_build_query($data),

        CURLOPT_RETURNTRANSFER =>
            true,

        CURLOPT_TIMEOUT =>
            30
    ]
);


$response =
    curl_exec($ch);


$httpCode =
    curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );


$curlError =
    curl_error($ch);


curl_close($ch);


/*
|--------------------------------------------------------------------------
| cURL error
|--------------------------------------------------------------------------
*/

if ($response === false) {

    error_log(
        'Meta token exchange cURL error: ' .
        $curlError
    );

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => 'Unable to connect to Meta'
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Decode Meta response
|--------------------------------------------------------------------------
*/

$result =
    json_decode(
        $response,
        true
    );


/*
|--------------------------------------------------------------------------
| Meta returned an error
|--------------------------------------------------------------------------
*/

if (
    $httpCode < 200 ||
    $httpCode >= 300
) {

    error_log(
        'Meta token exchange failed. HTTP ' .
        $httpCode .
        '. Response: ' .
        $response
    );

    http_response_code(500);

    echo json_encode([

        'success' =>
            false,

        'error' =>
            'Meta token exchange failed',

        'meta_http_code' =>
            $httpCode,

        'meta_response' =>
            $result
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| Success
|--------------------------------------------------------------------------
|
| IMPORTANT:
| For now we do not store or expose the access token.
| We only verify that Meta accepted the exchange.
|
*/

echo json_encode([

    'success' =>
        true,

    'message' =>
        'Authorization code successfully exchanged.'
]);