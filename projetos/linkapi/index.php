<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$base = url_base();
$api = $base . (URL_AMIGAVEL ? '/api/links' : '/api/index.php/links');
$h = fn(string $texto): string => htmlspecialchars($texto, ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API de Links — Encurtador de URLs</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <header class="topbar">
        <div class="container topbar__inner">
            <a href="../../#projetos" class="back">← Portfólio</a>
            <span class="logo">🔗 API de Links</span>
            <nav><a href="#demo">Demo</a><a href="#docs">Documentação</a></nav>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <h1>Encurte links com uma <span>API REST</span></h1>
            <p>API em PHP + MySQL para criar links curtos, contar cliques e consultar estatísticas. Respostas em JSON.</p>
        </div>
    </section>

    <main class="container">
        <!-- DEMO -->
        <section id="demo" class="section">
            <h2 class="section__title">Experimente</h2>
            <form class="shorten" id="form">
                <input type="url" name="url" placeholder="Cole uma URL longa, ex.: https://github.com/..." required aria-label="URL">
                <input name="alias" placeholder="alias (opcional)" pattern="[A-Za-z0-9_\-]{3,30}" title="3 a 30 caracteres: letras, números, - ou _" aria-label="Alias personalizado">
                <button class="btn">Encurtar</button>
            </form>
            <p class="msg" id="msg" role="status"></p>

            <div class="result" id="resultado" hidden>
                <a id="curta" target="_blank" rel="noopener"></a>
                <button class="btn btn--small" id="copiar">Copiar</button>
            </div>

            <div class="links-header">
                <h3>Links recentes</h3>
                <button class="btn btn--ghost btn--small" id="atualizar">↻ Atualizar</button>
            </div>
            <div class="links" id="links"></div>
            <div class="pager" id="paginacao"></div>
        </section>

        <!-- DOCUMENTAÇÃO -->
        <section id="docs" class="section">
            <h2 class="section__title">Documentação</h2>
            <p class="lead">URL base: <code><?= $h($api) ?></code></p>
            <p class="lead">Todas as respostas são em JSON. Erros retornam <code>{"erro": "mensagem"}</code> com o código HTTP correspondente.</p>

            <article class="endpoint">
                <header><span class="method method--post">POST</span><code>/links</code><span class="desc">Cria um link curto</span></header>
                <div class="endpoint__body">
                    <h4>Corpo (JSON)</h4>
                    <table>
                        <tr><td><code>url</code></td><td>string</td><td>obrigatório — URL http(s) de até 2048 caracteres</td></tr>
                        <tr><td><code>alias</code></td><td>string</td><td>opcional — 3 a 30 caracteres (letras, números, <code>-</code>, <code>_</code>)</td></tr>
                    </table>
                    <h4>Exemplo</h4>
<pre><code>curl -X POST <?= $h($api) ?> \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "alias": "meu-github"}'</code></pre>
                    <h4>Resposta <span class="status status--ok">201 Created</span></h4>
<pre><code>{
  "codigo": "meu-github",
  "url": "https://github.com",
  "url_curta": "<?= $h(url_curta('meu-github')) ?>",
  "cliques": 0,
  "criado_em": "2026-10-25T10:30:00-03:00"
}</code></pre>
                    <p class="codes">Erros: <span class="status">422</span> URL ou alias inválido · <span class="status">409</span> alias já em uso</p>
                </div>
            </article>

            <article class="endpoint">
                <header><span class="method method--get">GET</span><code>/links</code><span class="desc">Lista os links (paginado)</span></header>
                <div class="endpoint__body">
                    <h4>Parâmetros de consulta</h4>
                    <table>
                        <tr><td><code>pagina</code></td><td>int</td><td>padrão 1</td></tr>
                        <tr><td><code>limite</code></td><td>int</td><td>padrão 10, máximo 100</td></tr>
                    </table>
<pre><code>curl "<?= $h($api) ?>?pagina=1&amp;limite=5"</code></pre>
                    <h4>Resposta <span class="status status--ok">200 OK</span></h4>
<pre><code>{
  "dados": [ { "codigo": "...", "url": "...", "url_curta": "...", "cliques": 3, "criado_em": "..." } ],
  "paginacao": { "pagina": 1, "limite": 5, "total": 12, "paginas": 3 }
}</code></pre>
                </div>
            </article>

            <article class="endpoint">
                <header><span class="method method--get">GET</span><code>/links/{codigo}</code><span class="desc">Detalhes e cliques dos últimos 7 dias</span></header>
                <div class="endpoint__body">
<pre><code>curl <?= $h($api) ?>/meu-github</code></pre>
                    <h4>Resposta <span class="status status--ok">200 OK</span></h4>
<pre><code>{
  "codigo": "meu-github",
  "url": "https://github.com",
  "url_curta": "...",
  "cliques": 5,
  "criado_em": "...",
  "cliques_por_dia": [ { "dia": "2026-10-19", "cliques": 0 }, ... ]
}</code></pre>
                    <p class="codes">Erros: <span class="status">404</span> link não encontrado</p>
                </div>
            </article>

            <article class="endpoint">
                <header><span class="method method--delete">DELETE</span><code>/links/{codigo}</code><span class="desc">Remove um link</span></header>
                <div class="endpoint__body">
<pre><code>curl -X DELETE <?= $h($api) ?>/meu-github</code></pre>
                    <h4>Resposta <span class="status status--ok">204 No Content</span></h4>
                    <p class="codes">Erros: <span class="status">404</span> link não encontrado</p>
                </div>
            </article>

            <article class="endpoint">
                <header><span class="method method--get">GET</span><code><?= URL_AMIGAVEL ? '/r/{codigo}' : '/r.php?c={codigo}' ?></code><span class="desc">Redireciona para a URL original</span></header>
                <div class="endpoint__body">
                    <p>Este é o link curto em si. Cada acesso registra um clique e responde <span class="status">302</span> para a URL original.</p>
                </div>
            </article>
        </section>
    </main>

    <footer class="footer">API de Links · PHP 8 + MySQL</footer>

    <script>const API = <?= json_encode($api, JSON_UNESCAPED_SLASHES) ?>;</script>
    <script src="assets/app.js"></script>
</body>
</html>
