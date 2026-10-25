// Catálogo de exemplo (em um projeto real viria de uma API)
const PRODUTOS = [
  { id: 1, nome: "Fone Bluetooth Pro", categoria: "Eletrônicos", preco: 249.9, precoAntigo: 329.9, emoji: "🎧", cor: "#6366f1", nota: 4.7 },
  { id: 2, nome: "Smartwatch Fit", categoria: "Eletrônicos", preco: 399.0, emoji: "⌚", cor: "#0ea5e9", nota: 4.5 },
  { id: 3, nome: "Teclado Mecânico RGB", categoria: "Eletrônicos", preco: 289.9, emoji: "⌨️", cor: "#8b5cf6", nota: 4.8 },
  { id: 4, nome: "Câmera Instantânea", categoria: "Eletrônicos", preco: 519.0, precoAntigo: 599.0, emoji: "📷", cor: "#ec4899", nota: 4.3 },
  { id: 5, nome: "Tênis Corrida Leve", categoria: "Moda", preco: 299.9, emoji: "👟", cor: "#f97316", nota: 4.6 },
  { id: 6, nome: "Óculos de Sol", categoria: "Moda", preco: 159.0, precoAntigo: 199.0, emoji: "🕶️", cor: "#334155", nota: 4.2 },
  { id: 7, nome: "Mochila Urbana", categoria: "Moda", preco: 189.9, emoji: "🎒", cor: "#14b8a6", nota: 4.7 },
  { id: 8, nome: "Boné Clássico", categoria: "Moda", preco: 69.9, emoji: "🧢", cor: "#ef4444", nota: 4.1 },
  { id: 9, nome: "Cafeteira Elétrica", categoria: "Casa", preco: 179.9, emoji: "☕", cor: "#a16207", nota: 4.4 },
  { id: 10, nome: "Luminária de Mesa", categoria: "Casa", preco: 119.0, emoji: "💡", cor: "#eab308", nota: 4.5 },
  { id: 11, nome: "Kit Plantas Suculentas", categoria: "Casa", preco: 59.9, precoAntigo: 79.9, emoji: "🪴", cor: "#22c55e", nota: 4.9 },
  { id: 12, nome: "Caneca Térmica", categoria: "Casa", preco: 49.9, emoji: "🥤", cor: "#06b6d4", nota: 4.3 },
  { id: 13, nome: "Livro: Lógica de Programação", categoria: "Livros", preco: 89.9, emoji: "📘", cor: "#2563eb", nota: 4.8 },
  { id: 14, nome: "Livro: Design para Devs", categoria: "Livros", preco: 74.9, emoji: "📕", cor: "#dc2626", nota: 4.6 },
  { id: 15, nome: "Kit Cadernos Pontilhados", categoria: "Livros", preco: 39.9, emoji: "📓", cor: "#64748b", nota: 4.4 },
  { id: 16, nome: "Bola de Futebol", categoria: "Esportes", preco: 129.9, emoji: "⚽", cor: "#16a34a", nota: 4.5 },
  { id: 17, nome: "Tapete de Yoga", categoria: "Esportes", preco: 99.9, precoAntigo: 139.9, emoji: "🧘", cor: "#a855f7", nota: 4.7 },
  { id: 18, nome: "Garrafa Esportiva", categoria: "Esportes", preco: 44.9, emoji: "🍶", cor: "#0284c7", nota: 4.2 },
];

// Cupons válidos: código -> desconto (fração)
const CUPONS = { BEMVINDO10: 0.1, DEV20: 0.2 };
