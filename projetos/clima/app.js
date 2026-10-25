const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const CLIMA_URL = "https://api.open-meteo.com/v1/forecast";

// Códigos WMO -> [descrição, ícone dia, ícone noite, tema]
const CODIGOS = {
  0: ["Céu limpo", "☀️", "🌙", "sol"],
  1: ["Predominantemente limpo", "🌤️", "🌙", "sol"],
  2: ["Parcialmente nublado", "⛅", "☁️", "nuvem"],
  3: ["Nublado", "☁️", "☁️", "nuvem"],
  45: ["Neblina", "🌫️", "🌫️", "nuvem"],
  48: ["Neblina com geada", "🌫️", "🌫️", "nuvem"],
  51: ["Garoa fraca", "🌦️", "🌧️", "chuva"],
  53: ["Garoa", "🌦️", "🌧️", "chuva"],
  55: ["Garoa forte", "🌧️", "🌧️", "chuva"],
  61: ["Chuva fraca", "🌦️", "🌧️", "chuva"],
  63: ["Chuva", "🌧️", "🌧️", "chuva"],
  65: ["Chuva forte", "🌧️", "🌧️", "chuva"],
  71: ["Neve fraca", "🌨️", "🌨️", "nuvem"],
  73: ["Neve", "🌨️", "🌨️", "nuvem"],
  75: ["Neve forte", "❄️", "❄️", "nuvem"],
  80: ["Pancadas de chuva", "🌦️", "🌧️", "chuva"],
  81: ["Pancadas de chuva", "🌧️", "🌧️", "chuva"],
  82: ["Pancadas fortes", "⛈️", "⛈️", "chuva"],
  95: ["Tempestade", "⛈️", "⛈️", "chuva"],
  96: ["Tempestade com granizo", "⛈️", "⛈️", "chuva"],
  99: ["Tempestade com granizo", "⛈️", "⛈️", "chuva"],
};

const $ = (id) => document.getElementById(id);
const form = $("form-busca");
const input = $("cidade");
const listaSugestoes = $("sugestoes");

let sugestoes = [];
let indiceAtivo = -1;
let debounce;

function descrever(codigo, ehDia = true) {
  const [desc, iconeDia, iconeNoite, tema] = CODIGOS[codigo] ?? ["Indefinido", "🌡️", "🌡️", "nuvem"];
  return { desc, icone: ehDia ? iconeDia : iconeNoite, tema: ehDia ? tema : "noite" };
}

function mostrarStatus(texto) {
  $("status").textContent = texto;
  $("status").hidden = !texto;
}

// ---------- Busca de cidades ----------
async function buscarCidades(nome) {
  const url = `${GEO_URL}?name=${encodeURIComponent(nome)}&count=5&language=pt&format=json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Falha na busca de cidades");
  const dados = await resp.json();
  return dados.results ?? [];
}

function nomeLugar(c) {
  return [c.name, c.admin1, c.country].filter(Boolean).join(", ");
}

function renderSugestoes() {
  indiceAtivo = -1;
  listaSugestoes.replaceChildren(
    ...sugestoes.map((c, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${c.name} <small></small>`;
      li.querySelector("small").textContent = [c.admin1, c.country].filter(Boolean).join(", ");
      li.addEventListener("mousedown", () => escolher(i));
      return li;
    })
  );
  listaSugestoes.hidden = !sugestoes.length;
}

function destacar(i) {
  indiceAtivo = (i + sugestoes.length) % sugestoes.length;
  [...listaSugestoes.children].forEach((li, idx) => li.classList.toggle("is-active", idx === indiceAtivo));
}

function escolher(i) {
  const c = sugestoes[i];
  if (!c) return;
  input.value = c.name;
  listaSugestoes.hidden = true;
  carregarClima(c.latitude, c.longitude, nomeLugar(c));
}

input.addEventListener("input", () => {
  clearTimeout(debounce);
  const nome = input.value.trim();
  if (nome.length < 2) {
    listaSugestoes.hidden = true;
    return;
  }
  debounce = setTimeout(async () => {
    try {
      sugestoes = await buscarCidades(nome);
      renderSugestoes();
    } catch {
      listaSugestoes.hidden = true;
    }
  }, 300);
});

input.addEventListener("keydown", (e) => {
  if (listaSugestoes.hidden) return;
  if (e.key === "ArrowDown") { e.preventDefault(); destacar(indiceAtivo + 1); }
  if (e.key === "ArrowUp") { e.preventDefault(); destacar(indiceAtivo - 1); }
  if (e.key === "Escape") listaSugestoes.hidden = true;
});

input.addEventListener("blur", () => setTimeout(() => (listaSugestoes.hidden = true), 100));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (indiceAtivo >= 0) return escolher(indiceAtivo);

  const nome = input.value.trim();
  if (!nome) return;
  mostrarStatus("Buscando...");
  try {
    sugestoes = await buscarCidades(nome);
    if (!sugestoes.length) return mostrarStatus(`Nenhuma cidade encontrada para "${nome}".`);
    escolher(0);
  } catch {
    mostrarStatus("Erro de conexão. Tente novamente.");
  }
});

// ---------- Geolocalização ----------
$("local").addEventListener("click", () => {
  if (!navigator.geolocation) return mostrarStatus("Seu navegador não suporta geolocalização.");
  mostrarStatus("Obtendo sua localização...");
  navigator.geolocation.getCurrentPosition(
    (pos) => carregarClima(pos.coords.latitude, pos.coords.longitude, "Sua localização"),
    () => mostrarStatus("Não foi possível obter sua localização.")
  );
});

// ---------- Clima ----------
async function carregarClima(lat, lon, lugar) {
  mostrarStatus("Carregando clima...");
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: 6,
  });

  try {
    const resp = await fetch(`${CLIMA_URL}?${params}`);
    if (!resp.ok) throw new Error();
    const dados = await resp.json();
    renderClima(dados, lugar);
    mostrarStatus("");
    try { localStorage.setItem("clima:ultima", JSON.stringify({ lat, lon, lugar })); } catch {}
  } catch {
    mostrarStatus("Não foi possível carregar o clima. Tente novamente.");
  }
}

function renderClima({ current: c, daily: d }, lugar) {
  const { desc, icone, tema } = descrever(c.weather_code, c.is_day === 1);
  document.body.className = `tema-${tema}`;

  $("local-nome").textContent = lugar;
  $("icone").textContent = icone;
  $("temp").textContent = `${Math.round(c.temperature_2m)}°`;
  $("descricao").textContent = desc;
  $("sensacao").textContent = `${Math.round(c.apparent_temperature)}°`;
  $("umidade").textContent = `${c.relative_humidity_2m}%`;
  $("vento").textContent = `${Math.round(c.wind_speed_10m)} km/h`;
  $("atual").hidden = false;

  const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
  $("dias").replaceChildren(
    ...d.time.slice(1).map((data, i) => {
      const idx = i + 1;
      const div = document.createElement("div");
      div.className = "day";
      div.innerHTML = `
        <p class="day__name">${fmt.format(new Date(data + "T12:00")).replace(".", "")}</p>
        <p class="day__icon">${descrever(d.weather_code[idx]).icone}</p>
        <p class="day__temps">${Math.round(d.temperature_2m_max[idx])}° <span>${Math.round(d.temperature_2m_min[idx])}°</span></p>`;
      div.title = descrever(d.weather_code[idx]).desc;
      return div;
    })
  );
  $("previsao").hidden = false;
}

// Carrega a última cidade pesquisada (ou São Paulo)
(function iniciar() {
  let ultima = null;
  try { ultima = JSON.parse(localStorage.getItem("clima:ultima")); } catch {}
  const { lat, lon, lugar } = ultima ?? { lat: -23.55, lon: -46.63, lugar: "São Paulo, SP, Brasil" };
  carregarClima(lat, lon, lugar);
})();
