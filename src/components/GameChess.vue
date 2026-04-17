<script setup>
/** * ARCHIVO: GameChess.vue
 * NOTA INTERNA: MOTOR DE AJEDREZ v4.3 - INDICADORES DE TURNO
 * LOGICA: Evaluación Inteligente, Feedback Visual/Auditivo 360º, Cobro por Revancha, Pulso de Turno Activo.
 */
import { ref, computed } from 'vue';
import { X as CloseIcon, User, Cpu, RotateCcw, Trophy, Frown, Handshake, Info } from 'lucide-vue-next';
import { Chess } from 'chess.js';
import { useGamificationStore } from '@/stores/useGamificationStore';

const emit = defineEmits(['close']);
const gamificationStore = useGamificationStore();

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

// --- 🧠 INICIALIZACIÓN DEL MOTOR ---
const game = ref(new Chess());
const selectedSquare = ref(null); 
const playerTurn = ref('w'); 
const moveError = ref(false); 
const legalMoves = ref([]); 

const gameResult = ref(null);
const winReason = ref('');

const showRules = ref(false); // 🌟 ESTADO PARA EL MODAL DE REGLAS

// 🛠️ FIX EMOJI: Obliga a renderizar la fuente pura.
const pieceIcons = {
  'r': '♜\uFE0E', 'n': '♞\uFE0E', 'b': '♝\uFE0E', 'q': '♛\uFE0E', 'k': '♚\uFE0E', 'p': '♟\uFE0E'
};

const board = computed(() => {
  return game.value.board();
});

// --- 🗺️ CONVERSIÓN BIDIRECCIONAL ---
const toAlgebraic = (r, c) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return `${files[c]}${8 - r}`;
};

const fromAlgebraic = (sq) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const c = files.indexOf(sq[0]);
  const r = 8 - parseInt(sq[1]);
  return { r, c };
};

const getLegalMove = (r, c) => {
  const targetSquare = toAlgebraic(r, c);
  return legalMoves.value.find(m => m.to === targetSquare);
};

// 🌟 COBRO POR REINICIAR (15 COBRES)
const handleReplayClick = async () => {
  if (gamificationStore.totalWealthInCopper >= 15) {
    const success = await gamificationStore.payRecreationEntry(15);
    if (success) {
      playSound(sndKing); 
      resetBoard();
    }
  } else {
    gamificationStore.bubbleMessage = "¡No tienes 15 monedas de cobre para jugar otra vez!";
    emit('close'); 
  }
};

// --- 🕹️ FÍSICA DE MOVIMIENTO SENSORIAL (TÚ) ---
const handleSquareClick = (r, c) => {
  if (playerTurn.value !== 'w' || game.value.isGameOver()) return; 

  const piece = board.value[r][c];
  const clickedSquare = toAlgebraic(r, c);
  moveError.value = false;

  if (selectedSquare.value) {
    const sourceSquare = toAlgebraic(selectedSquare.value.r, selectedSquare.value.c);
    
    // 1. Soltar pieza (Si tocas la misma casilla)
    if (sourceSquare === clickedSquare) {
      selectedSquare.value = null;
      legalMoves.value = [];
      return;
    }

    // 2. Cambio fluido de selección
    if (piece && piece.color === 'w') {
      selectedSquare.value = { r, c };
      legalMoves.value = game.value.moves({ square: clickedSquare, verbose: true });
      playSound(sndSelect);
      return;
    }
    
    // 3. Intentar el movimiento
    try {
      const move = game.value.move({
        from: sourceSquare,
        to: clickedSquare,
        promotion: 'q' 
      });

      if (move) {
        if (move.captured) playSound(sndCapture);
        else if (move.promotion) playSound(sndKing);
        else playSound(sndMove);

        selectedSquare.value = null;
        legalMoves.value = []; 
        
        if (!checkGameState()) {
          playerTurn.value = 'b';
          setTimeout(simulateComputerMove, 400); // Llamamos a la IA
        }
      } else {
        triggerError();
      }
    } catch (e) {
      triggerError();
    }
  } else {
    // Primera selección
    if (piece && piece.color === 'w') {
      selectedSquare.value = { r, c };
      legalMoves.value = game.value.moves({ square: clickedSquare, verbose: true });
      playSound(sndSelect);
    }
  }
};

const triggerError = () => {
  moveError.value = true;
  setTimeout(() => moveError.value = false, 300);
};

// ==========================================
// 🤖 CEREBRO ARTIFICIAL (MINIMAX) + SENSORIAL
// ==========================================

const evaluateBoard = (gameInstance) => {
  let totalEvaluation = 0;
  const currentBoard = gameInstance.board();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = currentBoard[i][j];
      if (piece) {
        let val = 0;
        if (piece.type === 'p') val = 10;
        else if (piece.type === 'n') val = 30;
        else if (piece.type === 'b') val = 30;
        else if (piece.type === 'r') val = 50;
        else if (piece.type === 'q') val = 90;
        else if (piece.type === 'k') val = 900;
        
        totalEvaluation += piece.color === 'b' ? val : -val;
      }
    }
  }
  return totalEvaluation;
};

const minimax = (gameInstance, depth, alpha, beta, isMaximizingPlayer) => {
  if (depth === 0 || gameInstance.isGameOver()) {
    return evaluateBoard(gameInstance);
  }

  const possibleMoves = gameInstance.moves();

  if (isMaximizingPlayer) {
    let bestVal = -9999;
    for (let i = 0; i < possibleMoves.length; i++) {
      gameInstance.move(possibleMoves[i]);
      bestVal = Math.max(bestVal, minimax(gameInstance, depth - 1, alpha, beta, !isMaximizingPlayer));
      gameInstance.undo();
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) break; 
    }
    return bestVal;
  } else {
    let bestVal = 9999;
    for (let i = 0; i < possibleMoves.length; i++) {
      gameInstance.move(possibleMoves[i]);
      bestVal = Math.min(bestVal, minimax(gameInstance, depth - 1, alpha, beta, !isMaximizingPlayer));
      gameInstance.undo();
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  }
};

const calculateBestMove = (gameInstance) => {
  const possibleMoves = gameInstance.moves({ verbose: true });
  if (possibleMoves.length === 0) return null;

  let bestMove = null;
  let bestValue = -9999;

  possibleMoves.sort(() => Math.random() - 0.5);

  for (let i = 0; i < possibleMoves.length; i++) {
    const move = possibleMoves[i];
    gameInstance.move(move.san);
    
    const boardValue = minimax(gameInstance, 1, -10000, 10000, false);
    gameInstance.undo();

    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }
  return bestMove || possibleMoves[0];
};

const simulateComputerMove = () => {
  if (game.value.isGameOver()) return;

  const bestMove = calculateBestMove(game.value);
  if (!bestMove) return;

  // 1. El Bot selecciona visualmente la pieza que va a mover
  const fromCoords = fromAlgebraic(bestMove.from);
  selectedSquare.value = { r: fromCoords.r, c: fromCoords.c };
  playSound(sndSelect);

  // 2. Pausa dramática
  setTimeout(() => {
    game.value.move(bestMove.san);
    
    // Reproducimos el sonido correcto
    if (bestMove.captured) playSound(sndCapture);
    else if (bestMove.promotion) playSound(sndKing);
    else playSound(sndMove);

    // 3. El Bot aterriza e ilumina la nueva posición
    const toCoords = fromAlgebraic(bestMove.to);
    selectedSquare.value = { r: toCoords.r, c: toCoords.c };

    setTimeout(() => {
      selectedSquare.value = null; // Apagamos la luz
      if (!checkGameState()) {
        playerTurn.value = 'w'; // Te devuelve el turno
      }
    }, 400);

  }, 700); 
};
// ==========================================

// --- 🎯 EVALUADOR DE PARTIDA ---
const checkGameState = () => {
  if (game.value.isCheckmate()) {
    if (game.value.turn() === 'w') {
      gameResult.value = 'lose';
      winReason.value = '¡El Búho Bot te ha dado Jaque Mate!';
    } else {
      gameResult.value = 'win';
      winReason.value = '¡Magistral! Has dado Jaque Mate.';
    }
    return true;
  } 
  
  if (game.value.isDraw()) {
    gameResult.value = 'draw';
    if (game.value.isStalemate()) {
      winReason.value = 'Rey Ahogado. ¡Son Tablas!';
    } else if (game.value.isThreefoldRepetition()) {
      winReason.value = 'Repetición de jugadas. ¡Tablas!';
    } else if (game.value.isInsufficientMaterial()) {
      winReason.value = 'Falta material para ganar. ¡Tablas!';
    } else {
      winReason.value = 'Empate técnico. ¡Tablas!';
    }
    return true;
  }
  
  return false; 
};

const resetBoard = () => {
  game.value.reset();
  selectedSquare.value = null;
  legalMoves.value = [];
  playerTurn.value = 'w';
  gameResult.value = null;
  winReason.value = '';
};

const isDarkSquare = (r, c) => (r + c) % 2 !== 0;

const getPieceClass = (pieceObj) => {
  if (!pieceObj) return '';
  return pieceObj.color === 'w' ? 'piece-white' : 'piece-black';
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas font-inter">
      
      <header class="header-standard shrink-0">
        <div class="flex items-center gap-3">
          <div class="bg-rose-500 p-2 rounded-xl shadow-[0_3px_0_rgb(159,18,57)]">
            <span class="text-xl leading-none text-white drop-shadow-md">♔</span>
          </div>
          <div>
            <h2 class="game-title !text-rose-600">Ajedrez</h2>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Vs. Computadora</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showRules = true" class="bg-rose-50 p-2 rounded-full hover:bg-rose-100 transition-colors text-rose-600 border border-rose-200" title="Ver Reglas">
            <Info :size="24" stroke-width="2.5" />
          </button>
          <button @click="emit('close')" class="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
            <CloseIcon :size="24" stroke-width="2.5" />
          </button>
        </div>
      </header>

      <div class="flex-1 flex flex-col items-center justify-center w-full px-4 gap-6 overflow-hidden relative">
        
        <div class="w-full max-w-sm flex justify-between items-end px-2">
          <div class="flex items-center gap-2">
            <div :class="['w-10 h-10 rounded-lg bg-slate-200 border-2 flex items-center justify-center shadow-sm transition-all duration-300', 
                          playerTurn === 'b' ? 'border-rose-400 animate-turn-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'border-slate-300']">
              <Cpu class="text-rose-500" :size="20" />
            </div>
            <div>
              <span class="block text-slate-700 font-black text-sm uppercase">Búho Bot</span>
              <span class="block text-slate-400 font-bold text-[10px] uppercase">Estratega Minimax</span>
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
            <div class="chess-grid">
              <template v-for="(row, r) in board" :key="'r'+r">
                <div v-for="(pieceObj, c) in row" :key="'c'+c" 
                     @click="handleSquareClick(r, c)"
                     :class="[
                       'square', 
                       isDarkSquare(r, c) ? 'dark-square' : 'light-square',
                       selectedSquare?.r === r && selectedSquare?.c === c ? 'selected-square' : '',
                       'relative flex items-center justify-center cursor-pointer transition-colors'
                     ]">
                  
                  <div v-if="getLegalMove(r, c)" 
                       :class="['absolute z-10 pointer-events-none', 
                                getLegalMove(r, c).flags.includes('c') ? 'capture-ring' : 'move-dot']">
                  </div>

                  <span v-if="pieceObj" :class="[
                      'chess-piece transition-transform duration-200 z-20', 
                      getPieceClass(pieceObj), 
                      selectedSquare?.r === r && selectedSquare?.c === c ? 'scale-125 -translate-y-2 animate-glow' : '',
                      selectedSquare?.r === r && selectedSquare?.c === c && moveError ? 'animate-shake text-red-500' : ''
                    ]">
                    {{ pieceIcons[pieceObj.type] }}
                  </span>
                  
                </div>
              </template>
            </div>
          </div>
        </div>

        <div class="w-full max-w-sm flex justify-between items-start px-2">
          <div class="flex items-center gap-2">
            <div :class="['w-10 h-10 rounded-lg bg-white border-2 flex items-center justify-center shadow-sm transition-all duration-300',
                          playerTurn === 'w' ? 'border-emerald-400 animate-turn-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'border-slate-200']">
              <User class="text-slate-600" :size="20" />
            </div>
            <div>
              <span class="block text-slate-700 font-black text-sm uppercase">Tú</span>
              <span class="block text-slate-400 font-bold text-[10px] uppercase">Fichas Blancas</span>
            </div>
          </div>
          <button @click="handleReplayClick" class="p-2 rounded-lg bg-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-300 transition-colors" title="Pagar 15 cobres y Reiniciar">
            <RotateCcw :size="20" stroke-width="2.5" />
          </button>
        </div>

        <Transition name="bubble-pop">
          <div v-if="showRules" class="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-rose-400 bg-white flex flex-col items-center gap-4 relative">
              <div class="w-16 h-16 rounded-full border-4 border-white bg-rose-100 text-rose-600 flex items-center justify-center -mt-12 shadow-lg">
                <Info :size="32" stroke-width="2.5" />
              </div>
              <h3 class="text-2xl font-black uppercase tracking-tighter leading-none text-rose-800">Reglas del Juego</h3>
              <div class="text-slate-600 text-sm font-medium space-y-3 text-left w-full">
                <p><strong>🎯 Objetivo:</strong> Dar "Jaque Mate" al rey del Búho Bot (dejarlo bajo ataque sin que pueda escapar o defenderse).</p>
                <p><strong>🕹️ Controles:</strong> Toca una de tus piezas blancas (se iluminará) y luego toca el círculo verde o el anillo rojo para moverla o capturar.</p>
                <p><strong>🧠 Estrategia:</strong> El Búho Bot evalúa el tablero matemáticamente. Intenta controlar el centro, desarrollar tus caballos/alfiles temprano y proteger siempre a tu rey.</p>
              </div>
              <button @click="showRules = false" class="w-full py-3 mt-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-lg transition-all uppercase shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none">
                ¡Entendido!
              </button>
            </div>
          </div>
        </Transition>

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
                  {{ gameResult === 'win' ? '¡Victoria!' : gameResult === 'lose' ? '¡Derrota!' : '¡Tablas!' }}
                </h3>
                <p :class="[
                  'text-sm font-bold mt-2',
                  gameResult === 'lose' ? 'text-slate-500' : 'text-slate-500'
                ]">{{ winReason }}</p>
              </div>

              <div class="w-full flex flex-col gap-2 mt-2">
                <button @click="handleReplayClick" :class="[
                  'w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 uppercase',
                  gameResult === 'win' ? 'bg-green-500 text-white shadow-[0_4px_0_rgb(22,163,74)] active:translate-y-1 active:shadow-none' : 
                  gameResult === 'lose' ? 'bg-rose-500 text-white shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none' : 
                  'bg-blue-500 text-white shadow-[0_4px_0_rgb(37,99,235)] active:translate-y-1 active:shadow-none'
                ]">
                  <RotateCcw :size="20" stroke-width="2.5" /> Otra Vez (15 🥉)
                </button>
                <button @click="emit('close')" :class="[
                  'w-full py-3 bg-transparent rounded-xl font-bold text-sm uppercase transition-colors',
                  gameResult === 'lose' ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-slate-700'
                ]">
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

.master-container {
  position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center;
  background-color: #f1f5f9; overflow: hidden;
}

.app-canvas {
  display: flex; flex-direction: column; justify-content: space-between; position: relative;
  background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none; -webkit-tap-highlight-color: transparent;
  padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);
  width: 100vw; height: 100dvh; overflow-y: auto; overflow-x: hidden;
}

@media (min-width: 1025px) {
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 8px solid white; padding: 0; overflow: hidden; }
}

@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; }
}

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: white; border-bottom: 2px solid #f1f5f9; }
.game-title { font-size: clamp(1.2rem, 4vw, 1.8rem); font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }

.board-chassis {
  width: 96%; max-width: 400px; aspect-ratio: 1/1;
  background: linear-gradient(145deg, #475569, #1e293b);
  border-radius: 12px; padding: 10px; border-bottom: 8px solid #0f172a;
  border-right: 4px solid #0f172a; border-top: 2px solid #64748b; border-left: 2px solid #64748b;
}

.board-inner-shadow {
  width: 100%; height: 100%; border-radius: 4px;
  box-shadow: inset 4px 4px 10px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.1); overflow: hidden;
}

.chess-grid { display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); width: 100%; height: 100%; border: 2px solid #020617; }
.square { width: 100%; height: 100%; box-shadow: inset 1px 1px 2px rgba(255,255,255,0.1), inset -1px -1px 2px rgba(0,0,0,0.2); }
.light-square { background-color: #e2e8f0; } 
.dark-square { background-color: #64748b; }  

.selected-square { background-color: #fbbf24 !important; box-shadow: inset 0 0 15px rgba(180, 83, 9, 0.8) !important; }
.move-dot { width: 25%; height: 25%; background-color: rgba(16, 185, 129, 0.8); border-radius: 50%; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
.capture-ring { width: 85%; height: 85%; border: 4px solid rgba(239, 68, 68, 0.8); border-radius: 50%; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(239, 68, 68, 0.3); animation: pulse-ring 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1); }

@keyframes pulse-ring { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }

.chess-piece { font-family: 'Arial', 'Helvetica', sans-serif !important; font-size: clamp(1.8rem, 8vw, 2.5rem); line-height: 1; user-select: none; filter: drop-shadow(2px 4px 2px rgba(0,0,0,0.5)); }
.piece-black { color: #0f172a !important; text-shadow: 0 -1px 1px rgba(255,255,255,0.2); }
.piece-white { color: #f8fafc !important; text-shadow: -1px -1px 0 #334155, 1px -1px 0 #334155, -1px 1px 0 #334155, 1px 1px 0 #334155, 0 2px 2px #0f172a; }

.animate-glow { animation: glow-pulse 1s infinite alternate; filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)); }
@keyframes glow-pulse { 0% { filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5)); } 100% { filter: drop-shadow(0 0 15px rgba(251, 191, 36, 1)); } }

.animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }

/* 🌟 ANIMACIÓN DE PULSO DE TURNO */
.animate-turn-pulse { animation: turn-pulse 1.5s infinite alternate ease-in-out; }
@keyframes turn-pulse { 0% { transform: scale(1); box-shadow: 0 0 5px currentColor; } 100% { transform: scale(1.05); box-shadow: 0 0 15px currentColor; } }
</style>