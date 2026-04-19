<script setup>
/** * ARCHIVO: GameCardTable.vue
 * LÓGICA: Solitario Klondike (Training/Fair), Cripto-Azar, Smart Taps y Búho Estratega.
 */
import { ref, onMounted, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { X as CloseIcon, RotateCcw, Trophy, Frown, Gamepad2, Undo2, Timer, GraduationCap, ShieldAlert } from 'lucide-vue-next';
import CardItem from './CardItem.vue';

const emit = defineEmits(['close']);

const props = defineProps({
  gameMode: { type: String, default: 'training' }, // 'training' (filtrado) o 'fair' (crudo)
  allowLandscape: { type: Boolean, default: false }
});

const isProMode = computed(() => props.gameMode === 'fair');

// ==========================================
// 🎵 1. MOTOR DE AUDIO MAESTRO
// ==========================================
const sndSelect = new Audio('/audios/select.mp3');
const sndMove = new Audio('/audios/move.mp3');
const sndError = new Audio('/audios/error.mp3'); 
const sndWin = new Audio('/audios/king.mp3');

const playSound = (audioElement) => {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(() => {});
};

// ==========================================
// 🦉 2. MOTOR DE VOZ (SPEECH SYNTHESIS)
// ==========================================
const speakOwl = (message) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'es-ES'; 
  utterance.pitch = 1.3; 
  utterance.rate = 1.05; 
  window.speechSynthesis.speak(utterance);
};

const getCardName = (val) => {
  const names = { 1: 'As', 11: 'Jota', 12: 'Reina', 13: 'Rey' };
  return names[val] || val.toString();
};

// ==========================================
// 🧠 3. ESTADO GLOBAL Y PERSISTENCIA (VUEUSE)
// ==========================================
const score = useStorage('buho-solitaire-score', 0);
const timeElapsed = useStorage('buho-solitaire-time', 0);
const gameResult = useStorage('buho-solitaire-result', null);
const winReason = useStorage('buho-solitaire-reason', '');

const deck = useStorage('buho-solitaire-deck', []); 
const waste = useStorage('buho-solitaire-waste', []); 
const foundations = useStorage('buho-solitaire-foundations', [[], [], [], []]); 
const tableau = useStorage('buho-solitaire-tableau', [[], [], [], [], [], [], []]); 
const moveHistory = useStorage('buho-solitaire-history', []); 

let timerInterval = null;
const lastMoveTime = ref(0);

const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'];
const COLORS = { spades: 'black', clubs: 'black', hearts: 'red', diamonds: 'red' };

// ==========================================
// 🎲 4. MOTOR MATEMÁTICO: CRIPTO-AZAR Y REPARTO
// ==========================================
const buildDeck = () => {
  let newDeck = [];
  SUITS.forEach(suit => {
    for (let value = 1; value <= 13; value++) {
      newDeck.push({ id: `${suit}-${value}`, suit, value, color: COLORS[suit], isFaceUp: false });
    }
  });
  return newDeck;
};

// Algoritmo Fisher-Yates de Grado Casino (Criptográfico)
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  const randomBuffer = new Uint32Array(1);

  while (currentIndex !== 0) {
    window.crypto.getRandomValues(randomBuffer);
    randomIndex = randomBuffer[0] % currentIndex;
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// Intenta crear una mesa y reparte las cartas
const distributeCardsToTableau = (currentDeck) => {
  const tempTableau = [[], [], [], [], [], [], []];
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = currentDeck.pop();
      if (row === col) card.isFaceUp = true;
      tempTableau[col].push(card);
    }
  }
  return tempTableau;
};

const dealCards = () => {
  moveHistory.value = [];
  score.value = 0;
  timeElapsed.value = 0;
  gameResult.value = null;
  waste.value = [];
  foundations.value = [[], [], [], []];

  let attempts = 0;
  let isPlayable = false;
  const MAX_ATTEMPTS = isProMode.value ? 1 : 10; // Pro: 1 intento. Training: Hasta 10 intentos.

  while (attempts < MAX_ATTEMPTS && !isPlayable) {
    attempts++;
    let tempDeck = shuffle(buildDeck());
    let tempTableau = distributeCardsToTableau(tempDeck);

    // Asignar temporalmente al estado para usar el "Detective"
    deck.value = tempDeck;
    tableau.value = tempTableau;

    // El modo Pro acepta cualquier mesa. El modo Training exige al menos una jugada posible de inicio.
    if (isProMode.value || checkForPossibleMoves()) {
      isPlayable = true;
    }
  }

  // Feedback del Búho al arrancar
  if (!isProMode.value) speakOwl("Te he preparado un buen inicio. ¡Aprovéchalo!");
  else speakOwl("Azar puro y duro. Usa toda tu estrategia.");

  startTimer();
};

const drawCard = () => {
  if (deck.value.length > 0) {
    const card = deck.value.pop();
    card.isFaceUp = true;
    waste.value.push(card);
    playSound(sndMove);
    moveHistory.value.push({ action: 'draw', card });
  } else if (waste.value.length > 0) {
    deck.value = waste.value.reverse().map(c => ({ ...c, isFaceUp: false }));
    waste.value = [];
    playSound(sndSelect);
    moveHistory.value.push({ action: 'recycle' });
  }
  
  if (!checkForPossibleMoves()) triggerGameOver();
};

// ==========================================
// 👁️ 5. VISIÓN DEL BÚHO Y MENTORÍA ESTRATÉGICA
// ==========================================
const getAvailableCards = () => {
  const available = [];
  if (waste.value.length > 0) available.push({ card: waste.value[waste.value.length - 1], source: { type: 'waste' } });
  
  tableau.value.forEach((col, colIndex) => {
    col.forEach((card, rowIndex) => {
      if (card.isFaceUp) available.push({ card, source: { type: 'tableau', col: colIndex, rowIndex } });
    });
  });
  return available;
};

const generateSmartHint = () => {
  const availableCards = getAvailableCards();

  for (const { card, source } of availableCards) {
    const fIndex = getFoundationIndex(card.suit);
    const targetFoundation = foundations.value[fIndex];
    const topFCard = targetFoundation.length > 0 ? targetFoundation[targetFoundation.length - 1] : null;
    const isTopInTableau = source.type === 'tableau' ? source.rowIndex === tableau.value[source.col].length - 1 : true;
    
    if (isTopInTableau && ((!topFCard && card.value === 1) || (topFCard && card.value === topFCard.value + 1))) {
      return `¡Fíjate bien! Tienes un ${getCardName(card.value)} listo para asegurar en las bases.`;
    }
  }

  for (const { card, source } of availableCards) {
    for (let destCol = 0; destCol < 7; destCol++) {
      if (source.type === 'tableau' && source.col === destCol) continue;
      
      const targetColCards = tableau.value[destCol];
      const topColCard = targetColCards.length > 0 ? targetColCards[targetColCards.length - 1] : null;

      if ((!topColCard && card.value === 13) || (topColCard && topColCard.isFaceUp && isOppositeColor(card, topColCard) && card.value === topColCard.value - 1)) {
        if (card.value === 13 && source.type === 'tableau' && source.rowIndex === 0 && !topColCard) continue; 
        if (source.type === 'tableau' && source.rowIndex > 0) {
          const cardBelow = tableau.value[source.col][source.rowIndex - 1];
          if (!cardBelow.isFaceUp) {
             const colorName = card.color === 'red' ? 'rojo' : 'negro';
             return `Estratégicamente, podrías mover el ${getCardName(card.value)} ${colorName} para descubrir lo que hay debajo.`;
          }
        }
      }
    }
  }

  if (deck.value.length > 0) return "Toca el mazo, necesitamos explorar nuevas opciones.";
  if (waste.value.length > 0) return "Revisa la carta de descarte, puede ser clave.";
  
  return null; 
};

// ==========================================
// ⏱️ 6. CONTROL DE TIEMPO Y TRIGGERS
// ==========================================
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeElapsed.value++;
    if (timeElapsed.value % 10 === 0 && score.value > 0) score.value = Math.max(0, score.value - 2);

    const timeSinceLastMove = timeElapsed.value - lastMoveTime.value;
    if (timeSinceLastMove === 15 && !gameResult.value) {
      const hint = generateSmartHint();
      if (hint) speakOwl(hint); 
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
};

const resetBoard = () => {
  stopTimer();
  dealCards();
};

// ==========================================
// 🕵️ 7. DETECTIVE DE FIN DE PARTIDA (GAME OVER)
// ==========================================
const checkForPossibleMoves = () => {
  if (deck.value.length > 0 || waste.value.length > 0) return true;

  const availableCards = getAvailableCards();

  for (const { card, source } of availableCards) {
    const fIndex = getFoundationIndex(card.suit);
    const targetFoundation = foundations.value[fIndex];
    const topFCard = targetFoundation.length > 0 ? targetFoundation[targetFoundation.length - 1] : null;
    const isTopInTableau = source.type === 'tableau' ? source.rowIndex === tableau.value[source.col].length - 1 : true;
    
    if (isTopInTableau && ((!topFCard && card.value === 1) || (topFCard && card.value === topFCard.value + 1))) return true;

    for (let destCol = 0; destCol < 7; destCol++) {
      if (source.type === 'tableau' && source.col === destCol) continue;
      const targetColCards = tableau.value[destCol];
      const topColCard = targetColCards.length > 0 ? targetColCards[targetColCards.length - 1] : null;

      if ((!topColCard && card.value === 13) || (topColCard && topColCard.isFaceUp && isOppositeColor(card, topColCard) && card.value === topColCard.value - 1)) {
        if (card.value === 13 && source.type === 'tableau' && source.rowIndex === 0 && !topColCard) continue;
        return true; 
      }
    }
  }
  return false;
};

const triggerGameOver = () => {
  stopTimer();
  playSound(sndError); 
  speakOwl("El tablero se ha cerrado matemáticamente. ¡Vamos por la revancha!");
  gameResult.value = 'lose';
  winReason.value = `Juego trancado tras ${timeElapsed.value}s.`;
};

const checkWinCondition = () => {
  const isWin = foundations.value.every(f => f.length === 13);
  if (isWin) {
    stopTimer();
    playSound(sndWin);
    gameResult.value = 'win';
    winReason.value = `¡Completado en ${timeElapsed.value}s con ${score.value} pts!`;
    return true;
  }
  return false;
};

// ==========================================
// ⚡ 8. MOTOR PREDICTIVO (SMART TAPS)
// ==========================================
const isOppositeColor = (card1, card2) => card1.color !== card2.color;
const getFoundationIndex = (suit) => SUITS.indexOf(suit);

const handleCardClick = (card, source) => {
  if (!card.isFaceUp || gameResult.value) return;

  const fIndex = getFoundationIndex(card.suit);
  const targetFoundation = foundations.value[fIndex];
  const topFoundationCard = targetFoundation.length > 0 ? targetFoundation[targetFoundation.length - 1] : null;

  const canGoToFoundation = (!topFoundationCard && card.value === 1) || (topFoundationCard && card.value === topFoundationCard.value + 1);
  const isTopCardInTableau = source.type === 'tableau' ? source.rowIndex === tableau.value[source.col].length - 1 : true;

  if (canGoToFoundation && isTopCardInTableau) {
    executeMove(card, source, { type: 'foundation', col: fIndex });
    playSound(sndMove);
    score.value += 10;
    return;
  }

  for (let destCol = 0; destCol < 7; destCol++) {
    if (source.type === 'tableau' && source.col === destCol) continue;

    const targetColCards = tableau.value[destCol];
    const topColCard = targetColCards.length > 0 ? targetColCards[targetColCards.length - 1] : null;

    const canGoToTableau = (!topColCard && card.value === 13) || (topColCard && topColCard.isFaceUp && isOppositeColor(card, topColCard) && card.value === topColCard.value - 1);

    if (canGoToTableau) {
      executeMove(card, source, { type: 'tableau', col: destCol });
      playSound(sndMove);
      return;
    }
  }

  playSound(sndError);
};

// ==========================================
// 🏗️ 9. EJECUCIÓN Y REBOBINADO (UNDO)
// ==========================================
const executeMove = (card, source, destination) => {
  let flippedCard = null;
  const movedCards = extractCardsFromSource(source, card);
  insertCardsToDestination(destination, movedCards);

  if (source.type === 'tableau' && tableau.value[source.col].length > 0) {
    const newTopCard = tableau.value[source.col][tableau.value[source.col].length - 1];
    if (!newTopCard.isFaceUp) {
      newTopCard.isFaceUp = true;
      flippedCard = newTopCard;
      score.value += 5;
    }
  }

  moveHistory.value.push({
    source: { ...source },
    destination: { ...destination },
    cardsMoved: movedCards,
    autoFlippedCard: flippedCard
  });

  if (flippedCard) {
    const alientos = ["¡Excelente descubrimiento!", "¡Buena visión estratégica!", "¡Un paso más cerca de la meta!"];
    if (Math.random() > 0.4) speakOwl(alientos[Math.floor(Math.random() * alientos.length)]);
  }
  
  if (destination.type === 'foundation') {
    let totalInFoundations = foundations.value.reduce((acc, f) => acc + f.length, 0);
    if (card.value === 1) speakOwl("¡Genial, un As asegurado!");
    else if (card.value === 13) speakOwl("¡Rey a salvo, victoria matemática!");
    else if (totalInFoundations === 26) speakOwl("¡Llevas la mitad del juego dominado!");
    else if (totalInFoundations === 40) speakOwl("¡La victoria es inminente!");
  }

  lastMoveTime.value = timeElapsed.value;

  if (!checkWinCondition()) {
    if (!checkForPossibleMoves()) triggerGameOver();
  }
};

const undoMove = () => {
  if (moveHistory.value.length === 0) return;
  const lastMove = moveHistory.value.pop();

  if (lastMove.action === 'draw') {
    const card = waste.value.pop();
    card.isFaceUp = false;
    deck.value.push(card);
    return;
  }

  if (lastMove.action === 'recycle') {
    waste.value = deck.value.reverse().map(c => { c.isFaceUp = true; return c; });
    deck.value = [];
    return;
  }

  if (lastMove.source && lastMove.destination) {
    const { source, destination, cardsMoved, autoFlippedCard } = lastMove;

    if (autoFlippedCard) {
      autoFlippedCard.isFaceUp = false;
      score.value = Math.max(0, score.value - 5);
    }

    if (destination.type === 'foundation') {
      foundations.value[destination.col].pop();
      score.value = Math.max(0, score.value - 10);
    } else if (destination.type === 'tableau') {
      tableau.value[destination.col].splice(-cardsMoved.length);
    }

    if (source.type === 'waste') waste.value.push(cardsMoved[0]);
    else if (source.type === 'foundation') foundations.value[source.col].push(cardsMoved[0]);
    else if (source.type === 'tableau') tableau.value[source.col].push(...cardsMoved);

    playSound(sndMove); 
  }
};

const extractCardsFromSource = (source, card) => {
  if (source.type === 'waste') return [waste.value.pop()];
  if (source.type === 'foundation') return [foundations.value[source.col].pop()];
  if (source.type === 'tableau') return tableau.value[source.col].splice(source.rowIndex);
};

const insertCardsToDestination = (destination, cards) => {
  if (destination.type === 'foundation') foundations.value[destination.col].push(cards[0]);
  if (destination.type === 'tableau') tableau.value[destination.col].push(...cards);
};

onMounted(() => {
  const isStateCorrupted = !tableau.value || tableau.value.length !== 7;
  const isFirstTime = deck.value.length === 0 && waste.value.length === 0 && tableau.value.every(col => col.length === 0);

  if (isFirstTime || isStateCorrupted) {
    dealCards(); 
  } else {
    startTimer(); 
  }
});
</script>

<template>
  <div class="master-container">
    <main class="app-canvas font-inter bg-slate-900">
      
      <header class="header-standard shrink-0 bg-white shadow-sm z-10 relative">
        <div class="flex items-center gap-3">
          <div class="bg-emerald-600 p-2 rounded-xl shadow-[0_3px_0_rgb(4,120,87)]">
            <Gamepad2 class="text-white" :size="24" stroke-width="2.5" />
          </div>
          <div>
            <h2 class="game-title !text-emerald-700">Solitario Búho</h2>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Klondike</span>
              
              <span v-if="!isProMode" class="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-yellow-300">
                <GraduationCap :size="10" stroke-width="3" /> Entrenamiento
              </span>
              <span v-else class="flex items-center gap-1 bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-rose-300">
                <ShieldAlert :size="10" stroke-width="3" /> Justo (Pro)
              </span>

            </div>
          </div>
        </div>
        <button @click="emit('close')" class="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
          <CloseIcon :size="24" stroke-width="2.5" />
        </button>
      </header>

      <div class="flex-1 w-full max-w-4xl mx-auto p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 overflow-hidden relative">
        
        <div class="game-chassis flex-1 w-full flex flex-col gap-2 sm:gap-4 overflow-y-auto custom-scrollbar">
          
          <div class="w-[94%] sm:w-[88%] mx-auto flex flex-col gap-3 sm:gap-5 pb-6">
            
            <div class="grid grid-cols-7 gap-1.5 sm:gap-3 w-full shrink-0">
              <div class="card-slot cursor-pointer" @click="drawCard">
                 <div v-if="deck.length > 0" class="w-full h-full">
                    <CardItem :card="{ isFaceUp: false }" />
                 </div>
                 <div v-else class="empty-slot flex items-center justify-center">
                    <RotateCcw class="text-emerald-700 opacity-50" :size="24" />
                 </div>
              </div>

              <div class="card-slot relative">
                 <div v-if="waste.length > 0" 
                      @click="handleCardClick(waste[waste.length - 1], { type: 'waste' })"
                      class="absolute inset-0 cursor-pointer transition-transform hover:-translate-y-1 z-10">
                   <CardItem :card="waste[waste.length - 1]" />
                 </div>
                 <div v-if="waste.length > 1" class="absolute inset-0 bg-black/10 rounded-md sm:rounded-lg -translate-x-[2px] translate-y-[2px] pointer-events-none"></div>
              </div>

              <div class="empty-space"></div>

              <div v-for="(foundation, fIndex) in foundations" :key="'f-'+fIndex" class="card-slot relative">
                <div v-if="foundation.length === 0" class="empty-slot border-dashed absolute inset-0">
                   <span class="text-emerald-800 opacity-30 text-xl sm:text-2xl font-black">A</span>
                </div>
                <div v-else 
                     class="absolute inset-0 cursor-pointer transition-transform hover:-translate-y-1 z-10"
                     @click="handleCardClick(foundation[foundation.length - 1], { type: 'foundation', col: fIndex })">
                   <CardItem :card="foundation[foundation.length - 1]" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-7 gap-1.5 sm:gap-3 w-full items-start mt-1">
              <div v-for="(col, colIndex) in tableau" :key="'col-'+colIndex" class="flex flex-col w-full min-h-[100px] relative">
                
                <div v-if="col.length === 0" class="empty-slot border-dashed absolute top-0 left-0 w-full z-0"></div>
                
                <div v-for="(card, rowIndex) in col" :key="card.id"
                     @click="handleCardClick(card, { type: 'tableau', col: colIndex, rowIndex })"
                     class="w-full relative transition-transform"
                     :class="[
                       rowIndex > 0 ? (card.isFaceUp ? '-mt-[105%] sm:-mt-[110%]' : '-mt-[130%] sm:-mt-[135%]') : '', 
                       card.isFaceUp ? 'cursor-pointer z-10 hover:-translate-y-1' : 'z-0'
                     ]"
                     :style="{ zIndex: rowIndex }">
                  <div class="w-full aspect-[2/3] shadow-sm relative">
                    <CardItem :card="card" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="flex justify-between items-center px-1 pb-2 shrink-0 gap-2 overflow-x-auto no-scrollbar bg-slate-900 sm:bg-transparent pt-2 sm:pt-0">
          <button @click="undoMove" :disabled="moveHistory.length === 0" class="p-2 sm:p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 transition-colors shrink-0" title="Deshacer Movimiento">
            <Undo2 :size="20" stroke-width="2.5" />
          </button>
          
          <div class="flex flex-1 items-center justify-center gap-2 sm:gap-4">
            <div class="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-700">
              <Timer class="text-emerald-400" :size="14" />
              <span class="text-emerald-50 font-black text-xs sm:text-sm">{{ timeElapsed }}s</span>
            </div>
            <div class="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-700">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Pts</span>
              <span class="text-emerald-400 font-black text-xs sm:text-sm">{{ score }}</span>
            </div>
          </div>

          <button @click="resetBoard" class="px-3 py-2 sm:px-6 sm:py-3 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none uppercase font-black text-xs sm:text-sm tracking-wide shrink-0">
            Reiniciar
          </button>
        </div>

        <Transition name="bubble-pop">
          <div v-if="gameResult" class="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="w-full max-w-sm bg-white border-4 rounded-[2rem] p-6 shadow-2xl text-center flex flex-col items-center gap-4"
                 :class="gameResult === 'win' ? 'border-emerald-400' : 'border-rose-400'">
              
              <div class="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center -mt-12 shadow-lg"
                   :class="gameResult === 'win' ? 'bg-yellow-400 text-yellow-900' : 'bg-rose-100 text-rose-500'">
                <Trophy v-if="gameResult === 'win'" :size="40" stroke-width="2.5" />
                <Frown v-else :size="40" stroke-width="2.5" />
              </div>

              <div>
                <h3 class="text-3xl font-black uppercase tracking-tighter leading-none"
                    :class="gameResult === 'win' ? 'text-emerald-600' : 'text-rose-600'">
                  {{ gameResult === 'win' ? '¡Victoria!' : 'Juego Trancado' }}
                </h3>
                <p class="text-sm font-bold mt-2 text-slate-500">{{ winReason }}</p>
              </div>

              <div class="w-full flex flex-col gap-2 mt-2">
                <button @click="resetBoard" class="w-full py-4 text-white rounded-xl font-black text-lg active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase"
                        :class="gameResult === 'win' ? 'bg-emerald-500 shadow-[0_4px_0_rgb(22,163,74)]' : 'bg-rose-500 shadow-[0_4px_0_rgb(159,18,57)]'">
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

.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; -webkit-tap-highlight-color: transparent; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); width: 100vw; height: 100dvh; overflow: hidden; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 8px solid white; padding: 0; overflow: hidden; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 2px solid #f1f5f9; }
.game-title { font-size: clamp(1.2rem, 4vw, 1.8rem); font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }

.game-chassis {
  background: radial-gradient(circle at center, #065f46 0%, #064e3b 100%);
  border-radius: 16px;
  border: 4px solid #022c22;
  box-shadow: inset 0 10px 30px rgba(0,0,0,0.5);
  padding: 8px;
}

@media (min-width: 640px) { .game-chassis { padding: 12px; } }

.card-slot, .empty-slot {
  width: 100%;
  aspect-ratio: 2/3; 
  border-radius: 6px;
}

@media (min-width: 640px) { .card-slot, .empty-slot { border-radius: 8px; } }

.empty-slot {
  background-color: rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 8px; margin: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }

.error-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>