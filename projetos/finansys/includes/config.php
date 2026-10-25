<?php
declare(strict_types=1);

// Configuração do banco (padrão do Laragon: root sem senha)
const DB_HOST = '127.0.0.1';
const DB_NAME = 'finansys';
const DB_USER = 'root';
const DB_PASS = '';

session_start();

function db(): PDO
{
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }

    $opcoes = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, $opcoes);
    } catch (PDOException $e) {
        // 1049 = banco não existe: cria o banco e as tabelas na primeira execução
        if ((int) $e->getCode() !== 1049) {
            http_response_code(500);
            exit('Não foi possível conectar ao MySQL. Verifique se ele está rodando no Laragon.');
        }
        $pdo = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASS, $opcoes);
        $pdo->exec('CREATE DATABASE ' . DB_NAME . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $pdo->exec('USE ' . DB_NAME);
        foreach (array_filter(array_map('trim', explode(';', file_get_contents(__DIR__ . '/../database.sql')))) as $sql) {
            $pdo->exec($sql);
        }
    }

    return $pdo;
}

// Escapa texto para exibir no HTML
function e(?string $texto): string
{
    return htmlspecialchars($texto ?? '', ENT_QUOTES, 'UTF-8');
}

function dinheiro(float $valor): string
{
    return 'R$ ' . number_format($valor, 2, ',', '.');
}

function redirecionar(string $url): never
{
    header("Location: $url");
    exit;
}

// ---------- Proteção CSRF ----------
function csrf_token(): string
{
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function csrf_campo(): string
{
    return '<input type="hidden" name="csrf" value="' . csrf_token() . '">';
}

function verificar_csrf(): void
{
    if (!hash_equals(csrf_token(), $_POST['csrf'] ?? '')) {
        http_response_code(400);
        exit('Requisição inválida.');
    }
}

// ---------- Autenticação ----------
function usuario_id(): ?int
{
    return $_SESSION['usuario_id'] ?? null;
}

function exigir_login(): int
{
    $id = usuario_id();
    if (!$id) {
        redirecionar('login.php');
    }
    return $id;
}

// ---------- Mensagens flash ----------
function flash(string $tipo, string $msg): void
{
    $_SESSION['flash'] = ['tipo' => $tipo, 'msg' => $msg];
}

function mostrar_flash(): string
{
    if (empty($_SESSION['flash'])) {
        return '';
    }
    ['tipo' => $tipo, 'msg' => $msg] = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return '<div class="alert alert--' . e($tipo) . '">' . e($msg) . '</div>';
}
