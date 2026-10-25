// Menu mobile
const toggle = document.querySelector(".nav__toggle");
const menu = document.querySelector(".nav__menu");

toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("is-open");
  toggle.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open);
});

menu.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menu.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", false);
  })
);

// Borda na navegação ao rolar
const nav = document.querySelector(".nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 10);
});

// Animação de entrada dos elementos
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Filtro de projetos
const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll(".project");

filters.forEach((btn) =>
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    const cat = btn.dataset.filter;
    projects.forEach((p) => {
      p.classList.toggle("is-hidden", cat !== "todos" && p.dataset.cat !== cat);
    });
  })
);

// O GitHub Pages não roda PHP: nos projetos em PHP, o botão leva ao código
if (location.hostname.endsWith("github.io")) {
  document.querySelectorAll("a[data-php]").forEach((link) => {
    const codigo = link.nextElementSibling;
    link.href = codigo.href;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Ver código (PHP) →";
    codigo.remove();
  });
}

// Ano no rodapé
document.getElementById("ano").textContent = new Date().getFullYear();
