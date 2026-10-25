// A constante API (URL base dos endpoints) é definida pelo index.php
const $ = (id) => document.getElementById(id);
const form = $("form");
const msg = $("msg");
const LIMITE = 5;
let paginaAtual = 1;

async function chamarApi(caminho = "", opcoes = {}) {
  const resp = await fetch(API + caminho, {
    ...opcoes,
    headers: { "Content-Type": "application/json", ...opcoes.headers },
  });
  if (resp.status === 204) return null;
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(dados.erro || `Erro ${resp.status}`);
  return dados;
}

function mostrarMensagem(texto, erro = false) {
  msg.textContent = texto;
  msg.className = "msg" + (erro ? " is-erro" : "");
}

// ---------- Criar link ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const botao = form.querySelector("button");
  botao.disabled = true;
  mostrarMensagem("");

  const corpo = { url: form.url.value.trim() };
  if (form.alias.value.trim()) corpo.alias = form.alias.value.trim();

  try {
    const link = await chamarApi("", { method: "POST", body: JSON.stringify(corpo) });
    const a = $("curta");
    a.href = link.url_curta;
    a.textContent = link.url_curta;
    $("resultado").hidden = false;
    $("copiar").textContent = "Copiar";
    form.reset();
    carregarLinks(1);
  } catch (err) {
    mostrarMensagem(err.message, true);
  } finally {
    botao.disabled = false;
  }
});

$("copiar").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("curta").textContent);
    $("copiar").textContent = "Copiado ✓";
  } catch {
    mostrarMensagem("Não foi possível copiar automaticamente.", true);
  }
});

// ---------- Listar links ----------
async function carregarLinks(pagina = paginaAtual) {
  paginaAtual = pagina;
  const container = $("links");
  try {
    const { dados, paginacao } = await chamarApi(`?pagina=${pagina}&limite=${LIMITE}`);

    if (!dados.length && pagina > 1) return carregarLinks(pagina - 1);
    if (!dados.length) {
      container.innerHTML = `<p class="empty">Nenhum link ainda. Crie o primeiro acima!</p>`;
    } else {
      container.replaceChildren(...dados.map(criarLinha));
    }
    renderPaginacao(paginacao);
  } catch (err) {
    container.innerHTML = "";
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = `Não foi possível carregar os links: ${err.message}`;
    container.append(p);
  }
}

function criarLinha(link) {
  const row = document.createElement("div");
  row.className = "link-row";
  row.innerHTML = `
    <div class="link-row__main" title="Clique para ver as estatísticas">
      <div class="link-row__info">
        <a class="link-row__short" target="_blank" rel="noopener"></a>
        <p class="link-row__url"></p>
      </div>
      <div class="link-row__clicks"><strong>${link.cliques}</strong>cliques</div>
      <button class="btn btn--danger btn--small" aria-label="Excluir">Excluir</button>
    </div>`;

  const a = row.querySelector(".link-row__short");
  a.href = link.url_curta;
  a.textContent = link.url_curta.replace(/^https?:\/\//, "");
  a.addEventListener("click", (e) => {
    e.stopPropagation();
    // Atualiza a contagem depois que o clique for registrado
    setTimeout(() => carregarLinks(), 1500);
  });
  row.querySelector(".link-row__url").textContent = link.url;

  row.querySelector(".btn--danger").addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!confirm(`Excluir o link "${link.codigo}"?`)) return;
    try {
      await chamarApi("/" + encodeURIComponent(link.codigo), { method: "DELETE" });
      carregarLinks();
    } catch (err) {
      mostrarMensagem(err.message, true);
    }
  });

  row.querySelector(".link-row__main").addEventListener("click", () => alternarEstatisticas(row, link.codigo));
  return row;
}

async function alternarEstatisticas(row, codigo) {
  const aberto = row.querySelector(".link-row__stats");
  if (aberto) return aberto.remove();

  const stats = document.createElement("div");
  stats.className = "link-row__stats";
  stats.innerHTML = `<p>Carregando...</p>`;
  row.append(stats);

  try {
    const detalhe = await chamarApi("/" + encodeURIComponent(codigo));
    const max = Math.max(1, ...detalhe.cliques_por_dia.map((d) => d.cliques));
    const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
    stats.innerHTML = `
      <p>Cliques nos últimos 7 dias · criado em ${new Date(detalhe.criado_em).toLocaleDateString("pt-BR")}</p>
      <div class="chart">
        ${detalhe.cliques_por_dia
          .map(
            (d) => `
          <div class="chart__col" title="${d.dia}: ${d.cliques} cliques">
            <span class="chart__val">${d.cliques || ""}</span>
            <div class="chart__bar" style="height: ${(d.cliques / max) * 70}%"></div>
            <span class="chart__day">${fmt.format(new Date(d.dia + "T12:00")).replace(".", "")}</span>
          </div>`
          )
          .join("")}
      </div>`;
  } catch (err) {
    stats.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = err.message;
    stats.append(p);
  }
}

function renderPaginacao({ pagina, paginas }) {
  const pager = $("paginacao");
  if (paginas <= 1) return pager.replaceChildren();
  pager.replaceChildren(
    ...Array.from({ length: paginas }, (_, i) => {
      const btn = document.createElement("button");
      btn.className = "btn btn--ghost btn--small" + (i + 1 === pagina ? " is-active" : "");
      btn.textContent = i + 1;
      btn.addEventListener("click", () => carregarLinks(i + 1));
      return btn;
    })
  );
}

$("atualizar").addEventListener("click", () => carregarLinks());
carregarLinks(1);
