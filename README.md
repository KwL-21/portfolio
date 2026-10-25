# Portfólio — Kawã Lucio (DEV-KwL)

Site pessoal e projetos de demonstração de **Kawã Lucio**, desenvolvedor full stack em Duque de Caxias/RJ.

🌐 **Site:** https://kwl-21.github.io/portfolio/

## Projetos

| Projeto | Descrição | Tecnologias |
|---|---|---|
| [📋 TaskFlow](projetos/taskflow) | Quadro Kanban com arrastar e soltar, prioridades, prazos e busca | HTML, CSS, JavaScript, LocalStorage |
| [⛅ Clima Agora](projetos/clima) | Previsão do tempo com busca de cidades e geolocalização | JavaScript, Fetch API, Open-Meteo |
| [🛒 ShopLite](projetos/shoplite) | Loja virtual com filtros, carrinho, cupons e frete pelo CEP | JavaScript, ViaCEP |
| [💰 FinanSys](projetos/finansys) | Controle financeiro com login, receitas, despesas e resumo mensal | PHP 8, MySQL, PDO |
| [🔗 API de Links](projetos/linkapi) | API REST para encurtar URLs, com contagem de cliques e estatísticas | PHP 8, MySQL, REST, JSON |

Os projetos de front-end rodam direto no navegador (e no GitHub Pages).
Os projetos em PHP precisam de um servidor com PHP 8.1+ e MySQL.

## Como rodar localmente

Com o [Laragon](https://laragon.org/) (ou outro ambiente Apache + PHP + MySQL):

1. Clone o repositório dentro da pasta `www` do Laragon:
   ```bash
   git clone https://github.com/KwL-21/portfolio.git
   ```
2. Inicie o Apache e o MySQL.
3. Acesse `http://localhost/portfolio/`.

Os bancos de dados dos projetos PHP são criados automaticamente no primeiro acesso.
Usuário e senha do MySQL ficam no `config.php` de cada projeto (padrão do Laragon: `root` sem senha).

## Estrutura

```
├── index.html          # página do portfólio
├── assets/             # CSS, JS e currículo do portfólio
└── projetos/
    ├── taskflow/
    ├── clima/
    ├── shoplite/
    ├── finansys/
    └── linkapi/
```

## Contato

- E-mail: contatodevkwl@gmail.com
- GitHub: [KwL-21](https://github.com/KwL-21)
