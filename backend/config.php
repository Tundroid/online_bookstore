<?php
// backend/config.php

// Session Configuration
ini_set('session.cookie_lifetime', 3600); // 1 hour
ini_set('session.gc_maxlifetime', 3600);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
ini_set('session.cookie_samesite', 'Lax');

$host = '172.19.128.1';
$db_name = 'bookstore_db';
$username = 'ictu_student'; // Change if necessary
$password = 'ictu_student';     // Change if necessary

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Set default fetch mode to associative array
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    print_r($e);
    die("Could not connect to the database $db_name :" . $e->getMessage());
}
?>
