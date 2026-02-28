// src/data/pirateLevels.js
// Configuración de la Ruta del Tesoro v2.0 - Búho Matemático
// Ajuste: Tablas básicas del 1 al 10 y Recompensas por Misión

export const pirateLevels = [
  {
    id: 1,
    name: "Isla Tortuga",
    sky: "from-sky-300 to-sky-100",
    sea: "from-blue-600 to-cyan-400",
    sand: "bg-yellow-200",
    operation: "5 + 4",
    reward: { type: 'copper', amount: 30 }
  },
  {
    id: 2,
    name: "Arrecife Dorado",
    sky: "from-orange-400 to-pink-300",
    sea: "from-blue-700 to-blue-500",
    sand: "bg-yellow-300",
    operation: "10 - 3",
    reward: { type: 'copper', amount: 50 }
  },
  {
    id: 3,
    name: "Bahía del Trueno",
    sky: "from-slate-500 to-slate-300",
    sea: "from-indigo-800 to-blue-900",
    sand: "bg-gray-300",
    operation: "2 x 4",
    reward: { type: 'silver', amount: 10 }
  },
  {
    id: 4,
    name: "Costa Esmeralda",
    sky: "from-teal-300 to-emerald-100",
    sea: "from-emerald-600 to-teal-400",
    sand: "bg-orange-100",
    operation: "8 + 7",
    reward: { type: 'silver', amount: 15 }
  },
  {
    id: 5,
    name: "Isla Calavera",
    sky: "from-gray-900 to-purple-900",
    sea: "from-slate-900 to-indigo-950",
    sand: "bg-yellow-600",
    operation: "15 - 6",
    reward: { type: 'gold', amount: 2 }
  },
  {
    id: 6,
    name: "Puerto Aurora",
    sky: "from-fuchsia-400 to-indigo-300",
    sea: "from-blue-500 to-purple-500",
    sand: "bg-white",
    operation: "5 x 3",
    reward: { type: 'silver', amount: 20 }
  },
  {
    id: 7,
    name: "Laguna de Cristal",
    sky: "from-cyan-200 to-white",
    sea: "from-cyan-400 to-blue-300",
    sand: "bg-stone-100",
    operation: "9 + 9",
    reward: { type: 'silver', amount: 25 }
  },
  {
    id: 8,
    name: "Volcán de Fuego",
    sky: "from-orange-600 to-red-500",
    sea: "from-red-900 to-orange-800",
    sand: "bg-zinc-800",
    operation: "4 x 4",
    reward: { type: 'gold', amount: 3 }
  },
  {
    id: 9,
    name: "Pasaje del Olvido",
    sky: "from-indigo-900 to-black",
    sea: "from-blue-950 to-black",
    sand: "bg-blue-200",
    operation: "20 - 11",
    reward: { type: 'gold', amount: 4 }
  },
  {
    id: 10,
    name: "La Gran Isla del Tesoro",
    sky: "from-yellow-400 via-amber-200 to-yellow-500",
    sea: "from-cyan-500 to-blue-400",
    sand: "bg-yellow-400",
    operation: "10 x 10",
    reward: { type: 'gold', amount: 10 }
  }
];