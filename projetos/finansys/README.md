# 💰 FinanSys

Controle financeiro pessoal feito com **PHP 8 + MySQL**.

## Funcionalidades

- Cadastro e login de usuários (senhas com `password_hash`)
- Cadastro e exclusão de receitas e despesas
- Resumo mensal: receitas, despesas e saldo
- Navegação entre meses
- Gráfico de despesas por categoria
- Proteção contra SQL Injection (PDO + prepared statements), XSS (`htmlspecialchars`) e CSRF (token por sessão)

## Como rodar

1. Inicie o Apache e o MySQL no Laragon.
2. Acesse `http://localhost/portfolio/projetos/finansys/`.
3. O banco `finansys` e as tabelas são criados automaticamente no primeiro acesso
   (o script está em `database.sql`). Configure usuário/senha do banco em `includes/config.php`.

## Conta de demonstração (ambiente local)

- E-mail: `demo@finansys.test`
- Senha: `demo1234`

## Estrutura

```
finansys/
├── assets/style.css
├── includes/
│   ├── config.php     # conexão, sessão, CSRF e funções auxiliares
│   └── header.php
├── database.sql
├── index.php          # redireciona para login ou painel
├── login.php
├── registrar.php
├── logout.php
└── dashboard.php      # painel com resumo e transações
```
