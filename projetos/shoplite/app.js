const CARRINHO_KEY = "shoplite:carrinho";
const FRETE_GRATIS = 299;
// Frete por região (UF -> valor)
const FRETE_REGIAO = {
  sudeste: { ufs: ["SP", "RJ", "MG", "ES"], valor: 19.9, prazo: "3 a 5 dias úteis" },
  sul: { ufs: ["PR", "SC", "RS"], valor: 24.9, prazo: "4 a 6 dias úteis" },
  centroOeste: { ufs: ["DF", "GO", "MT", "MS"], valor: 29.9, prazo: "5 a 8 dias úteis" },
  nordeste: { ufs: ["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"], valor: 34.9, prazo: "6 a 10 dias úteis" },
  norte: { ufs: ["AM", "PA", "AC", "RO", "RR", "AP", "TO"], valor: 44.9, prazo: "8 a 14 dias úteis" },
};

const $ = (id) => document.getElementById(id);
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ---------- Estado ----------
const filtros = { busca: "", categoria: "Todas", precoMax: 600, promo: false, ordem: "relevancia" };
let carrinho = carregarCarrinho();
let cupom = null; // { codigo, desconto }
let frete = null; // { valor, prazo, local }

function carregarCarrinho() {
  try {
    const dados = JSON.parse(localStorage.getItem(CARRINHO_KEY));
    // Ignora itens de produtos que não existem mais
    if (Array.isArray(dados)) return dados.filter((i) => PRODUTOS.some((p) => p.id === i.id));
  } catch {}
  return [];
}

function salvarCarrinho() {
  try { localStorage.setItem(CARRINHO_KEY, JSON.stringify(carrinho)); } catch {}
}

const produtoPorId = (id) => PRODUTOS.find((p) => p.id === id);

// ---------- Catálogo ----------
function renderCategorias() {
  const categorias = ["Todas", ...new Set(PRODUTOS.map((p) => p.categoria))];
  $("categorias").replaceChildren(
    ...categorias.map((cat) => {
      const btn = document.createElement("button");
      btn.className = "chip" + (cat === filtros.categoria ? " is-active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        filtros.categoria = cat;
        renderCategorias();
        renderProdutos();
      });
      return btn;
    })
  );
}

function produtosFiltrados() {
  const termo = filtros.busca.toLowerCase();
  const lista = PRODUTOS.filter(
    (p) =>
      (filtros.categoria === "Todas" || p.categoria === filtros.categoria) &&
      p.preco <= filtros.precoMax &&
      (!filtros.promo || p.precoAntigo) &&
      (!termo || `${p.nome} ${p.categoria}`.toLowerCase().includes(termo))
  );

  const ordenacoes = {
    menor: (a, b) => a.preco - b.preco,
    maior: (a, b) => b.preco - a.preco,
    nota: (a, b) => b.nota - a.nota,
    nome: (a, b) => a.nome.localeCompare(b.nome, "pt-BR"),
  };
  return ordenacoes[filtros.ordem] ? lista.sort(ordenacoes[filtros.ordem]) : lista;
}

function estrelas(nota) {
  const cheias = Math.round(nota);
  return "★".repeat(cheias) + "☆".repeat(5 - cheias);
}

function criarCardProduto(p, i) {
  const card = document.createElement("article");
  card.className = "product";
  card.style.animationDelay = `${i * 30}ms`;

  const desconto = p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) : 0;
  card.innerHTML = `
    <div class="product__img" style="background: ${p.cor}1a">
      ${desconto ? `<span class="product__badge">-${desconto}%</span>` : ""}
      <span aria-hidden="true">${p.emoji}</span>
    </div>
    <div class="product__body">
      <p class="product__cat">${p.categoria}</p>
      <h3 class="product__name">${p.nome}</h3>
      <p class="product__rating" title="Nota ${p.nota}">${estrelas(p.nota)} <small>${p.nota.toFixed(1)}</small></p>
      <p class="product__price">
        <strong>${moeda.format(p.preco)}</strong>
        ${p.precoAntigo ? `<s>${moeda.format(p.precoAntigo)}</s>` : ""}
      </p>
      <button class="btn">Adicionar ao carrinho</button>
    </div>`;

  const btn = card.querySelector(".btn");
  btn.addEventListener("click", () => {
    adicionar(p.id);
    btn.textContent = "✓ Adicionado";
    btn.classList.add("is-added");
    setTimeout(() => {
      btn.textContent = "Adicionar ao carrinho";
      btn.classList.remove("is-added");
    }, 1200);
  });
  return card;
}

function renderProdutos() {
  const lista = produtosFiltrados();
  $("resultado").textContent = `${lista.length} ${lista.length === 1 ? "produto encontrado" : "produtos encontrados"}`;

  if (!lista.length) {
    $("produtos").innerHTML = `<p class="empty"><span>🔍</span>Nenhum produto encontrado com esses filtros.</p>`;
    return;
  }
  $("produtos").replaceChildren(...lista.map(criarCardProduto));
}

$("busca").addEventListener("input", (e) => {
  filtros.busca = e.target.value.trim();
  renderProdutos();
});
$("preco").addEventListener("input", (e) => {
  filtros.precoMax = Number(e.target.value);
  $("preco-label").textContent = moeda.format(filtros.precoMax).replace(",00", "");
  renderProdutos();
});
$("promo").addEventListener("change", (e) => {
  filtros.promo = e.target.checked;
  renderProdutos();
});
$("ordem").addEventListener("change", (e) => {
  filtros.ordem = e.target.value;
  renderProdutos();
});
$("limpar").addEventListener("click", () => {
  Object.assign(filtros, { busca: "", categoria: "Todas", precoMax: 600, promo: false, ordem: "relevancia" });
  $("busca").value = "";
  $("preco").value = 600;
  $("preco-label").textContent = "R$ 600";
  $("promo").checked = false;
  $("ordem").value = "relevancia";
  renderCategorias();
  renderProdutos();
});

// ---------- Carrinho ----------
function adicionar(id) {
  const item = carrinho.find((i) => i.id === id);
  if (item) item.qtd++;
  else carrinho.push({ id, qtd: 1 });
  salvarCarrinho();
  renderCarrinho();
  mostrarToast(`${produtoPorId(id).nome} adicionado ao carrinho`);

  const btn = $("abrir-carrinho");
  btn.classList.remove("is-bump");
  void btn.offsetWidth; // reinicia a animação
  btn.classList.add("is-bump");
}

function alterarQtd(id, delta) {
  const item = carrinho.find((i) => i.id === id);
  if (!item) return;
  item.qtd += delta;
  if (item.qtd <= 0) carrinho = carrinho.filter((i) => i.id !== id);
  salvarCarrinho();
  renderCarrinho();
}

function calcularTotais() {
  const subtotal = carrinho.reduce((soma, i) => soma + produtoPorId(i.id).preco * i.qtd, 0);
  const desconto = cupom ? subtotal * cupom.desconto : 0;
  const comDesconto = subtotal - desconto;
  let valorFrete = null;
  if (frete) valorFrete = comDesconto >= FRETE_GRATIS ? 0 : frete.valor;
  return { subtotal, desconto, valorFrete, total: comDesconto + (valorFrete ?? 0) };
}

function renderCarrinho() {
  const qtdTotal = carrinho.reduce((s, i) => s + i.qtd, 0);
  $("contador").textContent = qtdTotal;
  $("rodape-carrinho").hidden = !carrinho.length;

  if (!carrinho.length) {
    $("itens").innerHTML = `<div class="cart-empty"><span>🛍️</span>Seu carrinho está vazio.</div>`;
    return;
  }

  $("itens").replaceChildren(
    ...carrinho.map(({ id, qtd }) => {
      const p = produtoPorId(id);
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="item__img" style="background: ${p.cor}1a">${p.emoji}</div>
        <div>
          <p class="item__name">${p.nome}</p>
          <p class="item__price">${moeda.format(p.preco)}</p>
          <div class="qty">
            <button aria-label="Diminuir">−</button>
            <span>${qtd}</span>
            <button aria-label="Aumentar">+</button>
          </div>
        </div>
        <div class="item__right">
          <p class="item__total">${moeda.format(p.preco * qtd)}</p>
          <button class="icon-btn" aria-label="Remover">🗑️</button>
        </div>`;
      const [menos, mais] = div.querySelectorAll(".qty button");
      menos.addEventListener("click", () => alterarQtd(id, -1));
      mais.addEventListener("click", () => alterarQtd(id, 1));
      div.querySelector(".icon-btn").addEventListener("click", () => alterarQtd(id, -qtd));
      return div;
    })
  );

  const t = calcularTotais();
  $("subtotal").textContent = moeda.format(t.subtotal);
  $("linha-desconto").hidden = !cupom;
  $("desconto").textContent = `− ${moeda.format(t.desconto)}`;
  $("total").textContent = moeda.format(t.total);

  if (t.valorFrete === null) {
    $("frete").textContent = "—";
  } else {
    $("frete").textContent = t.valorFrete === 0 ? "Grátis" : moeda.format(t.valorFrete);
    $("frete-msg").textContent = `${frete.local} · ${frete.prazo}`;
  }
}

function abrirCarrinho() {
  $("carrinho").classList.add("is-open");
  $("carrinho").setAttribute("aria-hidden", "false");
  $("overlay").hidden = false;
  document.body.classList.add("no-scroll");
  $("fechar-carrinho").focus();
}

function fecharCarrinho() {
  $("carrinho").classList.remove("is-open");
  $("carrinho").setAttribute("aria-hidden", "true");
  $("overlay").hidden = true;
  document.body.classList.remove("no-scroll");
}

$("abrir-carrinho").addEventListener("click", abrirCarrinho);
$("fechar-carrinho").addEventListener("click", fecharCarrinho);
$("overlay").addEventListener("click", fecharCarrinho);
document.addEventListener("keydown", (e) => e.key === "Escape" && fecharCarrinho());

// ---------- Cupom ----------
$("form-cupom").addEventListener("submit", (e) => {
  e.preventDefault();
  const codigo = $("cupom").value.trim().toUpperCase();
  const msg = $("cupom-msg");
  if (CUPONS[codigo]) {
    cupom = { codigo, desconto: CUPONS[codigo] };
    msg.textContent = `Cupom ${codigo} aplicado: ${CUPONS[codigo] * 100}% de desconto.`;
    msg.className = "hint is-ok";
  } else {
    cupom = null;
    msg.textContent = "Cupom inválido.";
    msg.className = "hint is-erro";
  }
  renderCarrinho();
});

// ---------- Frete (consulta o CEP na API ViaCEP) ----------
$("cep").addEventListener("input", (e) => {
  const num = e.target.value.replace(/\D/g, "").slice(0, 8);
  e.target.value = num.length > 5 ? `${num.slice(0, 5)}-${num.slice(5)}` : num;
});

$("form-cep").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cep = $("cep").value.replace(/\D/g, "");
  const msg = $("frete-msg");
  if (cep.length !== 8) {
    msg.textContent = "Digite um CEP com 8 números.";
    msg.className = "hint is-erro";
    return;
  }

  msg.textContent = "Calculando...";
  msg.className = "hint";
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resp.json();
    if (dados.erro) throw new Error("CEP não encontrado");

    const regiao = Object.values(FRETE_REGIAO).find((r) => r.ufs.includes(dados.uf));
    frete = { valor: regiao.valor, prazo: regiao.prazo, local: `${dados.localidade}/${dados.uf}` };
    msg.className = "hint is-ok";
    renderCarrinho();
  } catch {
    frete = null;
    msg.textContent = "CEP não encontrado. Verifique e tente novamente.";
    msg.className = "hint is-erro";
    renderCarrinho();
  }
});

// ---------- Finalizar ----------
$("finalizar").addEventListener("click", () => {
  if (!frete) {
    $("frete-msg").textContent = "Calcule o frete antes de finalizar.";
    $("frete-msg").className = "hint is-erro";
    $("cep").focus();
    return;
  }
  const { total } = calcularTotais();
  $("numero-pedido").textContent = "#" + Math.floor(100000 + Math.random() * 900000);
  $("valor-pedido").textContent = moeda.format(total);

  carrinho = [];
  cupom = null;
  frete = null;
  salvarCarrinho();
  $("cupom").value = "";
  $("cep").value = "";
  $("cupom-msg").textContent = "";
  $("frete-msg").textContent = "";
  renderCarrinho();
  fecharCarrinho();
  $("sucesso").showModal();
});

// ---------- Toast ----------
let toastTimer;
function mostrarToast(texto) {
  const toast = $("toast");
  toast.textContent = texto;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2000);
}

renderCategorias();
renderProdutos();
renderCarrinho();
