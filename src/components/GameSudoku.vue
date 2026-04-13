<script setup>
/** * ARCHIVO: GameSudoku.vue
 * NOTA INTERNA: SUDOKU v1.2 - DETECCIÓN DE ERRORES BLINDADA
 * LÓGICA: Generador automático, Validación con Shake, Modal de Reglas.
 * VISUAL: Fix de CSS Jerárquico. Función getCellClass para garantizar el resaltado rojo.
 */
import { ref, onMounted } from 'vue';
import { X as CloseIcon, User, RotateCcw, Trophy, Grid3x3, Eraser, Info } from 'lucide-vue-next';
import { useGamificationStore } from '@/stores/useGamificationStore';

const emit = defineEmits(['close']);
const gamificationStore = useGamificationStore();

// ⚙️ PROPS
const props = defineProps({ 
  gameMode: { type: String, default: 'solo' }, 
  allowLandscape: { type: Boolean, default: true } 
});

// ==========================================
// 🎵 1. MOTOR DE AUDIO MAESTRO
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
// 🧠 2. ESTADO GLOBAL DEL JUEGO
// ==========================================
const board = ref([]); 
const solution = ref([]);
const selectedCell = ref(null); 
const gameResult = ref(null);
const winReason = ref('');
const moveErrorObj = ref(null); // 🌟 Controla qué celda tiembla

const showRules = ref(false); 

// ==========================================
// 🧩 3. INICIALIZACIÓN Y GENERADOR SUDOKU
// ==========================================
const generateSudoku = () => {
  let base = [
    [5,3,4,6,7,8,9,1,2], [6,7,2,1,9,5,3,4,8], [1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3], [4,2,6,8,5,3,7,9,1], [7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4], [2,8,7,4,1,9,6,3,5], [3,4,5,2,8,6,1,7,9]
  ];

  for (let b = 0; b < 3; b++) {
    for (let i = 0; i < 3; i++) {
      const r1 = b * 3 + Math.floor(Math.random() * 3);
      const r2 = b * 3 + Math.floor(Math.random() * 3);
      let temp = base[r1]; base[r1] = base[r2]; base[r2] = temp;
    }
  }

  for (let b = 0; b < 3; b++) {
    for (let i = 0; i < 3; i++) {
      const c1 = b * 3 + Math.floor(Math.random() * 3);
      const c2 = b * 3 + Math.floor(Math.random() * 3);
      for (let r = 0; r < 9; r++) {
        let temp = base[r][c1]; base[r][c1] = base[r][c2]; base[r][c2] = temp;
      }
    }
  }

  solution.value = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      solution.value.push(base[r][c]);
    }
  }

  board.value = solution.value.map(val => {
    const isHidden = Math.random() < 0.45; 
    return {
      val: isHidden ? null : val,
      isFixed: !isHidden,
      error: false
    };
  });
};

const initGame = () => {
  generateSudoku();
  selectedCell.value = null;
  gameResult.value = null;
  winReason.value = '';
  moveErrorObj.value = null;
};

onMounted(() => { initGame(); });

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
// 🕹️ 4. FÍSICA DE INTERACCIÓN
// ==========================================
const handleCellClick = (index) => {
  if (gameResult.value || board.value[index].isFixed) return;
  selectedCell.value = index;
  playSound(sndSelect);
};

const clearSelection = () => {
  selectedCell.value = null;
};

const handleNumberInput = (num) => {
  if (selectedCell.value === null || gameResult.value) return;

  const idx = selectedCell.value;
  board.value[idx].val = num;
  playSound(sndMove);

  const hasConflict = validateBoard(idx);
  
  if (hasConflict) {
    // 🌟 SENSORIAL: Tiembla si detecta error.
    moveErrorObj.value = idx;
    setTimeout(() => moveErrorObj.value = null, 400);
  }

  checkWinCondition();
};

const handleErase = () => {
  if (selectedCell.value === null || gameResult.value) return;
  board.value[selectedCell.value].val = null;
  board.value[selectedCell.value].error = false;
  playSound(sndSelect);
  validateBoard(); 
};

// ==========================================
// 🎯 5. ALGORITMO DE EVALUACIÓN
// ==========================================
const validateBoard = (changedIdx = null) => {
  board.value.forEach(cell => cell.error = false);
  let conflictFoundInChanged = false;

  for (let i = 0; i < 81; i++) {
    if (board.value[i].val === null) continue;

    const r1 = Math.floor(i / 9);
    const c1 = i % 9;
    const b1 = Math.floor(r1 / 3) * 3 + Math.floor(c1 / 3);

    for (let j = i + 1; j < 81; j++) {
      if (board.value[j].val === null) continue;
      
      if (board.value[i].val === board.value[j].val) {
        const r2 = Math.floor(j / 9);
        const c2 = j % 9;
        const b2 = Math.floor(r2 / 3) * 3 + Math.floor(c2 / 3);

        if (r1 === r2 || c1 === c2 || b1 === b2) {
          board.value[i].error = true;
          board.value[j].error = true;
          if (changedIdx === i || changedIdx === j) {
             conflictFoundInChanged = true;
          }
        }
      }
    }
  }
  return conflictFoundInChanged;
};

const checkWinCondition = () => {
  const isFull = board.value.every(cell => cell.val !== null);
  const hasErrors = board.value.some(cell => cell.error);

  if (isFull && !hasErrors) {
    gameResult.value = 'win';
    winReason.value = '¡Resolviste el Sudoku a la perfección!';
    playSound(sndSpecial);
    selectedCell.value = null;
  }
};

// --- 🎨 MOTOR DE DISEÑO VISUAL BLINDADO ---
const getBorderClasses = (index) => {
  const col = index % 9;
  const row = Math.floor(index / 9);
  let classes = '';
  if (col === 2 || col === 5) classes += ' border-r-[3px] border-r-teal-800';
  if (row === 2 || row === 5) classes += ' border-b-[3px] border-b-teal-800';
  return classes;
};

// 🌟 FIX CSS: Esta función garantiza que los colores NO se solapen.
const getCellClass = (cell, idx) => {
  let classes = [
    'flex items-center justify-center font-bold text-lg sm:text-xl transition-all duration-200 select-none border border-teal-700/50',
    getBorderClasses(idx)
  ];

  // 1. Color de Fondo y Texto
  if (cell.error) {
    classes.push('bg-rose-500 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'); // Rojo Intenso
  } else if (cell.isFixed) {
    classes.push('bg-slate-200 text-slate-800'); // Casillas Originales
  } else if (selectedCell.value === idx) {
    classes.push('bg-teal-100 text-teal-800 cursor-pointer'); // Seleccionada Vacía
  } else {
    classes.push('bg-white text-teal-700 cursor-pointer hover:bg-teal-50'); // Vacías
  }

  // 2. Anillo de Selección
  if (selectedCell.value === idx) {
    if (cell.error) {
      classes.push('ring-inset ring-4 ring-rose-800 z-10'); // Anillo rojo si hay error
    } else {
      classes.push('ring-inset ring-4 ring-teal-500 z-10'); // Anillo verde normal
    }
  }

  // 3. Físca de Error
  if (moveErrorObj.value === idx) {
    classes.push('animate-shake');
  }

  return classes.join(' ');
};
</script>

<template>
  <div class="master-container" @click="clearSelection">
    <main class="app-canvas font-inter" @click.stop>
      
      <header class="header-standard shrink-0">
        <div class="flex items-center gap-3">
          <div class="bg-teal-600 p-2 rounded-xl shadow-[0_3px_0_rgb(15,118,110)]">
            <Grid3x3 class="text-white" :size="24" stroke-width="2.5" />
          </div>
          <div>
            <h2 class="game-title !text-teal-800">Sudoku</h2>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Concentración Pura</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showRules = true" class="bg-teal-50 p-2 rounded-full hover:bg-teal-100 transition-colors text-teal-600 border border-teal-200" title="Ver Reglas">
            <Info :size="24" stroke-width="2.5" />
          </button>
          <button @click="emit('close')" class="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
            <CloseIcon :size="24" stroke-width="2.5" />
          </button>
        </div>
      </header>

      <div :class="[
        'flex-1 flex flex-col items-center justify-between w-full px-4 py-2 gap-2 overflow-hidden relative',
        props.allowLandscape ? 'landscape:flex-row landscape:justify-around landscape:gap-4' : ''
      ]">
        
        <div :class="[
          'game-chassis shadow-2xl flex-1 min-h-0 w-full max-w-sm aspect-square flex flex-col mt-2',
          props.allowLandscape ? 'landscape:w-2/4 landscape:h-[90%] landscape:aspect-square' : ''
        ]">
          <div class="chassis-inner-shadow grid grid-cols-9 bg-teal-900 border-4 border-teal-900">
            
            <div v-for="(cell, idx) in board" :key="'cell'+idx"
                 @click="handleCellClick(idx)"
                 :class="getCellClass(cell, idx)">
              {{ cell.val }}
            </div>

          </div>
        </div>

        <div :class="[
          'w-full max-w-sm flex flex-col px-2 shrink-0 gap-3 mb-2',
          props.allowLandscape ? 'landscape:w-1/4 landscape:items-center landscape:justify-center landscape:h-full' : ''
        ]">
          
          <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 w-full">
            <div class="grid grid-cols-5 gap-2">
              <button v-for="num in 9" :key="'num'+num"
                      @click="handleNumberInput(num)"
                      class="aspect-square bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-700 rounded-xl font-black text-xl shadow-[0_3px_0_rgb(203,213,225)] active:translate-y-1 active:shadow-none transition-all">
                {{ num }}
              </button>
              <button @click="handleErase"
                      class="aspect-square bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-xl font-black shadow-[0_3px_0_rgb(254,205,211)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
                <Eraser :size="20" stroke-width="2.5" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                <User class="text-slate-600" :size="20" />
              </div>
              <span class="block text-slate-700 font-black text-sm uppercase leading-none">Tú</span>
            </div>
            <button @click="handleReplayClick" class="p-3 rounded-lg bg-slate-200 text-slate-500 hover:text-teal-600 hover:bg-slate-300 transition-colors shadow-sm" title="Pagar 15 cobres y Reiniciar">
              <RotateCcw :size="20" stroke-width="2.5" />
            </button>
          </div>
        </div>

        <Transition name="bubble-pop">
          <div v-if="showRules" class="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-teal-400 bg-white flex flex-col items-center gap-4 relative">
              <div class="w-16 h-16 rounded-full border-4 border-white bg-teal-100 text-teal-600 flex items-center justify-center -mt-12 shadow-lg">
                <Info :size="32" stroke-width="2.5" />
              </div>
              <h3 class="text-2xl font-black uppercase tracking-tighter leading-none text-teal-800">Reglas del Juego</h3>
              <div class="text-slate-600 text-sm font-medium space-y-3 text-left w-full">
                <p><strong>🎯 Objetivo:</strong> Llenar todas las casillas vacías con números del 1 al 9.</p>
                <p><strong>⚠️ La Única Regla:</strong> Un número <strong>NO puede repetirse</strong> en la misma fila, en la misma columna, ni en el mismo bloque cuadrado grueso de 3x3.</p>
                <p><strong>🛡️ Asistente Activo:</strong> Si introduces un número repetido, el tablero temblará y las casillas en conflicto se pondrán <span class="text-rose-500 font-black">Rojas</span> para avisarte.</p>
              </div>
              <button @click="showRules = false" class="w-full py-3 mt-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-lg transition-all uppercase shadow-[0_4px_0_rgb(15,118,110)] active:translate-y-1 active:shadow-none">
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
              </div>

              <div>
                <h3 class="text-3xl font-black uppercase tracking-tighter leading-none text-green-600">
                  ¡Victoria!
                </h3>
                <p class="text-sm font-bold mt-2 text-slate-500">{{ winReason }}</p>
              </div>

              <div class="w-full flex flex-col gap-2 mt-2">
                <button @click="handleReplayClick" class="w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 uppercase bg-green-500 text-white shadow-[0_4px_0_rgb(22,163,74)]">
                  <RotateCcw :size="20" stroke-width="2.5" /> Otra Vez (15 🥉)
                </button>
                <button @click="emit('close')" class="w-full py-3 bg-transparent rounded-xl font-bold text-sm uppercase text-slate-400 hover:text-slate-700">
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
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: white; border-bottom: 2px solid #f1f5f9; }
.game-title { font-size: clamp(1.2rem, 4vw, 1.8rem); font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }

.game-chassis {
  background: white;
  border-radius: 8px; padding: 4px; 
  border-bottom: 6px solid #cbd5e1; border-right: 4px solid #cbd5e1; 
  border-top: 2px solid #f8fafc; border-left: 2px solid #f8fafc;
}

.chassis-inner-shadow {
  width: 100%; height: 100%; border-radius: 4px;
}

.animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>