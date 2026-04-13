<script setup>
/** * ARCHIVO: GameTemplateBase.vue
 * NOTA INTERNA: BOILERPLATE MAESTRO PARA JUEGOS DEL CLUB LÓGICO
 * LÓGICA: UX Bidireccional Sensorial, Motor de Audio, IA Base 50/50, y Adaptabilidad (Portrait/Landscape).
 * INSTRUCCIONES: Copiar, pegar y rellenar solo la lógica matemática del juego.
 */
import { ref } from 'vue';
import { X as CloseIcon, User, Cpu, RotateCcw, Trophy, Frown, Handshake, Gamepad2 } from 'lucide-vue-next';

const emit = defineEmits(['close']);

// ⚙️ PROPS: Configuración base que inyecta App.vue
const props = defineProps({ 
  gameMode: { type: String, default: 'vs-pc' }, // 'solo', 'vs-pc', 'local', 'online'
  allowLandscape: { type: Boolean, default: false } // 🕹️ INTERRUPTOR DE ROTACIÓN
});

// ==========================================
// 🎵 1. MOTOR DE AUDIO MAESTRO (NO TOCAR)
// ==========================================
const sndSelect = new Audio('/audios/select.mp3');
const sndMove = new Audio('/audios/move.mp3');
const sndCapture = new Audio('/audios/capture.mp3');
const sndSpecial = new Audio('/audios/king.mp3'); 

const playSound = (audioElement) => {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(() => {});
};

// ==========================================
// 🧠 2. ESTADO GLOBAL DEL JUEGO
// ==========================================
const playerTurn = ref('player'); // 'player' o 'bot'
const selectedItem = ref(null); 
const moveError = ref(false); 
const gameResult = ref(null); // 'win', 'lose', 'draw', null
const winReason = ref('');

// 🧩 AQUÍ IRÁ EL ESTADO DEL JUEGO ESPECÍFICO (Matrices, Arrays, Puntos)
const board = ref([]); 

// ==========================================
// 🕹️ 3. FÍSICA DE INTERACCIÓN (UX FLUÍDA)
// ==========================================
const handleItemClick = (item) => {
  if (playerTurn.value !== 'player' || gameResult.value) return; 

  moveError.value = false;

  if (selectedItem.value) {
    // A. Deselección (Tocó el mismo elemento)
    if (selectedItem.value.id === item.id) {
      selectedItem.value = null;
      return;
    }

    // B. Cambio Fluido (Tocó otro elemento de su propiedad)
    if (item.owner === 'player') {
      selectedItem.value = item;
      playSound(sndSelect);
      return;
    }
    
    // C. Ejecución de la Acción
    const success = attemptAction(selectedItem.value, item); 
    
    if (success) {
      playSound(sndMove); // o sndCapture
      selectedItem.value = null;
      
      if (!checkGameState() && props.gameMode === 'vs-pc') {
        playerTurn.value = 'bot';
        setTimeout(simulateComputerMove, 400); 
      }
    } else {
      triggerError();
    }
  } else {
    // D. Primera Selección
    if (item.owner === 'player') {
      selectedItem.value = item;
      playSound(sndSelect);
    }
  }
};

const triggerError = () => {
  moveError.value = true;
  setTimeout(() => moveError.value = false, 300);
};

// ==========================================
// 🤖 4. CEREBRO ARTIFICIAL (IA 50/50 + UX BIDIRECCIONAL)
// ==========================================
const simulateComputerMove = () => {
  if (gameResult.value || props.gameMode !== 'vs-pc') return;

  // 1. Obtener jugada del algoritmo
  const chosenAction = { from: {}, to: {} }; // Reemplazar con IA real

  // 2. Feedback Visual: El Bot selecciona y brilla
  selectedItem.value = chosenAction.from;
  playSound(sndSelect);

  // 3. Pausa Táctica
  setTimeout(() => {
    // 4. Ejecución del Bot
    const actionResult = executeBotAction(chosenAction); 
    playSound(sndMove); // o sndCapture

    // 5. Aterrizaje y Apagado
    selectedItem.value = chosenAction.to;

    setTimeout(() => {
      selectedItem.value = null;
      if (!checkGameState()) {
        playerTurn.value = 'player'; 
      }
    }, 400);

  }, 700); 
};

// ==========================================
// 🎯 5. UTILIDADES, LÓGICA Y EVALUACIÓN
// ==========================================
const attemptAction = (from, to) => { return true; }; // Reemplazar
const executeBotAction = (action) => { return true; }; // Reemplazar

const checkGameState = () => {
  // Lógica para asignar gameResult.value ('win', 'lose', 'draw')
  return false; 
};

const resetBoard = () => {
  board.value = []; // Reset específico
  selectedItem.value = null;
  playerTurn.value = 'player';
  gameResult.value = null;
  winReason.value = '';
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas font-inter">
      
      <header class="header-standard shrink-0">
        <div class="flex items-center gap-3">
          <div class="bg-rose-500 p-2 rounded-xl shadow-[0_3px_0_rgb(159,18,57)]">
            <Gamepad2 class="text-white" :size="24" stroke-width="2.5" />
          </div>
          <div>
            <h2 class="game-title !text-rose-600">NOMBRE DEL JUEGO</h2>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
              {{ props.gameMode === 'vs-pc' ? 'Vs. Computadora' : 'Modo Solitario' }}
            </p>
          </div>
        </div>
        <button @click="emit('close')" class="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
          <CloseIcon :size="24" stroke-width="2.5" />
        </button>
      </header>

      <div :class="[
        'flex-1 flex flex-col items-center justify-center w-full px-4 gap-6 overflow-hidden relative',
        props.allowLandscape ? 'landscape:flex-row landscape:justify-around' : ''
      ]">
        
        <div v-if="props.gameMode === 'vs-pc'" :class="[
          'w-full max-w-sm flex justify-between items-end px-2',
          props.allowLandscape ? 'landscape:w-1/4 landscape:flex-col landscape:items-center landscape:gap-4' : ''
        ]">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-lg bg-slate-200 border-2 border-slate-300 flex items-center justify-center shadow-sm">
              <Cpu class="text-rose-500" :size="20" />
            </div>
            <div :class="props.allowLandscape ? 'landscape:text-center' : ''">
              <span class="block text-slate-700 font-black text-sm uppercase">Búho Bot</span>
              <span class="block text-slate-400 font-bold text-[10px] uppercase">Nivel Medio</span>
            </div>
          </div>
          <div v-if="playerTurn === 'bot' && !gameResult" class="flex gap-1 animate-pulse mb-2">
            <span class="w-2 h-2 bg-rose-500 rounded-full"></span>
            <span class="w-2 h-2 bg-rose-500 rounded-full delay-75"></span>
            <span class="w-2 h-2 bg-rose-500 rounded-full delay-150"></span>
          </div>
        </div>

        <div :class="[
          'game-chassis shadow-2xl',
          props.allowLandscape ? 'landscape:w-2/4 landscape:h-[90%] landscape:max-w-none' : ''
        ]">
          <div class="chassis-inner-shadow flex items-center justify-center text-slate-500 font-black p-4">
            
            [ ZONA DE JUEGO 2.5D CSS ]
            
          </div>
        </div>

        <div :class="[
          'w-full max-w-sm flex justify-between items-start px-2',
          props.allowLandscape ? 'landscape:w-1/4 landscape:flex-col-reverse landscape:items-center landscape:gap-4' : ''
        ]">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
              <User class="text-slate-600" :size="20" />
            </div>
            <div :class="props.allowLandscape ? 'landscape:text-center' : ''">
              <span class="block text-slate-700 font-black text-sm uppercase">Tú</span>
              <span class="block text-slate-400 font-bold text-[10px] uppercase">Jugador 1</span>
            </div>
          </div>
          <button @click="resetBoard" class="p-2 rounded-lg bg-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-300 transition-colors" title="Reiniciar Partida">
            <RotateCcw :size="20" stroke-width="2.5" />
          </button>
        </div>

        <Transition name="bubble-pop">
          <div v-if="gameResult" class="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div :class="[
              'w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 text-center flex flex-col items-center gap-4',
              gameResult === 'win' ? 'bg-white border-green-400' : 
              gameResult === 'lose' ? 'bg-slate-50 border-rose-400' : 'bg-slate-100 border-blue-400'
            ]">
              <div :class="[
                'w-20 h-20 rounded-full border-4 flex items-center justify-center -mt-12 shadow-lg',
                gameResult === 'win' ? 'bg-yellow-400 border-white text-yellow-900' : 
                gameResult === 'lose' ? 'bg-rose-100 border-white text-rose-500' : 'bg-blue-100 border-white text-blue-600'
              ]">
                <Trophy v-if="gameResult === 'win'" :size="40" stroke-width="2.5" />
                <Frown v-else-if="gameResult === 'lose'" :size="40" stroke-width="2.5" />
                <Handshake v-else :size="40" stroke-width="2.5" />
              </div>

              <div>
                <h3 :class="[
                  'text-3xl font-black uppercase tracking-tighter leading-none',
                  gameResult === 'win' ? 'text-green-600' : 
                  gameResult === 'lose' ? 'text-rose-500' : 'text-blue-600'
                ]">
                  {{ gameResult === 'win' ? '¡Victoria!' : gameResult === 'lose' ? '¡Derrota!' : '¡Empate!' }}
                </h3>
                <p class="text-sm font-bold mt-2 text-slate-500">{{ winReason }}</p>
              </div>

              <div class="w-full flex flex-col gap-2 mt-2">
                <button @click="resetBoard" :class="[
                  'w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 uppercase',
                  gameResult === 'win' ? 'bg-green-500 text-white shadow-[0_4px_0_rgb(22,163,74)] active:translate-y-1 active:shadow-none' : 
                  gameResult === 'lose' ? 'bg-rose-500 text-white shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none' : 
                  'bg-blue-500 text-white shadow-[0_4px_0_rgb(37,99,235)] active:translate-y-1 active:shadow-none'
                ]">
                  <RotateCcw :size="20" stroke-width="2.5" /> Jugar Revancha
                </button>
                <button @click="emit('close')" class="w-full py-3 bg-transparent rounded-xl font-bold text-sm uppercase transition-colors text-slate-400 hover:text-slate-700">
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

/* ==========================================
   🛡️ ESTÁNDARES GLOBALES MAESTROS
========================================== */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; }

.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; -webkit-tap-highlight-color: transparent; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); width: 100vw; height: 100dvh; overflow-y: auto; overflow-x: hidden; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 8px solid white; padding: 0; overflow: hidden; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: white; border-bottom: 2px solid #f1f5f9; }
.game-title { font-size: clamp(1.2rem, 4vw, 1.8rem); font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }

/* ==========================================
   🎮 CHASIS BASE PARA JUEGOS
========================================== */
.game-chassis {
  width: 96%; max-width: 400px; aspect-ratio: 1/1; /* Modificar aspect-ratio según juego */
  background: linear-gradient(145deg, #e2e8f0, #cbd5e1); /* Ajustar colores */
  border-radius: 12px; padding: 10px; 
  border-bottom: 8px solid #94a3b8; border-right: 4px solid #94a3b8; 
  border-top: 2px solid #f8fafc; border-left: 2px solid #f8fafc;
}

.chassis-inner-shadow {
  width: 100%; height: 100%; border-radius: 4px;
  box-shadow: inset 4px 4px 10px rgba(0,0,0,0.1), inset -2px -2px 5px rgba(255,255,255,0.8); 
  overflow: hidden;
}

/* ==========================================
   ✨ EFECTOS SENSORIALES REUTILIZABLES
========================================== */
.animate-glow { animation: glow-pulse 1s infinite alternate; filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)); }
@keyframes glow-pulse { 0% { filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5)); } 100% { filter: drop-shadow(0 0 15px rgba(251, 191, 36, 1)); } }

.animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>