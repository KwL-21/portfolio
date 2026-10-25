<?php
require __DIR__ . '/includes/config.php';

$uid = exigir_login();

const CATEGORIAS = [
    'receita' => ['Salário', 'Freelance', 'Investimentos', 'Outros'],
    'despesa' => ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'],
];

// Mês selecionado (formato AAAA-MM)
$mes = $_GET['mes'] ?? date('Y-m');
if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $mes)) {
    $mes = date('Y-m');
}
$inicio = "$mes-01";
$fim = date('Y-m-t', strtotime($inicio));

// ---------- Ações (POST) ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verificar_csrf();
    $acao = $_POST['acao'] ?? '';

    if ($acao === 'adicionar') {
        $descricao = trim($_POST['descricao'] ?? '');
        $valor = (float) str_replace(',', '.', $_POST['valor'] ?? '0');
        $tipo = $_POST['tipo'] ?? '';
        $categoria = $_POST['categoria'] ?? '';
        $data = $_POST['data'] ?? '';

        $valido = $descricao !== ''
            && $valor > 0
            && isset(CATEGORIAS[$tipo])
            && in_array($categoria, CATEGORIAS[$tipo], true)
            && DateTime::createFromFormat('Y-m-d', $data) !== false;

        if ($valido) {
            $stmt = db()->prepare(
                'INSERT INTO transacoes (usuario_id, descricao, valor, tipo, categoria, data) VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$uid, mb_substr($descricao, 0, 150), $valor, $tipo, $categoria, $data]);
            flash('sucesso', 'Transação adicionada.');
            $mes = substr($data, 0, 7);
        } else {
            flash('erro', 'Preencha todos os campos corretamente.');
        }
    }

    if ($acao === 'excluir') {
        // O filtro por usuario_id impede excluir transações de outros usuários
        $stmt = db()->prepare('DELETE FROM transacoes WHERE id = ? AND usuario_id = ?');
        $stmt->execute([(int) ($_POST['id'] ?? 0), $uid]);
        flash('sucesso', 'Transação excluída.');
    }

    redirecionar('dashboard.php?mes=' . urlencode($mes));
}

// ---------- Consultas ----------
$stmt = db()->prepare(
    'SELECT * FROM transacoes WHERE usuario_id = ? AND data BETWEEN ? AND ? ORDER BY data DESC, id DESC'
);
$stmt->execute([$uid, $inicio, $fim]);
$transacoes = $stmt->fetchAll();

$receitas = 0.0;
$despesas = 0.0;
$porCategoria = [];
foreach ($transacoes as $t) {
    if ($t['tipo'] === 'receita') {
        $receitas += $t['valor'];
    } else {
        $despesas += $t['valor'];
        $porCategoria[$t['categoria']] = ($porCategoria[$t['categoria']] ?? 0) + $t['valor'];
    }
}
arsort($porCategoria);
$saldo = $receitas - $despesas;

$mesAnterior = date('Y-m', strtotime("$inicio -1 month"));
$mesSeguinte = date('Y-m', strtotime("$inicio +1 month"));
$nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
$nomeMes = $nomesMeses[(int) substr($mes, 5, 2) - 1] . ' de ' . substr($mes, 0, 4);

$titulo = 'Painel';
require __DIR__ . '/includes/header.php';
?>
<header class="topbar">
    <div class="topbar__inner">
        <h1 class="logo">💰 FinanSys</h1>
        <div class="topbar__user">
            <span>Olá, <strong><?= e($_SESSION['usuario_nome']) ?></strong></span>
            <form method="post" action="logout.php">
                <?= csrf_campo() ?>
                <button class="btn btn--ghost btn--small">Sair</button>
            </form>
        </div>
    </div>
</header>

<main class="container">
    <?= mostrar_flash() ?>

    <nav class="month">
        <a href="?mes=<?= $mesAnterior ?>" class="month__arrow" aria-label="Mês anterior">‹</a>
        <h2><?= e($nomeMes) ?></h2>
        <a href="?mes=<?= $mesSeguinte ?>" class="month__arrow" aria-label="Próximo mês">›</a>
    </nav>

    <section class="cards">
        <div class="card card--receita">
            <span>Receitas</span>
            <strong><?= dinheiro($receitas) ?></strong>
        </div>
        <div class="card card--despesa">
            <span>Despesas</span>
            <strong><?= dinheiro($despesas) ?></strong>
        </div>
        <div class="card <?= $saldo >= 0 ? 'card--saldo' : 'card--negativo' ?>">
            <span>Saldo</span>
            <strong><?= dinheiro($saldo) ?></strong>
        </div>
    </section>

    <div class="grid">
        <section class="panel">
            <h3>Nova transação</h3>
            <form method="post" class="form" id="form-transacao">
                <?= csrf_campo() ?>
                <input type="hidden" name="acao" value="adicionar">
                <div class="tipo-toggle">
                    <label><input type="radio" name="tipo" value="despesa" checked> Despesa</label>
                    <label><input type="radio" name="tipo" value="receita"> Receita</label>
                </div>
                <label>Descrição
                    <input name="descricao" required maxlength="150" placeholder="Ex.: Mercado">
                </label>
                <div class="form__row">
                    <label>Valor (R$)
                        <input type="number" name="valor" step="0.01" min="0.01" required placeholder="0,00">
                    </label>
                    <label>Data
                        <input type="date" name="data" value="<?= date('Y-m-d') ?>" required>
                    </label>
                </div>
                <label>Categoria
                    <select name="categoria" id="categoria"></select>
                </label>
                <button class="btn btn--full">Adicionar</button>
            </form>

            <?php if ($porCategoria): ?>
                <h3 class="panel__subtitle">Despesas por categoria</h3>
                <ul class="bars">
                    <?php foreach ($porCategoria as $cat => $total): ?>
                        <li>
                            <div class="bars__label"><span><?= e($cat) ?></span><span><?= dinheiro($total) ?></span></div>
                            <div class="bars__track"><div class="bars__fill" style="width: <?= round($total / $despesas * 100) ?>%"></div></div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>

        <section class="panel">
            <h3>Transações do mês</h3>
            <?php if (!$transacoes): ?>
                <p class="empty">Nenhuma transação neste mês. Que tal adicionar a primeira?</p>
            <?php else: ?>
                <ul class="list">
                    <?php foreach ($transacoes as $t): ?>
                        <li class="list__item">
                            <div>
                                <strong><?= e($t['descricao']) ?></strong>
                                <small><?= e($t['categoria']) ?> · <?= date('d/m', strtotime($t['data'])) ?></small>
                            </div>
                            <div class="list__right">
                                <span class="valor valor--<?= e($t['tipo']) ?>">
                                    <?= $t['tipo'] === 'despesa' ? '−' : '+' ?> <?= dinheiro((float) $t['valor']) ?>
                                </span>
                                <form method="post" onsubmit="return confirm('Excluir esta transação?')">
                                    <?= csrf_campo() ?>
                                    <input type="hidden" name="acao" value="excluir">
                                    <input type="hidden" name="id" value="<?= (int) $t['id'] ?>">
                                    <button class="icon-btn" aria-label="Excluir">✕</button>
                                </form>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>
    </div>
</main>

<script>
    // Troca as categorias de acordo com o tipo escolhido
    const categorias = <?= json_encode(CATEGORIAS, JSON_UNESCAPED_UNICODE) ?>;
    const select = document.getElementById('categoria');
    const radios = document.querySelectorAll('input[name="tipo"]');

    function atualizarCategorias() {
        const tipo = document.querySelector('input[name="tipo"]:checked').value;
        select.replaceChildren(...categorias[tipo].map((c) => new Option(c, c)));
    }
    radios.forEach((r) => r.addEventListener('change', atualizarCategorias));
    atualizarCategorias();
</script>
</body>
</html>
