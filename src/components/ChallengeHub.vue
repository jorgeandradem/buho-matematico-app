<script setup>
import { ref, computed } from 'vue';
import { 
  X as CloseIcon, Zap, Trophy, Brain, Search, Puzzle, 
  Rocket, Plane, Anchor, ChevronLeft, ChevronRight 
} from 'lucide-vue-next';

// --- IMPORTACIÓN DE JUEGOS ---
import QuizModule from './QuizModule.vue'; 
import MemoryChallenge from './MemoryChallenge.vue';
import NumberSearch from './NumberSearch.vue';
import PuzzleChallenge from './PuzzleChallenge.vue';
import RunnerChallenge from './RunnerChallenge.vue';
import QuickFly from './QuickFly.vue';
import TreasureHunt from '../views/TreasureHunt.vue';

const emit = defineEmits(['close']);
const activeGame = ref(null); 
const currentPage = ref(0); 

// AJUSTE: Ahora mostramos 5 retos por página
const gamesPerPage = 5;

// --- LISTA ORIGINAL DE JUEGOS ---
const games = [
  { 
    id: 'quiz', 
    name: 'Desafío Contra Reloj', 
    icon: Zap, 
    color: 'bg-orange-500', 
    desc: '60 segundos para ganar Plata' 
  },
  { 
    id: 'memory', 
    name: 'Memoria Pro', 
    icon: Brain, 
    color: 'bg-indigo-500', 
    desc: 'Une parejas y gana Oro' 
  },
  { 
    id: 'search', 
    name: 'Sopa de Números', 
    icon: Search, 
    color: 'bg-green-500', 
    desc: 'Encuentra resultados ocultos' 
  },
  { 
    id: 'puzzle', 
    name: 'Rompecabezas Mate', 
    icon: Puzzle, 
    color: 'bg-purple-500', 
    desc: 'Arma, resuelve y gana' 
  },
  { 
    id: 'runner', 
    name: 'Vuelo Legendario', 
    icon: Rocket, 
    color: 'bg-sky-500', 
    desc: 'Calcula mientras vuelas' 
  }, // Este cierra la Página 1 ahora
  { 
    id: 'fly', 
    name: 'Tablas Rápidas', 
    icon: Plane, 
    color: 'bg-rose-500', 
    desc: 'Agilidad mental con Cobre' 
  },
  { 
    id: 'treasure', 
    name: 'Ruta del Tesoro', 
    icon: Anchor, 
    color: 'bg-amber-600', 
    desc: '10 Misiones: El Cofre Pirata' 
  }
];

// --- LÓGICA DE PAGINACIÓN ---
const totalPages = computed(() => Math.ceil(games.length / gamesPerPage));

const paginatedGames = computed(() => {
  const start = currentPage.value * gamesPerPage;
  return games.slice(start, start + gamesPerPage);
});

const nextPage = () => { if (currentPage.value < totalPages.value - 1) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 0) currentPage.value--; };

const openGame = (gameId) => { activeGame.value = gameId; };
const closeGame = () => { activeGame.value = null; };
</script>

<template>
  <div class="absolute inset-0 z-[150] bg-indigo-900/95 backdrop-blur-md flex flex-col p-4 animate-fade-in">
    
    <header class="flex justify-between items-center mb-6 shrink-0">
      <div class="flex items-center gap-3 text-white px-2">
        <Trophy class="text-yellow-400" :size="32" />
        <div>
          <h2 class="text-2xl font-black uppercase tracking-tighter text-white">Portal de Desafíos</h2>
          <p class="text-indigo-200 text-[10px] font-bold uppercase italic">Página {{ currentPage + 1 }} de {{ totalPages }}</p>
        </div>
      </div>
      <button @click="emit('close')" class="bg-white/10 p-3 rounded-full text-white active:scale-90 transition-all shadow-lg">
        <CloseIcon :size="28" />
      </button>
    </header>

    <div v-if="!activeGame" class="flex-1 flex flex-col justify-between overflow-hidden pb-4">
      <div class="grid grid-cols-1 gap-4 overflow-y-auto px-1 scrollbar-hide">
        <button v-for="game in paginatedGames" :key="game.id" @click="openGame(game.id)"
          class="bg-white rounded-3xl p-1 shadow-xl active:translate-y-1 transition-all group border-b-4 border-slate-200">
          <div class="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
            <div :class="`w-16 h-16 rounded-full ${game.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`">
              <component :is="game.icon" :size="32" fill="currentColor" />
            </div>
            <div class="text-left">
              <h3 class="font-black text-slate-800 text-lg leading-tight uppercase">{{ game.name }}</h3>
              <p class="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-tighter">{{ game.desc }}</p>
            </div>
          </div>
        </button>
      </div>

      <footer class="flex justify-between items-center pt-6 gap-4">
        <button @click="prevPage" :disabled="currentPage === 0"
          :class="`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${currentPage === 0 ? 'bg-slate-800 text-slate-600 opacity-50' : 'bg-indigo-600 text-white shadow-lg active:translate-y-1'}`">
          <ChevronLeft :size="20" /> REGRESAR
        </button>

        <button @click="nextPage" :disabled="currentPage >= totalPages - 1"
          :class="`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${currentPage >= totalPages - 1 ? 'bg-slate-800 text-slate-600 opacity-50' : 'bg-indigo-600 text-white shadow-lg active:translate-y-1'}`">
          AVANZAR <ChevronRight :size="20" />
        </button>
      </footer>
    </div>

    <div v-else class="flex-1 relative overflow-hidden">
      <QuizModule v-if="activeGame === 'quiz'" @close="closeGame" />
      <MemoryChallenge v-if="activeGame === 'memory'" @close="closeGame" />
      <NumberSearch v-if="activeGame === 'search'" @close="closeGame" />
      <PuzzleChallenge v-if="activeGame === 'puzzle'" @close="closeGame" />
      <RunnerChallenge v-if="activeGame === 'runner'" @close="closeGame" />
      <QuickFly v-if="activeGame === 'fly'" @close="closeGame" />
      <TreasureHunt v-if="activeGame === 'treasure'" @close="closeGame" />
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>