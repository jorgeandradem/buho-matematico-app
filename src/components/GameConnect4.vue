<script setup>
/** * ARCHIVO: GameConnect4.vue
 * NOTA INTERNA: CONECTA 4 v1.3 - INDICADORES DE TURNO
 * LÓGICA: IA mejorada, Modal de reglas añadido, Indicadores visuales de turno activo.
 * VISUAL: Tablero perforado azul, fichas 2.5D.
 */
import { ref, onMounted } from 'vue';
import { X as CloseIcon, User, Cpu, RotateCcw, Trophy, Frown, Handshake, LayoutGrid, Ticket, Info } from 'lucide-vue-next';
import { useGamificationStore } from '@/stores/useGamificationStore';

const emit = defineEmits(['close']);
const gamificationStore = useGamificationStore();

// ⚙️ PROPS
const props = defineProps({ 
  gameMode: { type: String, default: 'vs-pc' }, 
  allowLandscape: { type: Boolean, default: true } 
});

// ==========================================
// 🎵 1. MOTOR DE AUDIO MAESTRO
// ==========================================
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
const COLS = 7;
const ROWS = 6;

const board = ref(Array.from({ length: COLS }, () => [])); 
const playerTurn = ref(1); 
const isBotThinking = ref(false);
const moveError = ref(false); 
const gameResult = ref(null); 
const winReason = ref('');
const winningCells = ref([]); 

const showRules = ref(false); // 🌟 ESTADO PARA EL MODAL DE REGLAS

// ==========================================
// 🧩 3. INICIALIZACIÓN Y FÍSICA
// ==========================================
const initBoard = () => {
  board.value = Array.from({ length: COLS }, () => []);
  playerTurn.value = 1;
  isBotThinking.value = false;
  moveError.value = false;
  gameResult.value = null;
  winReason.value = '';
  winningCells.value = [];
};

onMounted(() => { initBoard(); });

const handleReplayClick = async () => {
  if (gamificationStore.totalWealthInCopper >= 15) {
    const success = await gamificationStore.payRecreationEntry(15);
    if (success) {
      playSound(sndSpecial); 
      initBoard();
    }
  } else {
    gamificationStore.bubbleMessage = "¡No tienes 15 monedas de cobre para jugar otra vez!";
    emit('close'); 
  }
};

const triggerError = () => {
  moveError.value = true;
  setTimeout(() => moveError.value = false, 300);
};

const handleColClick = (colIdx) => {
  if (gameResult.value || isBotThinking.value) return;
  if (props.gameMode === 'vs-pc' && playerTurn.value !== 1) return;

  dropToken(colIdx, playerTurn.value);
};

const dropToken = (colIdx, player) => {
  const col = board.value[colIdx];
  if (col.length >= ROWS) {
    triggerError();
    return;
  }

  col.push(player);
  playSound(sndMove);

  const rowIdx = col.length - 1;
  const hasWon = checkWin(colIdx, rowIdx, player);

  if (hasWon) {
    handleWin(player);
  } else if (checkDraw()) {
    gameResult.value = 'draw';
    winReason.value = '¡Tablero lleno sin ganador!';
    playSound(sndSpecial);
  } else {
    playerTurn.value = player === 1 ? 2 : 1;
    
    if (props.gameMode === 'vs-pc' && playerTurn.value === 2) {
      isBotThinking.value = true;
      setTimeout(simulateComputerMove, 600);
    }
  }
};

// ==========================================
// 🤖 4. CEREBRO IA (EQUILIBRIO COMPETITIVO)
// ==========================================
const simulateComputerMove = () => {
  if (gameResult.value) return;

  const botPlayer = 2;
  const humanPlayer = 1;
  let chosenCol = -1;

  // 1. ATAQUE: Si puede ganar, lo hace.
  chosenCol = findWinningMove(botPlayer);
  
  // 2. DEFENSA: Si el humano está por ganar, bloquea.
  if (chosenCol === -1) {
    chosenCol = findWinningMove(humanPlayer);
  }

  // 3. ESTRATEGIA POSICIONAL (Jugar "de igual a igual")
  if (chosenCol === -1) {
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
      if (board.value[c].length < ROWS) validCols.push(c);
    }
    
    // 🌟 EQUILIBRIO: Prioriza dominar el centro del tablero (Col 3), luego los costados internos (2,4)
    const preferences = [3, 2, 4, 1, 5, 0, 6];
    for (let p of preferences) {
      if (validCols.includes(p)) {
        // Pequeño margen de "error" humano (15%) para que el Bot no sea invencible
        if (Math.random() > 0.15) {
          chosenCol = p;
          break;
        }
      }
    }
    // Respaldo de seguridad si el azar lo hizo saltarse las opciones
    if (chosenCol === -1) {
      chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
    }
  }

  dropToken(chosenCol, botPlayer);
  isBotThinking.value = false;
};

const findWinningMove = (playerToTest) => {
  for (let c = 0; c < COLS; c++) {
    if (board.value[c].length < ROWS) {
      const r = board.value[c].length;
      board.value[c].push(playerToTest);
      const isWinning = checkWin(c, r, playerToTest, false);
      board.value[c].pop();
      if (isWinning) return c;
    }
  }
  return -1;
};

// ==========================================
// 🎯 5. ALGORITMO DE EVALUACIÓN
// ==========================================
const checkDraw = () => {
  return board.value.every(col => col.length === ROWS);
};

const handleWin = (player) => {
  playSound(sndSpecial);
  if (props.gameMode === 'vs-pc') {
    if (player === 1) {
      gameResult.value = 'win'; winReason.value = '¡Conectaste 4 magistralmente!';
    } else {
      gameResult.value = 'lose'; winReason.value = '¡El Búho Bot te ha acorralado!';
    }
  } else {
    gameResult.value = 'win'; 
    winReason.value = `¡Ha ganado el Jugador ${player === 1 ? 'Rojo' : 'Amarillo'}!`;
  }
};

const checkWin = (col, row, player, saveCells = true) => {
  const directions = [
    { dc: 1, dr: 0 }, 
    { dc: 0, dr: 1 }, 
    { dc: 1, dr: 1 }, 
    { dc: 1, dr: -1 } 
  ];

  for (let dir of directions) {
    let count = 1;
    let tempCells = [{ c: col, r: row }];

    let c = col + dir.dc; let r = row + dir.dr;
    while (c >= 0 && c < COLS && r >= 0 && r < board.value[c]?.length && board.value[c][r] === player) {
      count++; tempCells.push({ c, r });
      c += dir.dc; r += dir.dr;
    }

    c = col - dir.dc; r = row - dir.dr;
    while (c >= 0 && c < COLS && r >= 0 && r < board.value[c]?.length && board.value[c][r] === player) {
      count++; tempCells.push({ c, r });
      c -= dir.dc; r -= dir.dr;
    }

    if (count >= 4) {
      if (saveCells) winningCells.value = tempCells;
      return true;
    }
  }
  return false;
};

const isWinningCell = (c, r) => {
  return winningCells.value.some(cell => cell.c === c && cell.r === r);
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas font-inter">
      
      <header class="header-standard shrink-0">
        <div class="flex items-center gap-3">
          <div class="bg-blue-600 p-2 rounded-xl shadow-[0_3px_0_rgb(30,58,138)]">
            <LayoutGrid class="text-white" :size="24" stroke-width="2.5" />
          </div>
          <div>
            <h2 class="game-title !text-blue-800">Conecta 4</h2>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">
              {{ props.gameMode === 'vs-pc' ? 'Vs. Computadora' : '2 Jugadores' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showRules = true" class="bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors text-blue-600 border border-blue-200" title="Ver Reglas">
            <Info :size="24" stroke-width="2.5" />
          </button>
          <button @click="emit('close')" class="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
            <CloseIcon :size="24" stroke-width="2.5" />
          </button>
        </div>
      </header>

      <div :class="[
        'flex-1 flex flex-col items-center justify-center w-full px-4 py-2 gap-4 overflow-hidden relative',
        props.allowLandscape ? 'landscape:flex-row landscape:justify-around landscape:gap-6' : ''
      ]">
        
        <div :class="[
          'w-full max-w-sm flex justify-between items-end px-2 shrink-0',
          props.allowLandscape ? 'landscape:w-1/4 landscape:flex-col landscape:items-center landscape:justify-center landscape:gap-6 landscape:h-full' : ''
        ]">
          <div class="flex items-center gap-2 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 w-full landscape:flex-col landscape:text-center">
            <div :class="['p-2 rounded-xl border-2 relative transition-all duration-300',
                          playerTurn === 2 ? 'bg-yellow-50 border-yellow-400 animate-turn-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-slate-100 border-slate-300']">
              <Cpu v-if="props.gameMode === 'vs-pc'" class="text-blue-600" :size="20"/>
              <User v-else class="text-yellow-500" :size="20"/>
              <div v-if="playerTurn === 2 && !gameResult" class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div class="flex-1">
              <span class="block text-slate-700 font-black text-sm uppercase leading-none mb-0.5">
                {{ props.gameMode === 'vs-pc' ? 'Búho Bot' : 'Jugador 2' }}
              </span>
              <span class="block text-slate-400 font-bold text-[9px] uppercase tracking-widest flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-yellow-400 border border-yellow-600 inline-block"></span> Fichas Amarillas
              </span>
            </div>
          </div>
        </div>

        <div :class="[
          'game-chassis shadow-2xl flex-1 min-h-0 w-full max-w-md max-h-[50vh] sm:max-h-[60vh] flex flex-col relative',
          props.allowLandscape ? 'landscape:w-2/4 landscape:h-[90%] landscape:max-w-none' : ''
        ]">
          <div class="absolute top-0 -left-2 sm:-left-3 bottom-[-1rem] w-2 sm:w-3 bg-blue-900 rounded-l-md shadow-lg"></div>
          <div class="absolute top-0 -right-2 sm:-right-3 bottom-[-1rem] w-2 sm:w-3 bg-blue-900 rounded-r-md shadow-lg"></div>
          
          <div class="chassis-inner-shadow flex p-1 sm:p-2 h-full bg-blue-700 rounded-t-xl rounded-b-md relative z-10">
            
            <div v-for="c in COLS" :key="'col'+c" 
                 @click="handleColClick(c - 1)"
                 :class="[
                   'flex-1 flex flex-col justify-end gap-1 sm:gap-2 cursor-pointer transition-colors px-0.5 sm:px-1 group relative',
                   (playerTurn === 1 && !gameResult && !isBotThinking) ? 'hover:bg-blue-600/50' : '',
                   moveError && (playerTurn === 1) ? 'animate-shake' : ''
                 ]">
              
              <div v-if="playerTurn === 1 && !gameResult && !isBotThinking" class="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-rose-500/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              <div v-for="r in ROWS" :key="'row'+r" 
                   class="w-full aspect-square rounded-full bg-slate-900 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] relative flex items-center justify-center">
                
                <Transition name="drop">
                  <div v-if="board[c - 1] && board[c - 1][ROWS - r]" 
                       :class="[
                         'w-[90%] h-[90%] rounded-full shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.4),_inset_2px_2px_4px_rgba(255,255,255,0.4),_2px_4px_5px_rgba(0,0,0,0.5)]',
                         board[c - 1][ROWS - r] === 1 ? 'bg-rose-600' : 'bg-yellow-400',
                         isWinningCell(c - 1, ROWS - r) ? 'animate-glow ring-4 ring-white z-20' : ''
                       ]">
                  </div>
                </Transition>
              </div>

            </div>

          </div>
          <div class="h-4 sm:h-6 bg-blue-900 w-[105%] -ml-[2.5%] rounded-b-xl shadow-xl z-20 relative border-t-2 border-blue-800"></div>
        </div>

        <div :class="[
          'w-full max-w-sm flex justify-between items-center px-2 shrink-0 gap-3 mt-2',
          props.allowLandscape ? 'landscape:w-1/4 landscape:flex-col-reverse landscape:items-center landscape:justify-center landscape:gap-4 landscape:h-full' : ''
        ]">
          <div class="flex items-center gap-2 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 w-full landscape:flex-col landscape:text-center">
            <div :class="['p-2 rounded-xl border-2 relative transition-all duration-300',
                          playerTurn === 1 ? 'bg-rose-50 border-rose-400 animate-turn-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-slate-100 border-slate-300']">
              <User class="text-rose-600" :size="20"/>
              <div v-if="playerTurn === 1 && !gameResult" class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div class="flex-1">
              <span class="block text-slate-700 font-black text-sm uppercase leading-none mb-0.5">Tú</span>
              <span class="block text-slate-400 font-bold text-[9px] uppercase tracking-widest flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-rose-500 border border-rose-700 inline-block"></span> Fichas Rojas
              </span>
            </div>
          </div>

          <button @click="handleReplayClick" class="p-3 sm:p-4 rounded-xl bg-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-300 transition-colors shadow-sm" title="Pagar 15 cobres y Reiniciar">
            <RotateCcw :size="22" stroke-width="2.5" />
          </button>
        </div>

        <Transition name="bubble-pop">
          <div v-if="showRules" class="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-blue-400 bg-white flex flex-col items-center gap-4 relative">
              <div class="w-16 h-16 rounded-full border-4 border-white bg-blue-100 text-blue-600 flex items-center justify-center -mt-12 shadow-lg">
                <Info :size="32" stroke-width="2.5" />
              </div>
              <h3 class="text-2xl font-black uppercase tracking-tighter leading-none text-blue-800">Reglas del Juego</h3>
              <div class="text-slate-600 text-sm font-medium space-y-3 text-left w-full">
                <p><strong>🎯 Objetivo:</strong> Ser el primero en conectar <strong>4 fichas</strong> de tu color en línea (horizontal, vertical o diagonal).</p>
                <p><strong>🕹️ Mecánica:</strong> En tu turno, toca una columna. Tu ficha caerá por gravedad hasta la posición más baja disponible.</p>
                <p><strong>🧠 Estrategia Pura:</strong> Observa las jugadas del Búho Bot. Debes bloquear sus líneas e intentar crear "trampas" múltiples. ¡Gana quien cometa menos errores!</p>
              </div>
              <button @click="showRules = false" class="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg transition-all uppercase shadow-[0_4px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none">
                ¡Entendido!
              </button>
            </div>
          </div>
        </Transition>

        <Transition name="bubble-pop">
          <div v-if="gameResult" class="absolute inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                <button @click="handleReplayClick" :class="[
                  'w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 uppercase',
                  gameResult === 'win' ? 'bg-green-500 text-white shadow-[0_4px_0_rgb(22,163,74)]' : 
                  gameResult === 'lose' ? 'bg-rose-500 text-white shadow-[0_4px_0_rgb(159,18,57)]' : 
                  'bg-blue-500 text-white shadow-[0_4px_0_rgb(37,99,235)]'
                ]">
                  <RotateCcw :size="20" stroke-width="2.5" /> Otra Vez (15 🥉)
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

.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; }

.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; -webkit-tap-highlight-color: transparent; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); width: 100vw; height: 100dvh; overflow-y: auto; overflow-x: hidden; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 8px solid white; padding: 0; overflow: hidden; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: white; border-bottom: 2px solid #f1f5f9; }
.game-title { font-size: clamp(1.2rem, 4vw, 1.8rem); font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }

.chassis-inner-shadow {
  box-shadow: inset 0px 10px 20px rgba(0,0,0,0.5), inset 0px -4px 10px rgba(255,255,255,0.2); 
}

.animate-glow { animation: glow-pulse 1s infinite alternate; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)); }
@keyframes glow-pulse { 0% { filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5)); } 100% { filter: drop-shadow(0 0 15px rgba(255, 255, 255, 1)); } }

.animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.drop-enter-active { animation: dropIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
@keyframes dropIn { from { transform: translateY(-500%); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }

/* 🌟 ANIMACIÓN DE PULSO DE TURNO */
.animate-turn-pulse { animation: turn-pulse 1.5s infinite alternate ease-in-out; }
@keyframes turn-pulse { 0% { transform: scale(1); box-shadow: 0 0 5px currentColor; } 100% { transform: scale(1.05); box-shadow: 0 0 15px currentColor; } }
</style>