# 🔗 API de Links

API REST para encurtar URLs, feita com **PHP 8 + MySQL**, sem frameworks.

## Funcionalidades

- Criar links curtos com código aleatório ou alias personalizado
- Redirecionamento com contagem de cliques
- Estatísticas de cliques dos últimos 7 dias
- Listagem paginada e exclusão de links
- Respostas em JSON com códigos HTTP corretos (200, 201, 204, 404, 405, 409, 422)
- Página com documentação e demo interativa que consome a própria API

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/links` | Cria um link (`{"url": "...", "alias": "opcional"}`) |
| `GET` | `/api/links?pagina=1&limite=10` | Lista os links |
| `GET` | `/api/links/{codigo}` | Detalhes e cliques por dia |
| `DELETE` | `/api/links/{codigo}` | Remove um link |
| `GET` | `/r/{codigo}` | Redireciona para a URL original |

## Como rodar

1. Inicie o Apache e o MySQL no Laragon.
2. Acesse `http://localhost/portfolio/projetos/linkapi/`.
3. O banco `linkapi` é criado automaticamente no primeiro acesso (script em `database.sql`).

As URLs amigáveis (`/api/links`, `/r/codigo`) usam o `.htaccess` (mod_rewrite do Apache).
Em servidores sem mod_rewrite, defina `URL_AMIGAVEL = false` em `config.php`: a API
passa a responder em `/api/index.php/links` e os links curtos em `/r.php?c=codigo`.

## Estrutura

```
linkapi/
├── api/index.php     # roteador e endpoints da API
├── assets/           # CSS e JS da página de demo
├── .htaccess         # URLs amigáveis
├── config.php        # conexão com o banco e funções auxiliares
├── database.sql
├── index.php         # documentação + demo
└── r.php             # redirecionamento e registro de cliques
```
