<script setup>
/**
 * NOTA INFORMATIVA: PORTAL DE DESAFÍOS (CHALLENGE HUB)
 * Gestión de los 19 retos especiales con navegación paginada.
 * Política de Cero Scroll v3.0.1 - Fix Centrado Responsivo Página 5
 */
import { ref, computed } from 'vue';
import { 
  X as CloseIcon, Zap, Trophy, Brain, Search, Puzzle, 
  Rocket, Plane, Anchor, Globe, ChevronLeft, ChevronRight,
  Scale, PieChart, Waves, Dribbble, Box, Clock, Lock,
  Layout, ShoppingCart, Compass, KeyRound 
} from 'lucide-vue-next';

// --- IMPORTACIÓN DE JUEGOS ---
import QuizModule from './QuizModule.vue'; 
import MemoryChallenge from './MemoryChallenge.vue';
import NumberSearch from './NumberSearch.vue';
import PuzzleChallenge from './PuzzleChallenge.vue';
import RunnerChallenge from './RunnerChallenge.vue';
import QuickFly from './QuickFly.vue';
import TreasureHunt from '../views/TreasureHunt.vue';
import WorldTourChallenge from './WorldTourChallenge.vue';
import ScaleMaster from './ScaleMaster.vue'; 
import FractionArchitect from './FractionArchitect.vue';
import SubmarineAlgebra from './SubmarineAlgebra.vue'; 
import SoccerAlgebra from './SoccerAlgebra.vue'; 
import DataDetective3D from './DataDetective3D.vue';
import TimeWatchmaker from './TimeWatchmaker.vue';
import MechanicalVault from './MechanicalVault.vue';
import ArchitectOfShapes from './ArchitectOfShapes.vue';

// 🆕 INTEGRACIÓN DEL CERROJO MATEMÁTICO
import MathLockModal from './MathLockModal.vue';

// 🏗️ IMPORTACIÓN DE NUEVOS RETOS (VOLANDO)
import DecimalMarket from './DecimalMarket.vue';
import AngleNavigation from './AngleNavigation.vue';

const emit = defineEmits(['close', 'update-coins']);
const activeGame = ref(null); 
const currentPage = ref(0); 

const gamesPerPage = 4; 

const games = [
  { id: 'quiz', name: 'Contra Reloj', icon: Zap, color: 'bg-orange-500', desc: '60 segundos para ganar Plata' },
  { id: 'memory', name: 'Memoria Pro', icon: Brain, color: 'bg-indigo-500', desc: 'Une parejas y gana Oro' },
  { id: 'search', name: 'Sopa de Números', icon: Search, color: 'bg-green-500', desc: 'Encuentra resultados ocultos' },
  { id: 'puzzle', name: 'Puzzle Mágico', icon: Puzzle, color: 'bg-purple-500', desc: 'Arma, resuelve y gana' },
  { id: 'runner', name: 'Vuelo Legendario', icon: Rocket, color: 'bg-sky-500', desc: 'Calcula mientras vuelas' },
  { id: 'fly', name: 'Tablas Rápidas', icon: Plane, color: 'bg-rose-500', desc: 'Agilidad mental con Cobre' },
  { id: 'treasure', name: 'Ruta del Tesoro', icon: Anchor, color: 'bg-amber-600', desc: '10 Misiones: El Cofre Pirata' },
  { id: 'world-tour', name: 'Expedición Mundial', icon: Globe, color: 'bg-emerald-600', desc: 'Resuelve el misterio y viaja' },
  { id: 'scale', name: 'Scale Master', icon: Scale, color: 'bg-cyan-600', desc: 'Equilibra el álgebra con pesas' },
  { id: 'pizza', name: 'Pizza Architect', icon: PieChart, color: 'bg-red-500', desc: 'Prepara pedidos y domina partes' },
  { id: 'submarine', name: 'Burbujas de Álgebra', icon: Waves, color: 'bg-blue-600', desc: 'Explota el valor de X bajo el mar' },
  { id: 'soccer', name: 'Soccer Algebra', icon: Dribbble, color: 'bg-lime-600', desc: 'Anota goles resolviendo incógnitas' },
  { id: 'detective', name: 'Cosecha Mágica', icon: Box, color: 'bg-indigo-600', desc: 'Analiza columnas de datos y gana Cobre' },
  { id: 'watchmaker', name: 'El Relojero', icon: Clock, color: 'bg-amber-500', desc: 'Domina las manecillas y gana Plata' },
  { id: 'vault', name: 'La Bóveda', icon: Lock, color: 'bg-slate-600', desc: 'Hackea el valor posicional y gana Oro' },
  { id: 'architect', name: 'Arquitecto de Formas', icon: Layout, color: 'bg-blue-500', desc: 'Cuerpos Geométricos y Mármol' },
  
  // 🔐 NUEVO RETO: CERROJO MÁGICO
  { id: 'lock', name: 'Cerrojo Mágico', icon: KeyRound, color: 'bg-yellow-500', desc: 'Abre el cofre del tesoro' },

  // 🆕 RETOS EN CONSTRUCCIÓN (VOLANDO)
  { id: 'market', name: 'Mercado Decimal', icon: ShoppingCart, color: 'bg-amber-700', desc: 'Cambio Steampunk y la Regla del 100', isVolando: true },
  { id: 'angles', name: 'Navegación Ángulos', icon: Compass, color: 'bg-cyan-500', desc: 'Navega esquivando icebergs', isVolando: true }
];

const totalPages = computed(() => Math.ceil(games.length / gamesPerPage));

const paginatedGames = computed(() => {
  const start = currentPage.value * gamesPerPage;
  return games.slice(start, start + gamesPerPage);
});

const nextPage = () => { if (currentPage.value < totalPages.value - 1) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 0) currentPage.value--; };

const openGame = (gameId) => { activeGame.value = gameId; };
const closeGame = () => { activeGame.value = null; };

// --- CABLEADO DE RECOMPENSAS ---
const handleCoins = (payload) => {
  emit('update-coins', payload);
};

const handleLockSuccess = (payload) => {
  handleCoins(payload);
  setTimeout(() => {
    closeGame();
  }, 1200);
};
</script>

<template>
  <div class="master-hub">
    <div class="hub-canvas">
      
      <header class="header-hub shrink-0">
        <div class="flex items-center gap-3 text-white">
          <div class="bg-yellow-400 p-2 rounded-2xl shadow-lg">
            <Trophy class="text-indigo-900" :size="28" />
          </div>
          <div>
            <h2 class="title-text">Portal de Desafíos</h2>
            <p class="subtitle-text">Página {{ currentPage + 1 }} de {{ totalPages }}</p>
          </div>
        </div>
        <button @click="emit('close')" class="btn-close-hub">
          <CloseIcon :size="24" />
        </button>
      </header>

      <div v-if="!activeGame" class="view-paginator w-full">
        <div class="grid-games w-full">
          <button v-for="game in paginatedGames" :key="game.id" @click="openGame(game.id)"
            class="game-card group w-full mx-auto">
            
            <div class="card-inner relative w-full overflow-hidden">
              
              <div :class="`icon-box ${game.color}`">
                <component :is="game.icon" :size="28" fill="currentColor" />
              </div>
              
              <div class="text-left flex-1 min-w-0" :class="{ 'pr-14': game.isVolando }">
                <h3 class="game-name truncate">{{ game.name }}</h3>
                <p class="game-desc truncate">{{ game.desc }}</p>
              </div>

              <div v-if="game.isVolando" class="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-14">
                <span class="text-2xl sm:text-3xl animate-bounce">🦉</span>
                <span class="text-[7px] sm:text-[8px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full mt-1 shadow-sm leading-none text-center">VOLANDO</span>
              </div>

            </div>
          </button>
        </div>

        <footer class="footer-hub shrink-0 w-full">
          <button @click="prevPage" :disabled="currentPage === 0"
            :class="['btn-nav', currentPage === 0 ? 'disabled' : 'active']">
            <ChevronLeft :size="20" /> REGRESAR
          </button>

          <button @click="nextPage" :disabled="currentPage >= totalPages - 1"
            :class="['btn-nav', currentPage >= totalPages - 1 ? 'disabled' : 'active']">
            AVANZAR <ChevronRight :size="20" />
          </button>
        </footer>
      </div>

      <div v-else class="game-container-slot">
        <QuizModule v-if="activeGame === 'quiz'" @close="closeGame" />
        <MemoryChallenge v-if="activeGame === 'memory'" @close="closeGame" />
        <NumberSearch v-if="activeGame === 'search'" @close="closeGame" />
        <PuzzleChallenge v-if="activeGame === 'puzzle'" @close="closeGame" />
        <RunnerChallenge v-if="activeGame === 'runner'" @close="closeGame" />
        <QuickFly v-if="activeGame === 'fly'" @close="closeGame" />
        <TreasureHunt v-if="activeGame === 'treasure'" @close="closeGame" />
        <WorldTourChallenge v-if="activeGame === 'world-tour'" @close="closeGame" />
        <ScaleMaster v-if="activeGame === 'scale'" @close="closeGame" />
        <FractionArchitect v-if="activeGame === 'pizza'" @close="closeGame" />
        
        <SubmarineAlgebra v-if="activeGame === 'submarine'" @close="closeGame" @update-coins="handleCoins" />
        <SoccerAlgebra v-if="activeGame === 'soccer'" @close="closeGame" @update-coins="handleCoins" />

        <DataDetective3D v-if="activeGame === 'detective'" @close="closeGame" />
        <TimeWatchmaker v-if="activeGame === 'watchmaker'" @close="closeGame" />
        <MechanicalVault v-if="activeGame === 'vault'" @close="closeGame" />

        <ArchitectOfShapes v-if="activeGame === 'architect'" @close="closeGame" />
        
        <div v-if="activeGame === 'lock'" class="w-full h-full flex items-center justify-center bg-slate-900/40">
           <MathLockModal @close="closeGame" @success="handleLockSuccess" />
        </div>
        
        <div v-if="activeGame === 'market' || activeGame === 'angles'" class="w-full h-full flex flex-col items-center justify-center bg-slate-50 relative rounded-[2rem] overflow-hidden px-4">
            <button @click="closeGame" class="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition z-10 text-xs sm:text-base">
                <ChevronLeft size="24" class="hidden sm:block" />
                <ChevronLeft size="18" class="sm:hidden" />
                <span class="hidden sm:inline">AL PORTAL DE DESAFÍOS</span>
                <span class="sm:hidden">VOLVER</span>
            </button>
            <div class="text-center flex flex-col items-center w-full max-w-sm mx-auto">
                <span class="text-[80px] sm:text-[120px] inline-block animate-bounce mb-2">🦉</span>
                <h1 class="text-4xl sm:text-5xl font-black text-indigo-900 uppercase italic">VOLANDO</h1>
                <h2 class="text-lg sm:text-2xl font-bold text-slate-600 mt-2 text-center break-words">{{ activeGame === 'market' ? 'Mercado Decimal' : 'Navegación de Ángulos' }}</h2>
                <div class="mt-6 sm:mt-8 bg-white px-4 py-3 sm:px-6 rounded-full border-2 border-indigo-100 shadow-sm flex items-center justify-center gap-2 sm:gap-3 w-full">
                    <component :is="activeGame === 'market' ? ShoppingCart : Compass" class="text-indigo-500 shrink-0" size="24"/>
                    <span class="font-bold text-slate-700 text-xs sm:text-base whitespace-nowrap">Preparando reto...</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* LEY DE HIERRO v3.0.1 - CERO SCROLL SMARTPHONE */
.master-hub {
  position: fixed;
  inset: 0;
  z-index: 150;
  background-color: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  touch-action: none !important;
}

.hub-canvas {
  display: grid;
  grid-template-rows: auto 1fr;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom right, #312e81, #4f46e5);
  padding: 1.25rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  touch-action: none !important;
  width: 100vw;
  height: 100dvh;
}

@media (min-width: 600px) and (max-width: 1024px) {
  .hub-canvas { width: 85vw; height: 92dvh; border-radius: 35px; padding: 2rem; }
}

@media (min-width: 1025px) {
  .hub-canvas { width: 1024px; height: 90dvh; border-radius: 45px; padding: 2.5rem; }
}

.header-hub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title-text {
  font-size: clamp(1.2rem, 4vw, 2.2rem);
  font-weight: 900;
  color: white;
  text-transform: uppercase;
  line-height: 1;
}

.subtitle-text {
  color: #c7d2fe;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
}

.view-paginator {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.grid-games {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch; /* Forza a los items a llenar el ancho */
  width: 100%;
  gap: 0.75rem;
  padding-bottom: 1rem;
}

.game-card {
  background: white;
  border-radius: 1.5rem;
  padding: 0.2rem;
  border-bottom: 4px solid #e2e8f0;
  width: 100%;
  flex: none; /* Elimina estiramientos indeseados cuando hay pocos items */
  max-height: 110px;
  min-height: 80px;
  cursor: pointer;
}

.card-inner {
  background: #f8fafc;
  border-radius: 1.3rem;
  padding: 0.75rem 1rem;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-box {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.game-name { font-size: 1rem; font-weight: 900; color: #1e293b; text-transform: uppercase; }
.game-desc { font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

.footer-hub {
  display: flex;
  gap: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.btn-nav {
  flex: 1;
  padding: 1rem;
  border-radius: 1.25rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.btn-nav.active { background: #4f46e5; color: white; box-shadow: 0 5px 0 #312e81; cursor: pointer; }
.btn-nav.active:active { transform: translateY(3px); box-shadow: 0 2px 0 #312e81; }
.btn-nav.disabled { background: #1e1b4b; color: #4338ca; opacity: 0.5; cursor: not-allowed; }

.btn-close-hub {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
  border-radius: 9999px;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-close-hub:hover { background: rgba(255, 255, 255, 0.2); }

.game-container-slot {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 2rem;
  background: white;
}

@media (min-height: 800px) {
  .grid-games { gap: 1.25rem; }
  .game-card { max-height: 130px; }
  .icon-box { width: 4rem; height: 4rem; }
}
</style>