<script setup>
/** * ARCHIVO: GameLobbyHub.vue
 * NOTA INTERNA: CLUB LÓGICO v2.0 - SELECTOR DE MODOS Y ECONOMÍA TRANSPARENTE
 * LOGICA: Taquilla con desglose financiero y selección de tipo de partida.
 */
import { ref, computed } from 'vue';
import { 
  X as CloseIcon, Crown, Circle, Club, Lightbulb, 
  LayoutGrid, Grid3x3, Play, Zap, Ticket, AlertTriangle, Gamepad2,
  User, Users, Globe, Cpu, Sparkles
} from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';

const emit = defineEmits(['close', 'open-game', 'go-earn-coins']);
const gamificationStore = useGamificationStore();

// --- 🎮 CATÁLOGO CON SOPORTE DE MODOS ---
const MODE_LABELS = {
  'solo': { text: 'Solitario', icon: User },
  'vs-pc': { text: 'Vs. Computadora', icon: Cpu },
  'local': { text: '2 Jugadores (Local)', icon: Users },
  'online': { text: 'Multijugador Online', icon: Globe }
};

const recreationGames = [
  { id: 'chess', name: 'Ajedrez', icon: Crown, cost: 15, isVolando: false, desc: 'Rey de la Estrategia', color: 'bg-slate-800', modes: ['vs-pc', 'local'] },
  { id: 'checkers', name: 'Damas', icon: Circle, cost: 15, isVolando: false, desc: 'Batalla Diagonal', color: 'bg-red-700', modes: ['vs-pc', 'local'] },
  // 🚀 ¡SOLITARIO ATERRIZADO Y DESBLOQUEADO!
  { id: 'solitaire', name: 'Solitario', icon: Club, cost: 15, isVolando: false, desc: 'Paciencia y Orden', color: 'bg-emerald-700', modes: ['solo'] },
  { id: 'mastermind', name: 'Código Secreto', icon: Lightbulb, cost: 15, isVolando: false, desc: 'Lógica Deductiva', color: 'bg-purple-700', modes: ['solo', 'vs-pc'] },
  { id: 'connect4', name: 'Conecta 4', icon: LayoutGrid, cost: 15, isVolando: false, desc: 'Bloqueo Espacial', color: 'bg-blue-600', modes: ['vs-pc', 'local'] },
  { id: 'sudoku', name: 'Sudoku', icon: Grid3x3, cost: 15, isVolando: false, desc: 'Concentración Pura', color: 'bg-teal-600', modes: ['solo'] },
  { id: 'particles', name: 'Sintetizador', icon: Sparkles, cost: 5, isVolando: false, desc: 'Música y Números', color: 'bg-fuchsia-600', modes: ['solo'] }
];

// --- 🎟️ LÓGICA DE LA TAQUILLA ---
const selectedGame = ref(null);
const selectedMode = ref(null);
const showTicketModal = ref(false);
const isProcessingPayment = ref(false);
const paymentError = ref(false);

const coinSound = new Audio('/audios/coin.mp3');
const ticketSound = new Audio('/audios/clip.mp3');

const attemptOpenGame = (game) => {
  if (game.isVolando) {
    gamificationStore.bubbleMessage = `El juego ${game.name} aún está en construcción. 🦉`;
    return;
  }
  
  selectedGame.value = game;
  selectedMode.value = null; 
  paymentError.value = false;
  showTicketModal.value = true;

  if (game.modes.length === 1) {
    selectedMode.value = game.modes[0];
  }
};

const selectMode = (modeId) => {
  selectedMode.value = modeId;
};

const buyTicketAndPlay = async () => {
  if (isProcessingPayment.value || !selectedGame.value || !selectedMode.value) return;
  
  if (gamificationStore.totalWealthInCopper < selectedGame.value.cost) {
    paymentError.value = true;
    return;
  }

  isProcessingPayment.value = true;
  const success = await gamificationStore.payRecreationEntry(selectedGame.value.cost);
  
  if (success) {
    coinSound.currentTime = 0;
    coinSound.play().catch(()=>{});
    
    setTimeout(() => {
      ticketSound.currentTime = 0;
      ticketSound.play().catch(()=>{});
    }, 400);

    setTimeout(() => {
      isProcessingPayment.value = false;
      showTicketModal.value = false;
      emit('open-game', { id: selectedGame.value.id, mode: selectedMode.value }); 
    }, 1200);
  } else {
    isProcessingPayment.value = false;
    paymentError.value = true;
  }
};

const closeTicketModal = () => {
  if (isProcessingPayment.value) return;
  showTicketModal.value = false;
  setTimeout(() => { selectedGame.value = null; selectedMode.value = null; paymentError.value = false; }, 300);
};

const handleNeedCoins = () => {
  closeTicketModal();
  emit('go-earn-coins');
};
</script>

<template>
  <div class="master-hub">
    <div class="hub-canvas">
      
      <header class="header-hub shrink-0">
        <div class="flex items-center gap-3 text-white">
          <div class="bg-rose-400 p-2.5 rounded-2xl shadow-[0_4px_0_rgb(159,18,57)] border-2 border-rose-300">
            <Gamepad2 class="text-white" :size="28" />
          </div>
          <div>
            <h2 class="title-text">Club Lógico</h2>
            <p class="subtitle-text">Área de Descanso y Estrategia</p>
          </div>
        </div>
        <button @click="emit('close')" class="btn-close-hub shadow-sm">
          <CloseIcon :size="24" />
        </button>
      </header>

      <div class="view-paginator w-full">
        <div class="grid-games w-full overflow-y-auto no-scrollbar pb-4">
          
          <button v-for="game in recreationGames" :key="game.id" @click="attemptOpenGame(game)"
            :class="['game-card group w-full mx-auto relative transition-all duration-200', game.isVolando ? 'opacity-85 cursor-default' : 'active:translate-y-1 active:border-b-0 cursor-pointer']">
            
            <div class="card-inner relative w-full overflow-hidden flex items-center justify-between">
              <div class="flex items-center gap-3 w-full">
                <div :class="`icon-box ${game.color} shadow-inner`">
                  <component :is="game.icon" :size="24" class="text-white" stroke-width="2.5" />
                </div>
                <div class="text-left flex-1 min-w-0 pr-16">
                  <h3 class="game-name truncate" :class="{'text-slate-400': game.isVolando}">{{ game.name }}</h3>
                  <p class="game-desc truncate" :class="{'text-slate-300': game.isVolando}">{{ game.desc }}</p>
                </div>
              </div>

              <div class="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-end">
                <div v-if="game.isVolando" class="flex flex-col items-center justify-center w-16 group-active:animate-bounce">
                  <span class="text-2xl sm:text-3xl">🦉</span>
                  <span class="text-[7px] sm:text-[8px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full mt-1 shadow-sm leading-none text-center">VOLANDO</span>
                </div>
                <div v-else class="flex items-center gap-1.5 bg-orange-50 border-2 border-orange-200 px-3 py-1.5 rounded-xl shadow-sm">
                  <span class="font-black text-orange-700 text-sm">{{ game.cost }}</span>
                  <div class="w-5 h-5 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 border-2 border-orange-800 shadow-inner flex items-center justify-center">
                    <span class="text-[9px] text-orange-900 font-black">C</span>
                  </div>
                </div>
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showTicketModal" class="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div class="relative w-full max-w-sm flex flex-col items-center transition-transform" :class="{'animate-pulse-fast': isProcessingPayment}">
          
          <div class="w-20 h-20 bg-rose-100 rounded-full border-4 border-rose-300 flex items-center justify-center mb-[-2rem] z-10 shadow-lg">
            <span class="text-4xl">🦉</span>
          </div>

          <div class="bg-white w-full rounded-t-3xl rounded-b-lg shadow-2xl relative overflow-hidden border-2 border-slate-200 flex flex-col pt-10">
            <div class="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 bg-slate-900/80 rounded-full"></div>
            <div class="absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-8 bg-slate-900/80 rounded-full"></div>
            <div class="absolute top-1/2 left-0 w-full border-t-4 border-dashed border-slate-200"></div>

            <div class="px-6 pb-6 text-center z-10 bg-white">
              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Mesa Reservada</h3>
              <h2 class="text-3xl font-black text-rose-600 uppercase tracking-tighter">{{ selectedGame?.name }}</h2>
              <div class="flex items-center justify-center gap-2 mt-3">
                 <component :is="selectedGame?.icon" :size="20" class="text-rose-400" />
                 <span class="text-sm font-bold text-slate-500 uppercase">{{ selectedGame?.desc }}</span>
              </div>
            </div>

            <div v-if="!selectedMode" class="px-6 pt-6 pb-6 bg-slate-50 flex flex-col gap-3">
              <p class="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selecciona el Modo de Juego</p>
              
              <button v-for="modeId in selectedGame.modes" :key="modeId" @click="selectMode(modeId)"
                class="w-full py-3 bg-white border-2 border-slate-200 hover:border-rose-400 rounded-xl font-bold text-slate-600 flex items-center gap-3 px-4 transition-colors shadow-sm active:scale-95">
                <div class="bg-slate-100 p-2 rounded-lg"><component :is="MODE_LABELS[modeId].icon" :size="18" class="text-slate-500"/></div>
                <span class="uppercase text-sm">{{ MODE_LABELS[modeId].text }}</span>
              </button>

              <button @click="closeTicketModal" class="mt-2 w-full py-2 bg-transparent text-slate-400 hover:text-slate-600 rounded-xl font-bold text-sm transition-all uppercase">
                Cancelar
              </button>
            </div>

            <div v-else class="px-6 pt-8 pb-6 text-center z-10 bg-slate-50 flex flex-col gap-4">
              
              <div v-if="!paymentError" class="flex flex-col items-center justify-center w-full">
                <div class="w-full bg-white p-3 rounded-xl border border-slate-200 shadow-inner mb-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-slate-400 uppercase">Fondo Base:</span>
                    <span class="text-sm font-black text-slate-700">{{ gamificationStore.totalWealthInCopper }} 🥉</span>
                  </div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-slate-400 uppercase">Costo Entrada:</span>
                    <span class="text-sm font-black text-rose-500">- {{ selectedGame?.cost }} 🥉</span>
                  </div>
                  <div class="w-full border-t-2 border-dashed border-slate-200 my-2"></div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-black text-slate-500 uppercase">Saldo Final:</span>
                    <span class="text-base font-black text-green-600">{{ gamificationStore.totalWealthInCopper - selectedGame?.cost }} 🥉</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 mb-2 text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                   <component :is="MODE_LABELS[selectedMode].icon" :size="14" />
                   <span class="text-[10px] font-black uppercase">{{ MODE_LABELS[selectedMode].text }}</span>
                </div>
              </div>

              <div v-else class="flex flex-col items-center justify-center bg-red-50 p-4 rounded-2xl border-2 border-red-200">
                <AlertTriangle class="text-red-500 mb-2" :size="28" />
                <span class="text-sm font-black text-red-700 uppercase leading-tight">Fondos Insuficientes</span>
                <p class="text-xs font-bold text-red-500 mt-1">Te faltan {{ selectedGame?.cost - gamificationStore.totalWealthInCopper }} monedas de cobre.</p>
              </div>

              <div class="flex flex-col gap-2 mt-2">
                <button v-if="!paymentError" @click="buyTicketAndPlay" :disabled="isProcessingPayment" class="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase">
                  <Ticket v-if="!isProcessingPayment" :size="20" />
                  {{ isProcessingPayment ? 'SELLANDO...' : 'PAGAR Y ENTRAR' }}
                </button>

                <button v-else @click="handleNeedCoins" class="w-full py-4 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 transition-all flex items-center justify-center gap-2 uppercase animate-pulse">
                  <Zap :size="20" fill="currentColor" /> ¡Ir a ganar cobre!
                </button>

                <button v-if="!paymentError && selectedGame.modes.length > 1" @click="selectedMode = null" :disabled="isProcessingPayment" class="w-full py-2 bg-transparent text-slate-400 hover:text-slate-600 rounded-xl font-bold text-xs transition-all uppercase">
                  Cambiar Modo
                </button>
                <button v-else @click="closeTicketModal" :disabled="isProcessingPayment" class="w-full py-2 bg-transparent text-slate-400 hover:text-slate-600 rounded-xl font-bold text-xs transition-all uppercase">
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.master-hub { position: fixed; inset: 0; z-index: 150; background-color: #f1f5f9; display: flex; justify-content: center; align-items: center; overflow: hidden; touch-action: none !important; }
.hub-canvas { display: grid; grid-template-rows: auto 1fr; position: relative; overflow: hidden; background: linear-gradient(to bottom right, #be123c, #fb7185); padding: 1.25rem; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; touch-action: none !important; width: 100vw; height: 100dvh; }

@media (min-width: 600px) and (max-width: 1024px) { .hub-canvas { width: 85vw; height: 92dvh; border-radius: 35px; padding: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.1); } }
@media (min-width: 1025px) { .hub-canvas { width: 1024px; height: 90dvh; border-radius: 45px; padding: 2.5rem; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.15);} }

.header-hub { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.title-text { font-size: clamp(1.4rem, 5vw, 2.2rem); font-weight: 900; color: white; text-transform: uppercase; line-height: 1; letter-spacing: -0.02em; }
.subtitle-text { color: #ffe4e6; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
.view-paginator { display: flex; flex-direction: column; height: 100%; width: 100%; overflow: hidden; }
.grid-games { display: flex; flex-direction: column; align-items: stretch; width: 100%; gap: 0.85rem; }
.game-card { background: white; border-radius: 1.5rem; padding: 0.25rem; border-bottom: 5px solid #e2e8f0; width: 100%; flex: none; min-height: 90px; }
.card-inner { background: #f8fafc; border-radius: 1.25rem; padding: 0.85rem 1rem; height: 100%; }
.icon-box { width: 3.5rem; height: 3.5rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.2); }
.game-name { font-size: 1.1rem; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: -0.02em; }
.game-desc { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.btn-close-hub { background: rgba(255, 255, 255, 0.2); padding: 0.75rem; border-radius: 9999px; color: white; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(4px); }
.btn-close-hub:active { transform: scale(0.9); background: rgba(255, 255, 255, 0.3); }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.animate-pulse-fast { animation: pulseFast 0.5s infinite; }
@keyframes pulseFast { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.98); } }
</style>