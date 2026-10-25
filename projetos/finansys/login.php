<?php
require __DIR__ . '/includes/config.php';

if (usuario_id()) {
    redirecionar('dashboard.php');
}

$erro = '';
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verificar_csrf();
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';

    $stmt = db()->prepare('SELECT id, nome, senha FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if ($usuario && password_verify($senha, $usuario['senha'])) {
        session_regenerate_id(true);
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        redirecionar('dashboard.php');
    }
    $erro = 'E-mail ou senha incorretos.';
}

$titulo = 'Entrar';
require __DIR__ . '/includes/header.php';
?>
<main class="auth">
    <form method="post" class="auth__card">
        <a href="../../#projetos" class="auth__back">← Portfólio</a>
        <h1 class="logo">💰 FinanSys</h1>
        <p class="auth__sub">Entre para controlar suas finanças</p>

        <?= mostrar_flash() ?>
        <?php if ($erro): ?><div class="alert alert--erro"><?= e($erro) ?></div><?php endif; ?>

        <?= csrf_campo() ?>
        <label>E-mail
            <input type="email" name="email" value="<?= e($email) ?>" required autofocus>
        </label>
        <label>Senha
            <input type="password" name="senha" required>
        </label>
        <button class="btn btn--full">Entrar</button>
        <p class="auth__alt">Não tem conta? <a href="registrar.php">Cadastre-se</a></p>
    </form>
</main>
</body>
</html>
