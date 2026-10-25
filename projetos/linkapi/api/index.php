<?php
declare(strict_types=1);

require __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

function responder(int $status, mixed $dados = null): never
{
    http_response_code($status);
    if ($dados !== null) {
        echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    }
    exit;
}

function erro(int $status, string $mensagem): never
{
    responder($status, ['erro' => $mensagem]);
}

// Aceita corpo em JSON ou em formulário
function corpo(): array
{
    if (str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
        $dados = json_decode(file_get_contents('php://input'), true);
        if (!is_array($dados)) {
            erro(400, 'JSON inválido.');
        }
        return $dados;
    }
    return $_POST;
}

function formatar_link(array $link): array
{
    return [
        'codigo' => $link['codigo'],
        'url' => $link['url'],
        'url_curta' => url_curta($link['codigo']),
        'cliques' => (int) $link['cliques'],
        'criado_em' => date(DATE_ATOM, strtotime($link['criado_em'])),
    ];
}

function buscar_link(string $codigo): array
{
    $stmt = db()->prepare('SELECT * FROM links WHERE codigo = ?');
    $stmt->execute([$codigo]);
    return $stmt->fetch() ?: erro(404, 'Link não encontrado.');
}

function gerar_codigo(int $tamanho = 6): string
{
    $caracteres = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $codigo = '';
    for ($i = 0; $i < $tamanho; $i++) {
        $codigo .= $caracteres[random_int(0, strlen($caracteres) - 1)];
    }
    return $codigo;
}

// ---------- Endpoints ----------

// GET /links?pagina=1&limite=10
function listar(): never
{
    $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
    $limite = min(100, max(1, (int) ($_GET['limite'] ?? 10)));
    $offset = ($pagina - 1) * $limite;

    $total = (int) db()->query('SELECT COUNT(*) FROM links')->fetchColumn();
    $stmt = db()->prepare('SELECT * FROM links ORDER BY id DESC LIMIT ? OFFSET ?');
    $stmt->execute([$limite, $offset]);

    responder(200, [
        'dados' => array_map('formatar_link', $stmt->fetchAll()),
        'paginacao' => [
            'pagina' => $pagina,
            'limite' => $limite,
            'total' => $total,
            'paginas' => (int) ceil($total / $limite),
        ],
    ]);
}

// POST /links  { "url": "...", "alias": "opcional" }
function criar(): never
{
    $dados = corpo();
    $url = trim((string) ($dados['url'] ?? ''));
    $alias = trim((string) ($dados['alias'] ?? ''));

    $esquema = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    if (!filter_var($url, FILTER_VALIDATE_URL) || !in_array($esquema, ['http', 'https'], true)) {
        erro(422, 'Informe uma URL válida começando com http:// ou https://.');
    }
    if (strlen($url) > 2048) {
        erro(422, 'A URL deve ter no máximo 2048 caracteres.');
    }

    if ($alias !== '') {
        if (!preg_match('/^[A-Za-z0-9_-]{3,30}$/', $alias)) {
            erro(422, 'O alias deve ter de 3 a 30 caracteres: letras, números, "-" ou "_".');
        }
        if (in_array(strtolower($alias), PALAVRAS_RESERVADAS, true)) {
            erro(422, 'Este alias é reservado.');
        }
    }

    $stmt = db()->prepare('INSERT INTO links (codigo, url) VALUES (?, ?)');
    // Tenta algumas vezes caso o código aleatório já exista
    for ($tentativa = 0; $tentativa < 5; $tentativa++) {
        $codigo = $alias !== '' ? $alias : gerar_codigo();
        try {
            $stmt->execute([$codigo, $url]);
            responder(201, formatar_link(buscar_link($codigo)));
        } catch (PDOException $e) {
            // 1062 = valor duplicado (código já existe)
            if (($e->errorInfo[1] ?? null) !== 1062) {
                throw $e;
            }
            if ($alias !== '') {
                erro(409, 'Este alias já está em uso.');
            }
        }
    }
    erro(500, 'Não foi possível gerar um código. Tente novamente.');
}

// GET /links/{codigo}  — detalhes e cliques dos últimos 7 dias
function detalhar(string $codigo): never
{
    $link = buscar_link($codigo);

    $stmt = db()->prepare(
        'SELECT DATE(criado_em) AS dia, COUNT(*) AS total
         FROM cliques
         WHERE link_id = ? AND criado_em >= CURDATE() - INTERVAL 6 DAY
         GROUP BY dia'
    );
    $stmt->execute([$link['id']]);
    $porDia = array_column($stmt->fetchAll(), 'total', 'dia');

    $ultimos7 = [];
    for ($i = 6; $i >= 0; $i--) {
        $dia = date('Y-m-d', strtotime("-$i days"));
        $ultimos7[] = ['dia' => $dia, 'cliques' => (int) ($porDia[$dia] ?? 0)];
    }

    responder(200, formatar_link($link) + ['cliques_por_dia' => $ultimos7]);
}

// DELETE /links/{codigo}
function excluir(string $codigo): never
{
    $link = buscar_link($codigo);
    db()->prepare('DELETE FROM links WHERE id = ?')->execute([$link['id']]);
    responder(204);
}

// ---------- Roteamento ----------
// Funciona com /api/links/abc (via .htaccess) e /api/index.php/links/abc
$caminho = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$rota = substr($caminho, strlen($base));
$rota = preg_replace('#^/index\.php#', '', $rota);
$rota = trim($rota, '/');
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'OPTIONS') {
    responder(204);
}

try {
    if ($rota === 'links') {
        match ($metodo) {
            'GET' => listar(),
            'POST' => criar(),
            default => erro(405, 'Método não permitido.'),
        };
    }

    if (preg_match('#^links/([A-Za-z0-9_-]+)$#', $rota, $m)) {
        match ($metodo) {
            'GET' => detalhar($m[1]),
            'DELETE' => excluir($m[1]),
            default => erro(405, 'Método não permitido.'),
        };
    }

    erro(404, 'Rota não encontrada.');
} catch (PDOException $e) {
    erro(500, 'Erro no banco de dados. Verifique se o MySQL está rodando.');
}
