<script setup>
/** * ARCHIVO: GameCheckers.vue
 * NOTA INTERNA: MOTOR DE DAMAS v2.1 - UX SENSORIAL BIDIRECCIONAL + HOMOLOGACIÓN
 * LOGICA: Matriz 8x8, Capturas Múltiples, Audio 360º, y Pausas Tácticas de la IA.
 */
import { ref } from 'vue';
import { X as CloseIcon, User, Cpu, RotateCcw, Trophy, Frown } from 'lucide-vue-next';

const emit = defineEmits(['close']);

// --- 🎵 MOTORES DE AUDIO ---
const sndSelect = new Audio('/audios/select.mp3');
const sndMove = new Audio('/audios/move.mp3');
const sndCapture = new Audio('/audios/capture.mp3');
const sndKing = new Audio('/audios/king.mp3');

const playSound = (audioElement) => {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(() => {});
};

// --- 🧠 ESTADO DEL TABLERO ---
const initialBoard = () => [
  ['', 'b', '', 'b', '', 'b', '', 'b'],
  ['b', '', 'b', '', 'b', '', 'b', ''],
  ['', 'b', '', 'b', '', 'b', '', 'b'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['w', '', 'w', '', 'w', '', 'w', ''],
  ['', 'w', '', 'w', '', 'w', '', 'w'],
  ['w', '', 'w', '', 'w', '', 'w', '']
];

const board = ref(initialBoard());
const selectedSquare = ref(null); 
const playerTurn = ref('w'); 
const legalMoves = ref([]); 
const moveError = ref(false); 
const gameResult = ref(null);
const winReason = ref('');

// 🔒 Candado para Combos (Saltos Múltiples)
const isChainJumping = ref(false); 

// --- 📐 MOTOR LÓGICO NATIVO ---
const getLegalMovesForPiece = (r, c, currentState) => {
  const moves = [];
  const piece = currentState[r][c];
  if (!piece) return moves;

  const isKing = piece === piece.toUpperCase();
  const color = piece.toLowerCase();
  const enemyColor = color === 'w' ? 'b' : 'w';
  
  const dirs = [];
  if (color === 'w' || isKing) dirs.push(-1); 
  if (color === 'b' || isKing) dirs.push(1);  

  // 1. Movimientos simples (Se anulan si estamos en medio de un combo)
  if (!isChainJumping.value) {
    dirs.forEach(dr => {
      [-1, 1].forEach(dc => {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && currentState[nr][nc] === '') {
          moves.push({ to: { r: nr, c: nc }, isCapture: false });
        }
      });
    });
  }

  // 2. Capturas (Saltos)
  dirs.forEach(dr => {
    [-1, 1].forEach(dc => {
      const nr = r + dr, nc = c + dc;
      const jumpR = r + 2 * dr, jumpC = c + 2 * dc;
      
      if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8) {
        const midPiece = currentState[nr][nc];
        if (midPiece && midPiece.toLowerCase() === enemyColor && currentState[jumpR][jumpC] === '') {
          moves.push({ 
            to: { r: jumpR, c: jumpC }, 
            isCapture: true, 
            captured: { r: nr, c: nc } 
          });
        }
      }
    });
  });

  return moves;
};

const getLegalMove = (r, c) => {
  return legalMoves.value.find(m => m.to.r === r && m.to.c === c) || null;
};

// --- 🕹️ FÍSICA DE MOVIMIENTO INTERACTIVA (TÚ) ---
const handleSquareClick = (r, c) => {
  if (playerTurn.value !== 'w' || gameResult.value) return; 

  const piece = board.value[r][c];
  moveError.value = false;

  if (selectedSquare.value) {
    const isClickingSamePiece = selectedSquare.value.r === r && selectedSquare.value.c === c;
    const isClickingOtherFriendly = piece && piece.toLowerCase() === 'w';

    // 1. Deseleccionar 
    if (isClickingSamePiece) {
      if (!isChainJumping.value) {
        selectedSquare.value = null;
        legalMoves.value = [];
      } else {
        moveError.value = true;
        setTimeout(() => moveError.value = false, 300);
      }
      return;
    }

    // 2. Cambio fluido de selección
    if (isClickingOtherFriendly && !isChainJumping.value) {
      selectedSquare.value = { r, c };
      legalMoves.value = getLegalMovesForPiece(r, c, board.value);
      playSound(sndSelect);
      return;
    }
    
    // 3. Intentar Mover
    const validMove = getLegalMove(r, c);

    if (validMove) {
      const promoted = executeMove(selectedSquare.value.r, selectedSquare.value.c, validMove);
      
      if (validMove.isCapture) {
        playSound(sndCapture);
        
        // --- 🔄 LÓGICA DE SALTO MÚLTIPLE (COMBO) ---
        if (!promoted) {
          isChainJumping.value = true;
          const nextMoves = getLegalMovesForPiece(validMove.to.r, validMove.to.c, board.value);
          const nextCaptures = nextMoves.filter(m => m.isCapture);

          if (nextCaptures.length > 0) {
            selectedSquare.value = { r: validMove.to.r, c: validMove.to.c };
            legalMoves.value = nextCaptures;
            return; // Mantiene el turno
          }
        }
      } else {
        playSound(sndMove);
      }

      // Fin de tu turno
      isChainJumping.value = false;
      selectedSquare.value = null;
      legalMoves.value = []; 
      
      if (!checkGameState()) {
        playerTurn.value = 'b';
        setTimeout(() => simulateComputerMove(), 500); 
      }
    } else {
      moveError.value = true;
      setTimeout(() => moveError.value = false, 300);
    }
  } else {
    if (piece && piece.toLowerCase() === 'w') {
      selectedSquare.value = { r, c };
      legalMoves.value = getLegalMovesForPiece(r, c, board.value);
      playSound(sndSelect);
    }
  }
};

const executeMove = (fromR, fromC, move) => {
  let piece = board.value[fromR][fromC];
  let promoted = false;
  
  board.value[move.to.r][move.to.c] = piece;
  board.value[fromR][fromC] = '';

  if (move.isCapture) {
    board.value[move.captured.r][move.captured.c] = '';
  }

  if (piece === 'w' && move.to.r === 0) {
    board.value[move.to.r][move.to.c] = 'W';
    promoted = true;
  }
  if (piece === 'b' && move.to.r === 7) {
    board.value[move.to.r][move.to.c] = 'B';
    promoted = true;
  }
  
  return promoted;
};

// --- 🤖 IA DEL BÚHO BOT (CON COMBO Y SENSORIAL BIDIRECCIONAL) ---
const simulateComputerMove = (chainPiece = null) => {
  if (gameResult.value) return;

  let allPossibleMoves = [];
  
  if (chainPiece) {
    const moves = getLegalMovesForPiece(chainPiece.r, chainPiece.c, board.value);
    const captures = moves.filter(m => m.isCapture);
    if (captures.length > 0) {
      captures.forEach(m => allPossibleMoves.push({ from: {r: chainPiece.r, c: chainPiece.c}, ...m }));
    }
  } else {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board.value[r][c];
        if (p && p.toLowerCase() === 'b') {
          const moves = getLegalMovesForPiece(r, c, board.value);
          moves.forEach(m => allPossibleMoves.push({ from: {r, c}, ...m }));
        }
      }
    }
  }

  if (allPossibleMoves.length === 0) {
    if (!chainPiece) checkGameState();
    else {
      isChainJumping.value = false;
      selectedSquare.value = null;
      if(!checkGameState()) playerTurn.value = 'w';
    }
    return;
  }

  const captureMoves = allPossibleMoves.filter(m => m.isCapture);
  let chosenMove = captureMoves.length > 0 
    ? captureMoves[Math.floor(Math.random() * captureMoves.length)] 
    : allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
  
  // 1. FEEDBACK VISUAL: El Bot "agarra" la ficha
  selectedSquare.value = { r: chosenMove.from.r, c: chosenMove.from.c };
  playSound(sndSelect);

  // 2. PAUSA TÁCTICA
  setTimeout(() => {
    const promoted = executeMove(chosenMove.from.r, chosenMove.from.c, chosenMove);
    
    // Sonido correcto
    if (promoted) playSound(sndKing);
    else if (chosenMove.isCapture) playSound(sndCapture);
    else playSound(sndMove);

    // El Bot evalúa si puede hacer Combo
    if (chosenMove.isCapture && !promoted) {
      const nextMoves = getLegalMovesForPiece(chosenMove.to.r, chosenMove.to.c, board.value);
      if (nextMoves.some(m => m.isCapture)) {
        isChainJumping.value = true;
        // Feedback visual del bot aterrizando antes del próximo salto
        selectedSquare.value = { r: chosenMove.to.r, c: chosenMove.to.c };
        setTimeout(() => simulateComputerMove(chosenMove.to), 700);
        return;
      }
    }
    
    // Si no hay combo o terminó
    isChainJumping.value = false;
    selectedSquare.value = { r: chosenMove.to.r, c: chosenMove.to.c }; // Ilumina destino brevemente

    setTimeout(() => {
      selectedSquare.value = null; // Suelta la ficha
      if (!checkGameState()) {
        playerTurn.value = 'w'; // Te devuelve el turno
      }
    }, 400);

  }, 700);
};

// --- 🎯 EVALUADOR DE VICTORIA ---
const checkGameState = () => {
  let whiteCount = 0;
  let blackCount = 0;
  let whiteHasMoves = false;
  let blackHasMoves = false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board.value[r][c];
      if (p && p.toLowerCase() === 'w') {
        whiteCount++;
        const oldChain = isChainJumping.value; isChainJumping.value = false;
        if (getLegalMovesForPiece(r, c, board.value).length > 0) whiteHasMoves = true;
        isChainJumping.value = oldChain;
      }
      if (p && p.toLowerCase() === 'b') {
        blackCount++;
        const oldChain = isChainJumping.value; isChainJumping.value = false;
        if (getLegalMovesForPiece(r, c, board.value).length > 0) blackHasMoves = true;
        isChainJumping.value = oldChain;
      }
    }
  }

  if (whiteCount === 0 || !whiteHasMoves) {
    gameResult.value = 'lose';
    winReason.value = '¡El Búho Bot te ha acorralado!';
    return true;
  }
  
  if (blackCount === 0 || !blackHasMoves) {
    gameResult.value = 'win';
    winReason.value = '¡Excelente estrategia! Has barrido al bot.';
    return true;
  }

  return false;
};

const resetBoard = () => {
  board.value = initialBoard();
  selectedSquare.value = null;
  legalMoves.value = [];
  playerTurn.value = 'w';
  gameResult.value = null;
  winReason.value = '';
  isChainJumping.value = false;
};

const isDarkSquare = (r, c) => (r + c) % 2 !== 0;

</script>

<template>
  <div class="master-container">
    <main class="app-canvas font-inter">
      
      <header class="header-standard shrink-0">
        <div class="flex items-center gap-3">
          <div class="bg-rose-500 p-2 rounded-xl shadow-[0_3px_0_rgb(159,18,57)]">
            <span class="text-xl leading-none text-white drop-shadow-md">⛃</span>
          </div>
          <div>
            <h2 class="game-title !text-rose-600">Damas</h2>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Vs. Computadora</p>
          </div>
        </div>
        <button @click="emit('close')" class="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
          <CloseIcon :size="24" stroke-width="2.5" />
        </button>
      </header>

      <div class="flex-1 flex flex-col items-center justify-center w-full px-4 gap-6 overflow-hidden relative">
        
        <div class="w-full max-w-sm flex justify-between items-end px-2">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-lg bg-slate-200 border-2 border-slate-300 flex items-center justify-center shadow-sm">
              <Cpu class="text-rose-500" :size="20" />
            </div>
            <div>
              <span class="block text-slate-700 font-black text-sm uppercase">Búho Bot</span>
              <span class="block text-slate-400 font-bold text-[10px] uppercase">Nivel 1</span>
            </div>
          </div>
          <div v-if="playerTurn === 'b' && !gameResult" class="flex gap-1 animate-pulse mb-2">
            <span class="w-2 h-2 bg-rose-500 rounded-full"></span>
            <span class="w-2 h-2 bg-rose-500 rounded-full delay-75"></span>
            <span class="w-2 h-2 bg-rose-500 rounded-full delay-150"></span>
          </div>
        </div>

        <div class="board-chassis shadow-2xl">
          <div class="board-inner-shadow">
            <div class="checkers-grid">
              
              <template v-for="(row, r) in board" :key="'r'+r">
                <div v-for="(piece, c) in row" :key="'c'+c" 
                     @click="handleSquareClick(r, c)"
                     :class="[
                       'square', 
                       isDarkSquare(r, c) ? 'dark-square' : 'light-square',
                       selectedSquare?.r === r && selectedSquare?.c === c && !isChainJumping ? 'selected-square' : '',
                       selectedSquare?.r === r && selectedSquare?.c === c && isChainJumping ? 'chain-active-square' : '',
                       'relative flex items-center justify-center cursor-pointer transition-colors'
                     ]">
                  
                  <div v-if="getLegalMove(r, c)" 
                       :class="['absolute z-10 pointer-events-none', 
                                getLegalMove(r, c).isCapture ? 'capture-ring' : 'move-dot']">
                  </div>

                  <div v-if="piece" :class="[
                      'checker-piece transition-transform duration-200 z-20', 
                      piece.toLowerCase() === 'w' ? 'checker-w' : 'checker-b',
                      selectedSquare?.r === r && selectedSquare?.c === c ? 'scale-110 -translate-y-1' : '',
                      selectedSquare?.r === r && selectedSquare?.c === c ? 'animate-glow' : '',
                      selectedSquare?.r === r && selectedSquare?.c === c && moveError ? 'animate-shake' : ''
                    ]">
                    <div class="checker-inner flex items-center justify-center">
                       <span v-if="piece === piece.toUpperCase()" class="text-white/90 text-xl filter drop-shadow-sm">👑</span>
                    </div>
                  </div>
                  
                </div>
              </template>

            </div>
          </div>
        </div>

        <div class="w-full max-w-sm flex justify-between items-start px-2">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
              <User class="text-slate-600" :size="20" />
            </div>
            <div>
              <span class="block text-slate-700 font-black text-sm uppercase">Tú</span>
              <span class="block text-slate-400 font-bold text-[10px] uppercase">
                <span v-if="isChainJumping" class="text-rose-500 animate-pulse">¡SALTO MÚLTIPLE!</span>
                <span v-else>Fichas Blancas</span>
              </span>
            </div>
          </div>
          <button @click="resetBoard" class="p-2 rounded-lg bg-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-300 transition-colors" title="Reiniciar Tablero">
            <RotateCcw :size="20" stroke-width="2.5" />
          </button>
        </div>

        <Transition name="bubble-pop">
          <div v-if="gameResult" class="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div :class="[
              'w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 text-center flex flex-col items-center gap-4',
              gameResult === 'win' ? 'bg-white border-green-400' : 'bg-slate-50 border-rose-400'
            ]">
              <div :class="[
                'w-20 h-20 rounded-full border-4 flex items-center justify-center -mt-12 shadow-lg',
                gameResult === 'win' ? 'bg-yellow-400 border-white text-yellow-900' : 'bg-slate-700 border-slate-800 text-rose-500'
              ]">
                <Trophy v-if="gameResult === 'win'" :size="40" stroke-width="2.5" />
                <Frown v-else :size="40" stroke-width="2.5" />
              </div>
              <div>
                <h3 :class="[
                  'text-3xl font-black uppercase tracking-tighter leading-none',
                  gameResult === 'win' ? 'text-green-600' : 'text-rose-500'
                ]">
                  {{ gameResult === 'win' ? '¡Victoria!' : '¡Derrota!' }}
                </h3>
                <p class="text-sm font-bold mt-2 text-slate-500">{{ winReason }}</p>
              </div>
              <div class="w-full flex flex-col gap-2 mt-2">
                <button @click="resetBoard" :class="[
                  'w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 uppercase',
                  gameResult === 'win' ? 'bg-green-500 text-white shadow-[0_4px_0_rgb(22,163,74)] active:translate-y-1 active:shadow-none' : 
                  'bg-rose-500 text-white shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none'
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

.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; -webkit-tap-highlight-color: transparent; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); width: 100vw; height: 100dvh; overflow-y: auto; overflow-x: hidden; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 8px solid white; padding: 0; overflow: hidden; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: white; border-bottom: 2px solid #f1f5f9; }
.game-title { font-size: clamp(1.2rem, 4vw, 1.8rem); font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }

.board-chassis { width: 96%; max-width: 400px; aspect-ratio: 1/1; background: linear-gradient(145deg, #475569, #1e293b); border-radius: 12px; padding: 10px; border-bottom: 8px solid #0f172a; border-right: 4px solid #0f172a; border-top: 2px solid #64748b; border-left: 2px solid #64748b; }
.board-inner-shadow { width: 100%; height: 100%; border-radius: 4px; box-shadow: inset 4px 4px 10px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.1); overflow: hidden; }
.checkers-grid { display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); width: 100%; height: 100%; border: 2px solid #020617; }
.square { width: 100%; height: 100%; box-shadow: inset 1px 1px 2px rgba(255,255,255,0.1), inset -1px -1px 2px rgba(0,0,0,0.2); transition: background-color 0.3s; }
.light-square { background-color: #fcd34d; } 
.dark-square { background-color: #78350f; }  

.selected-square { background-color: #fbbf24 !important; box-shadow: inset 0 0 15px rgba(180, 83, 9, 0.8) !important; }
.chain-active-square { background-color: #f43f5e !important; box-shadow: inset 0 0 20px rgba(159, 18, 57, 0.9) !important; }

.move-dot { width: 25%; height: 25%; background-color: rgba(16, 185, 129, 0.9); border-radius: 50%; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
.capture-ring { width: 85%; height: 85%; border: 4px solid rgba(239, 68, 68, 0.9); border-radius: 50%; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(239, 68, 68, 0.3); animation: pulse-ring 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes pulse-ring { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }

.checker-piece { width: 75%; height: 75%; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 5px rgba(0,0,0,0.5), inset 0 -3px 4px rgba(0,0,0,0.3), inset 0 3px 4px rgba(255,255,255,0.4); }
.checker-w { background: radial-gradient(circle at 30% 30%, #f8fafc, #cbd5e1); border: 1px solid #94a3b8; }
.checker-b { background: radial-gradient(circle at 30% 30%, #f43f5e, #9f1239); border: 1px solid #881337; }
.checker-inner { width: 60%; height: 60%; border-radius: 50%; border: 1px solid rgba(0,0,0,0.15); box-shadow: inset 0 2px 4px rgba(0,0,0,0.15); }

/* ✨ AURA DE SELECCIÓN Y COMBOS */
.animate-glow { animation: glow-pulse 1s infinite alternate; filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)); }
@keyframes glow-pulse { 0% { filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5)); } 100% { filter: drop-shadow(0 0 15px rgba(251, 191, 36, 1)); } }

.animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>