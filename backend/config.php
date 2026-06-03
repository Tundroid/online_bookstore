<?php
// backend/config.php

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
