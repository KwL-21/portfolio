<?php
require __DIR__ . '/includes/config.php';

if (usuario_id()) {
    redirecionar('dashboard.php');
}

$erros = [];
$nome = '';
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verificar_csrf();
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';
    $confirmar = $_POST['confirmar'] ?? '';

    if (mb_strlen($nome) < 2) {
        $erros[] = 'Informe seu nome.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erros[] = 'E-mail inválido.';
    }
    if (strlen($senha) < 6) {
        $erros[] = 'A senha deve ter pelo menos 6 caracteres.';
    }
    if ($senha !== $confirmar) {
        $erros[] = 'As senhas não conferem.';
    }

    if (!$erros) {
        $stmt = db()->prepare('SELECT 1 FROM usuarios WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $erros[] = 'Este e-mail já está cadastrado.';
        }
    }

    if (!$erros) {
        $stmt = db()->prepare('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)');
        $stmt->execute([$nome, $email, password_hash($senha, PASSWORD_DEFAULT)]);
        flash('sucesso', 'Conta criada! Agora é só entrar.');
        redirecionar('login.php');
    }
}

$titulo = 'Criar conta';
require __DIR__ . '/includes/header.php';
?>
<main class="auth">
    <form method="post" class="auth__card">
        <a href="login.php" class="auth__back">← Voltar</a>
        <h1 class="logo">💰 FinanSys</h1>
        <p class="auth__sub">Crie sua conta gratuita</p>

        <?php if ($erros): ?>
            <div class="alert alert--erro">
                <?php foreach ($erros as $erro): ?><div><?= e($erro) ?></div><?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?= csrf_campo() ?>
        <label>Nome
            <input name="nome" value="<?= e($nome) ?>" required maxlength="100" autofocus>
        </label>
        <label>E-mail
            <input type="email" name="email" value="<?= e($email) ?>" required maxlength="150">
        </label>
        <label>Senha
            <input type="password" name="senha" required minlength="6">
        </label>
        <label>Confirmar senha
            <input type="password" name="confirmar" required minlength="6">
        </label>
        <button class="btn btn--full">Criar conta</button>
        <p class="auth__alt">Já tem conta? <a href="login.php">Entrar</a></p>
    </form>
</main>
</body>
</html>
