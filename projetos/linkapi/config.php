<?php
declare(strict_types=1);

// Configuração do banco (padrão do Laragon: root sem senha)
const DB_HOST = '127.0.0.1';
const DB_NAME = 'linkapi';
const DB_USER = 'root';
const DB_PASS = '';

// true = links curtos no formato /r/codigo (precisa do .htaccess / mod_rewrite)
// false = links no formato /r.php?c=codigo
const URL_AMIGAVEL = true;

const PALAVRAS_RESERVADAS = ['api', 'r', 'assets', 'admin', 'index'];

// PHP e MySQL no mesmo fuso, para as estatísticas por dia baterem
date_default_timezone_set('America/Sao_Paulo');

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
            throw $e;
        }
        $pdo = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASS, $opcoes);
        $pdo->exec('CREATE DATABASE ' . DB_NAME . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $pdo->exec('USE ' . DB_NAME);
        foreach (array_filter(array_map('trim', explode(';', file_get_contents(__DIR__ . '/database.sql')))) as $sql) {
            $pdo->exec($sql);
        }
    }

    $pdo->exec("SET time_zone = '" . date('P') . "'");

    return $pdo;
}

// URL base do projeto, ex.: http://localhost/projeto/projetos/linkapi
function url_base(): string
{
    $protocolo = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $raiz = rtrim(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '/');
    $pasta = str_replace('\\', '/', __DIR__);
    $caminho = stripos($pasta, $raiz) === 0 ? substr($pasta, strlen($raiz)) : '';
    return $protocolo . '://' . $_SERVER['HTTP_HOST'] . $caminho;
}

function url_curta(string $codigo): string
{
    return url_base() . (URL_AMIGAVEL ? '/r/' : '/r.php?c=') . rawurlencode($codigo);
}
