<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$codigo = (string) ($_GET['c'] ?? '');

$link = false;
if (preg_match('/^[A-Za-z0-9_-]{1,30}$/', $codigo)) {
    $stmt = db()->prepare('SELECT id, url FROM links WHERE codigo = ?');
    $stmt->execute([$codigo]);
    $link = $stmt->fetch();
}

if (!$link) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="pt-BR"><meta charset="UTF-8"><title>Link não encontrado</title>'
        . '<body style="font-family:system-ui;text-align:center;padding:80px 16px">'
        . '<h1>🔗 Link não encontrado</h1><p>Este link curto não existe ou foi removido.</p>'
        . '<a href="' . htmlspecialchars(url_base()) . '/">Criar um link</a></body></html>';
    exit;
}

// Registra o clique
db()->prepare('UPDATE links SET cliques = cliques + 1 WHERE id = ?')->execute([$link['id']]);
db()->prepare('INSERT INTO cliques (link_id, referer) VALUES (?, ?)')
    ->execute([$link['id'], mb_substr($_SERVER['HTTP_REFERER'] ?? '', 0, 255) ?: null]);

header('Cache-Control: no-store');
header('Location: ' . $link['url'], true, 302);
