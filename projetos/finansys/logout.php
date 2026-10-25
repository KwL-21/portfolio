<?php
require __DIR__ . '/includes/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verificar_csrf();
    $_SESSION = [];
    session_destroy();
}

redirecionar('login.php');
