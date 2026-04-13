<script setup>
/** * ARCHIVO: GameMastermind.vue
 * NOTA INTERNA: CÓDIGO SECRETO (MASTERMIND) v1.4
 * LÓGICA: Restaurados 10 INTENTOS. Modal de Reglas añadido. Cobro exacto (15 cobres) verificado.
 * VISUAL: Flexbox ajustado (min-h-0 y max-h) para HUD fluido.
 */
import { ref, onMounted, computed } from 'vue';
import { X as CloseIcon, User, Cpu, RotateCcw, Trophy, Frown, Lightbulb, Check, Lock, Info } from 'lucide-vue-next';
import { useGamificationStore } from '@/stores/useGamificationStore';

const emit = defineEmits(['close']);
const gamificationStore = useGamificationStore();

// ⚙️ PROPS
const props = defineProps({ 
  gameMode: { type: String, default: 'vs-pc' }, 
  allowLandscape: { type: Boolean, default: true } 
});

// ==========================================
// 🎵 MOTOR DE AUDIO MAESTRO
// ==========================================
const sndSelect = new Audio('/audios/select.mp3');
const sndMove = new Audio('/audios/move.mp3');
const sndSpecial = new Audio('/audios/win-jingle-soft.mp3'); 

const playSound = (audioElement) => {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(() => {});
};

// ==========================================
// 🧠 ESTADO GLOBAL DEL JUEGO
// ==========================================
const COLORS = [
  'bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 
  'bg-amber-400', 'bg-purple-500', 'bg-orange-500'
];

const secretCode = ref([]);
const board = ref([]); 
const currentRow = ref(0);
const selectedColor = ref(COLORS[0]);

const moveError = ref(false); 
const gameResult = ref(null);
const winReason = ref('');

const showRules = ref(false); // 🌟 ESTADO PARA EL MODAL DE REGLAS

// ==========================================
// 🧩 LÓGICA DE INICIALIZACIÓN
// ==========================================
const initGame = () => {
  secretCode.value = [];
  for (let i = 0; i < 4; i++) {
    secretCode.value.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
  }

  // Limpiar tablero (10 intentos estándar)
  board.value = [];
  for (let i = 0; i < 10; i++) {
    board.value.push({
      guess: [null, null, null, null],
      feedback: [null, null, null, null] 
    });
  }

  currentRow.value = 0;
  gameResult.value = null;
  winReason.value = '';
};

onMounted(() => { initGame(); });

// 🌟 COBRO POR REINICIAR (15 COBRES)
const handleReplayClick = async () => {
  if (gamificationStore.totalWealthInCopper >= 15) {
    const success = await gamificationStore.payRecreationEntry(15);
    if (success) {
      playSound(sndSpecial); 
      initGame();
    }
  } else {
    gamificationStore.bubbleMessage = "¡No tienes 15 monedas de cobre para jugar otra vez!";
    emit('close'); 
  }
};

// ==========================================
// 🕹️ FÍSICA DE INTERACCIÓN Y ALGORITMO
// ==========================================
const triggerError = () => {
  moveError.value = true;
  setTimeout(() => moveError.value = false, 300);
};

const handleColorPick = (color) => {
  selectedColor.value = color;
  playSound(sndSelect);
};

const handleSlotClick = (rIdx, cIdx) => {
  if (gameResult.value || rIdx !== currentRow.value) return;

  board.value[rIdx].guess[cIdx] = selectedColor.value;
  playSound(sndMove);
};

const canCheckRow = computed(() => {
  if (!board.value[currentRow.value]) return false;
  return board.value[currentRow.value].guess.every(slot => slot !== null);
});

const checkCurrentRow = () => {
  if (!canCheckRow.value) {
    triggerError();
    return;
  }

  const guess = [...board.value[currentRow.value].guess];
  const secret = [...secretCode.value];
  
  let exactMatches = 0;
  let colorMatches = 0;

  // Paso 1: Buscar Exactos
  for (let i = 0; i < 4; i++) {
    if (guess[i] === secret[i]) {
      exactMatches++;
      guess[i] = null; 
      secret[i] = null;
    }
  }

  // Paso 2: Buscar Colores (descartando los ya contados como exactos)
  for (let i = 0; i < 4; i++) {
    if (guess[i] !== null) {
      const matchIdx = secret.indexOf(guess[i]);
      if (matchIdx !== -1) {
        colorMatches++;
        secret[matchIdx] = null; 
      }
    }
  }

  let feedbackArr = [];
  for (let i = 0; i < exactMatches; i++) feedbackArr.push('exact');
  for (let i = 0; i < colorMatches; i++) feedbackArr.push('color');
  while (feedbackArr.length < 4) feedbackArr.push(null);

  board.value[currentRow.value].feedback = feedbackArr;
  playSound(sndSpecial);

  if (exactMatches === 4) {
    gameResult.value = 'win';
    winReason.value = `¡Código descifrado en ${currentRow.value + 1} intentos!`;
  } else if (currentRow.value === 9) { 
    gameResult.value = 'lose';
    winReason.value = `Bóveda bloqueada. Código no descubierto.`;
  } else {
    currentRow.value++;
  }
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas font-inter">
      
      <header class="header-standard shrink-0">
        <div class="flex items-center gap-3">
          <div class="bg-purple-600 p-2 rounded-xl shadow-[0_3px_0_rgb(88,28,135)]">
            <Lightbulb class="text-white" :size="24" stroke-width="2.5" />
          </div>
          <div>
            <h2 class="game-title !text-purple-800">Código Secreto</h2>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Lógica Deductiva</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showRules = true" class="bg-purple-50 p-2 rounded-full hover:bg-purple-100 transition-colors text-purple-600 border border-purple-200" title="Ver Reglas">
            <Info :size="24" stroke-width="2.5" />
          </button>
          <button @click="emit('close')" class="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
            <CloseIcon :size="24" stroke-width="2.5" />
          </button>
        </div>
      </header>

      <div :class="[
        'flex-1 flex flex-col items-center justify-between w-full px-4 py-3 gap-3 overflow-hidden relative',
        props.allowLandscape ? 'landscape:flex-row landscape:justify-around landscape:gap-6' : ''
      ]">
        
        <div :class="[
          'w-full max-w-sm flex flex-col justify-end px-2 shrink-0 gap-2',
          props.allowLandscape ? 'landscape:w-1/4 landscape:items-center landscape:justify-center landscape:h-full' : ''
        ]">
          <div class="flex items-center gap-2 bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-200 w-full landscape:flex-col landscape:text-center">
            <div class="bg-slate-100 p-1.5 sm:p-2 rounded-xl border border-slate-300"><Cpu class="text-purple-600" :size="18"/></div>
            <div class="flex-1">
              <span class="block text-slate-700 font-black text-xs sm:text-sm uppercase leading-none mb-0.5">Búho Bot</span>
              <span class="block text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest">Creador del Código</span>
            </div>
          </div>

          <div class="bg-slate-800 p-2.5 sm:p-3 rounded-2xl border-2 border-slate-700 shadow-inner w-full flex items-center justify-between">
            <Lock v-if="!gameResult" class="text-slate-500 ml-2" :size="18" />
            <Trophy v-else class="text-yellow-400 ml-2" :size="18" />
            
            <div class="flex gap-2">
              <div v-for="(color, idx) in secretCode" :key="'sec'+idx" 
                   class="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-inner bg-slate-900 flex items-center justify-center">
                <div v-if="gameResult" :class="['w-full h-full rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),_2px_2px_4px_rgba(0,0,0,0.4)]', color]"></div>
                <div v-else class="text-slate-600 font-black text-sm sm:text-lg">?</div>
              </div>
            </div>
          </div>
        </div>

        <div :class="[
          'game-chassis shadow-2xl flex-1 min-h-0 max-h-[46vh] sm:max-h-[55vh] w-full max-w-sm flex flex-col',
          props.allowLandscape ? 'landscape:w-2/4 landscape:h-[90%] landscape:max-w-none' : ''
        ]">
          <div class="chassis-inner-shadow flex flex-col p-2 sm:p-3 gap-1.5 overflow-y-auto no-scrollbar h-full bg-slate-800">
            
            <div v-for="(row, rIdx) in board" :key="'r'+rIdx" 
                 :class="[
                   'flex items-center justify-between p-1.5 sm:p-2 rounded-xl transition-colors shrink-0',
                   currentRow === rIdx ? 'bg-slate-700/80 ring-1 ring-purple-500/50' : 'bg-slate-800/50',
                   moveError && currentRow === rIdx ? 'animate-shake' : ''
                 ]">
              
              <div class="flex-1 flex justify-evenly pr-2 sm:pr-6">
                <div v-for="(slotColor, cIdx) in row.guess" :key="'c'+cIdx" 
                     @click="handleSlotClick(rIdx, cIdx)"
                     :class="[
                       'w-7 h-7 sm:w-9 sm:h-9 rounded-full shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)] bg-slate-900 flex items-center justify-center transition-all',
                       currentRow === rIdx ? 'cursor-pointer hover:bg-slate-950' : 'opacity-70 cursor-not-allowed'
                     ]">
                  <div v-if="slotColor" :class="[
                    'w-[90%] h-[90%] rounded-full transition-all duration-200',
                    'shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.4),_inset_2px_2px_4px_rgba(255,255,255,0.4),_2px_4px_5px_rgba(0,0,0,0.5)]',
                    slotColor
                  ]"></div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-1 w-7 h-7 sm:w-9 sm:h-9 p-1 rounded-lg bg-slate-900/50 shadow-inner border border-slate-700/50 shrink-0">
                <div v-for="(feedback, fIdx) in row.feedback" :key="'f'+fIdx" 
                     class="w-full h-full rounded-full shadow-inner bg-slate-950 flex items-center justify-center">
                  <div v-if="feedback === 'exact'" class="w-[80%] h-[80%] rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]"></div>
                  <div v-if="feedback === 'color'" class="w-[80%] h-[80%] rounded-full bg-slate-100 shadow-[0_0_4px_rgba(255,255,255,0.6)]"></div>
                </div>
              </div>

            </div>

          </div>
        </div>

        <div :class="[
          'w-full max-w-sm flex flex-col px-2 shrink-0 gap-3',
          props.allowLandscape ? 'landscape:w-1/4 landscape:items-center landscape:justify-center landscape:h-full' : ''
        ]">
          
          <div class="bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-200 w-full flex flex-col gap-2">
            <span class="text-center text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Paleta de Hackeo</span>
            <div class="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              <button v-for="color in COLORS" :key="color" 
                      @click="handleColorPick(color)"
                      :class="[
                        'w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200 focus:outline-none',
                        'shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),_inset_2px_2px_4px_rgba(255,255,255,0.3),_0_4px_6px_rgba(0,0,0,0.2)]',
                        color,
                        selectedColor === color ? 'scale-110 ring-4 ring-purple-300 ring-offset-1 sm:ring-offset-2' : 'hover:scale-105'
                      ]">
              </button>
            </div>
            
            <button @click="checkCurrentRow" 
                    :disabled="!canCheckRow || gameResult"
                    :class="[
                      'w-full py-2.5 mt-1 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 uppercase',
                      canCheckRow && !gameResult ? 'bg-purple-600 text-white shadow-[0_4px_0_rgb(88,28,135)] active:translate-y-1 active:shadow-none' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    ]">
              <Check :size="18" stroke-width="3" /> Hackear Fila
            </button>
          </div>

          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                <User class="text-slate-600" :size="20" />
              </div>
              <span class="block text-slate-700 font-black text-sm uppercase leading-none">Tú</span>
            </div>
            <button @click="handleReplayClick" class="p-2.5 rounded-lg bg-slate-200 text-slate-500 hover:text-purple-600 hover:bg-slate-300 transition-colors" title="Pagar 15 cobres y Reiniciar">
              <RotateCcw :size="20" stroke-width="2.5" />
            </button>
          </div>
        </div>

        <Transition name="bubble-pop">
          <div v-if="showRules" class="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-purple-400 bg-white flex flex-col items-center gap-4 relative">
              <div class="w-16 h-16 rounded-full border-4 border-white bg-purple-100 text-purple-600 flex items-center justify-center -mt-12 shadow-lg">
                <Info :size="32" stroke-width="2.5" />
              </div>
              <h3 class="text-2xl font-black uppercase tracking-tighter leading-none text-purple-800">Reglas del Juego</h3>
              <div class="text-slate-600 text-sm font-medium space-y-3 text-left w-full">
                <p><strong>🎯 Objetivo:</strong> Adivinar el código secreto de 4 colores exactos (ubicación y color) en 10 intentos.</p>
                <p><strong>🕹️ Controles:</strong> Elige un color de tu "Paleta de Hackeo" y toca los agujeros vacíos en tu fila actual. Luego, presiona "Hackear Fila".</p>
                <p><strong>🧠 Pistas del Bot:</strong> Por cada fila evaluada, el Bot te dará un feedback a la derecha:<br>
                🔴 <strong>Rojo:</strong> Tienes un color correcto en la posición correcta.<br>
                ⚪ <strong>Blanco:</strong> Tienes un color correcto, pero en una posición equivocada.</p>
              </div>
              <button @click="showRules = false" class="w-full py-3 mt-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-lg transition-all uppercase shadow-[0_4px_0_rgb(88,28,135)] active:translate-y-1 active:shadow-none">
                ¡Entendido!
              </button>
            </div>
          </div>
        </Transition>

        <Transition name="bubble-pop">
          <div v-if="gameResult" class="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div :class="[
              'w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 text-center flex flex-col items-center gap-4',
              gameResult === 'win' ? 'bg-white border-green-400' : 'bg-slate-50 border-rose-400'
            ]">
              <div :class="[
                'w-20 h-20 rounded-full border-4 flex items-center justify-center -mt-12 shadow-lg',
                gameResult === 'win' ? 'bg-yellow-400 border-white text-yellow-900' : 'bg-rose-100 border-white text-rose-500'
              ]">
                <Trophy v-if="gameResult === 'win'" :size="40" stroke-width="2.5" />
                <Frown v-else :size="40" stroke-width="2.5" />
              </div>

              <div>
                <h3 :class="[
                  'text-3xl font-black uppercase tracking-tighter leading-none',
                  gameResult === 'win' ? 'text-green-600' : 'text-rose-500'
                ]">
                  {{ gameResult === 'win' ? '¡Desbloqueado!' : '¡Bloqueado!' }}
                </h3>
                <p class="text-sm font-bold mt-2 text-slate-500">{{ winReason }}</p>
              </div>

              <div class="w-full flex flex-col gap-2 mt-2">
                <button @click="handleReplayClick" :class="[
                  'w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 uppercase',
                  gameResult === 'win' ? 'bg-green-500 text-white shadow-[0_4px_0_rgb(22,163,74)]' : 'bg-rose-500 text-white shadow-[0_4px_0_rgb(159,18,57)]'
                ]">
                  <RotateCcw :size="20" stroke-width="2.5" /> Otra Vez (15 🥉)
                </button>
                <button @click="emit('close')" class="w-full py-3 bg-transparent rounded-xl font-bold text-sm uppercase text-slate-400 hover:text-slate-700 transition-colors">
                  Salir al Club
                </button>
              </div>
            </div>
          </div>
        </Transition>

      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
.font-inter { font-family: 'Inter', sans-serif; }

.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; -webkit-tap-highlight-color: transparent; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); width: 100vw; height: 100dvh; overflow-y: auto; overflow-x: hidden; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 8px solid white; padding: 0; overflow: hidden; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; max-width: 900px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: white; border-bottom: 2px solid #f1f5f9; }
.game-title { font-size: clamp(1.2rem, 4vw, 1.8rem); font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }

.game-chassis {
  background: linear-gradient(145deg, #1e293b, #0f172a); 
  border-radius: 16px; 
  border-bottom: 8px solid #020617; border-right: 4px solid #020617; border-top: 2px solid #334155; border-left: 2px solid #334155;
}

.chassis-inner-shadow { 
  width: 100%; height: 100%; border-radius: 8px; 
  box-shadow: inset 0px 8px 20px rgba(0,0,0,0.8); 
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>