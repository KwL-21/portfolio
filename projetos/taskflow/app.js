const STORAGE_KEY = "taskflow:tarefas";
const PRIORIDADES = { baixa: "Baixa", media: "Média", alta: "Alta" };

const modal = document.getElementById("modal");
const form = document.getElementById("form");
const btnExcluir = document.getElementById("excluir");
const busca = document.getElementById("busca");
const template = document.getElementById("card-tpl");

let tarefas = carregar();
let editandoId = null;
let arrastandoId = null;

// ---------- Persistência ----------
function carregar() {
  try {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(dados)) return dados;
  } catch {}
  // Tarefas de exemplo na primeira visita
  return [
    { id: crypto.randomUUID(), titulo: "Estudar JavaScript", descricao: "Arrays, objetos e DOM", prioridade: "alta", prazo: "", status: "doing" },
    { id: crypto.randomUUID(), titulo: "Criar portfólio", descricao: "", prioridade: "media", prazo: "", status: "todo" },
    { id: crypto.randomUUID(), titulo: "Configurar Git", descricao: "", prioridade: "baixa", prazo: "", status: "done" },
  ];
}

function salvar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
  } catch {}
}

// ---------- Renderização ----------
function formatarPrazo(prazo) {
  if (!prazo) return { texto: "", atrasado: false };
  const [a, m, d] = prazo.split("-");
  const hoje = new Date().toISOString().slice(0, 10);
  return { texto: `📅 ${d}/${m}/${a}`, atrasado: prazo < hoje };
}

function criarCard(tarefa) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.dataset.id = tarefa.id;
  card.dataset.prio = tarefa.prioridade;
  card.dataset.status = tarefa.status;
  card.querySelector(".card__prio").textContent = PRIORIDADES[tarefa.prioridade];
  card.querySelector(".card__title").textContent = tarefa.titulo;
  card.querySelector(".card__desc").textContent = tarefa.descricao;

  const prazo = formatarPrazo(tarefa.prazo);
  const elPrazo = card.querySelector(".card__prazo");
  elPrazo.textContent = prazo.texto;
  elPrazo.classList.toggle("is-late", prazo.atrasado && tarefa.status !== "done");

  card.addEventListener("click", () => abrirModal(tarefa.id));
  card.addEventListener("keydown", (e) => e.key === "Enter" && abrirModal(tarefa.id));
  card.addEventListener("dragstart", () => {
    arrastandoId = tarefa.id;
    card.classList.add("is-dragging");
  });
  card.addEventListener("dragend", () => card.classList.remove("is-dragging"));
  return card;
}

function render() {
  const termo = busca.value.trim().toLowerCase();
  const ordem = { alta: 0, media: 1, baixa: 2 };

  document.querySelectorAll(".column__list").forEach((lista) => {
    const status = lista.dataset.status;
    const itens = tarefas
      .filter((t) => t.status === status)
      .filter((t) => !termo || (t.titulo + " " + t.descricao).toLowerCase().includes(termo))
      .sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade]);

    lista.replaceChildren(...itens.map(criarCard));
    if (!itens.length) {
      const vazio = document.createElement("p");
      vazio.className = "empty";
      vazio.textContent = termo ? "Nada encontrado" : "Arraste tarefas para cá";
      lista.append(vazio);
    }
    lista.closest(".column").querySelector(".count").textContent = itens.length;
  });
}

// ---------- Modal ----------
function abrirModal(id = null) {
  editandoId = id;
  form.reset();
  const tarefa = tarefas.find((t) => t.id === id);
  document.getElementById("modal-titulo").textContent = tarefa ? "Editar tarefa" : "Nova tarefa";
  btnExcluir.hidden = !tarefa;
  if (tarefa) {
    form.titulo.value = tarefa.titulo;
    form.descricao.value = tarefa.descricao;
    form.prioridade.value = tarefa.prioridade;
    form.prazo.value = tarefa.prazo;
  }
  modal.showModal();
  form.titulo.focus();
}

form.addEventListener("submit", () => {
  const dados = {
    titulo: form.titulo.value.trim(),
    descricao: form.descricao.value.trim(),
    prioridade: form.prioridade.value,
    prazo: form.prazo.value,
  };
  if (!dados.titulo) return;

  if (editandoId) {
    Object.assign(tarefas.find((t) => t.id === editandoId), dados);
  } else {
    tarefas.push({ id: crypto.randomUUID(), status: "todo", ...dados });
  }
  salvar();
  render();
});

btnExcluir.addEventListener("click", () => {
  if (!confirm("Excluir esta tarefa?")) return;
  tarefas = tarefas.filter((t) => t.id !== editandoId);
  salvar();
  render();
  modal.close();
});

document.getElementById("cancelar").addEventListener("click", () => modal.close());
document.getElementById("nova").addEventListener("click", () => abrirModal());
busca.addEventListener("input", render);

// ---------- Arrastar e soltar ----------
document.querySelectorAll(".column__list").forEach((lista) => {
  lista.addEventListener("dragover", (e) => {
    e.preventDefault();
    lista.classList.add("is-over");
  });
  lista.addEventListener("dragleave", () => lista.classList.remove("is-over"));
  lista.addEventListener("drop", (e) => {
    e.preventDefault();
    lista.classList.remove("is-over");
    const tarefa = tarefas.find((t) => t.id === arrastandoId);
    if (tarefa && tarefa.status !== lista.dataset.status) {
      tarefa.status = lista.dataset.status;
      salvar();
      render();
    }
    arrastandoId = null;
  });
});

render();
