<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
    $pdo->exec('CREATE DATABASE IF NOT EXISTS srm_rh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    echo "MySQL Database srm_rh created or already exists.\n";
} catch (PDOException $e) {
    echo "MySQL Connection Error: " . $e->getMessage() . "\n";
}
