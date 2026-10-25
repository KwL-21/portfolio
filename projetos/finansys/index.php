<?php
require __DIR__ . '/includes/config.php';

redirecionar(usuario_id() ? 'dashboard.php' : 'login.php');
