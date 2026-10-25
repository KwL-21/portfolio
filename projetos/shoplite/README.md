# 🛒 ShopLite

Loja virtual de demonstração feita com **JavaScript puro**.

## Funcionalidades

- Catálogo com 18 produtos em 5 categorias
- Filtros por categoria, preço máximo e promoções
- Busca em tempo real e 5 opções de ordenação
- Carrinho lateral com controle de quantidade, salvo no navegador
- Cupons de desconto (`BEMVINDO10` = 10%, `DEV20` = 20%)
- Frete calculado pelo CEP, usando a API [ViaCEP](https://viacep.com.br/) para descobrir o estado
- Frete grátis acima de R$ 299
- Finalização de pedido simulada (nenhuma cobrança é feita)

## Conceitos praticados

Gerenciamento de estado no front-end, filtros e ordenação de listas, `Intl.NumberFormat` para moeda, consumo de API, máscara de CEP e LocalStorage.

## Como rodar

Abra o `index.html` no navegador. Os produtos ficam em `produtos.js`.
