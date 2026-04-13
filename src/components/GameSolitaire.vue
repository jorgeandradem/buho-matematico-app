<script setup>
/** * ARCHIVO: GameSolitaire.vue
 * NOTA INTERNA: SOLITARIO KLONDIKE v4.4 - REGLAS INTEGRADAS + FINANZAS
 * LÓGICA: Modal de instrucciones añadido. Cobro de 15 cobres por Re-Play, Auto-Switch de selección.
 */
import { ref, onMounted } from 'vue';
import { X as CloseIcon, User, RotateCcw, Trophy, Club, Star, MousePointerClick, Info } from 'lucide-vue-next';
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
const sndFlip = new Audio('/audios/card-flip.mp3'); 
const sndPlace = new Audio('/audios/card-place.mp3'); 
const sndSpecial = new Audio('/audios/win-jingle-soft.mp3'); 

const playSound = (audioElement) => {
  if (!audioElement) return;
  audioElement.currentTime = 0;
  audioElement.play().catch(() => {});
};

// ==========================================
// 🧠 2. ESTADO GLOBAL DEL SOLITARIO
// ==========================================
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const foundationPlaceholders = ['♥', '♦', '♣', '♠']; 
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const isRed = (suit) => suit === 'hearts' || suit === 'diamonds';

const stock = ref([]);
const waste = ref([]);
const foundations = ref([[], [], [], []]);
const tableaus = ref([[], [], [], [], [], [], []]);

const selectedArea = ref(null); 
const moveError = ref(false); 
const gameResult = ref(null);
const winReason = ref('');

const score = ref(0); 
const movesCount = ref(0);

const showRules = ref(false); // 🌟 ESTADO PARA EL MODAL DE REGLAS

// ==========================================
// 🃏 LÓGICA DE INICIALIZACIÓN (AZAR PURO)
// ==========================================
const createDeck = () => {
  let deck = [];
  for (let s of suits) {
    for (let v = 0; v < values.length; v++) {
      deck.push({ id: `${s}-${v}`, suit: s, value: v + 1, label: values[v], color: isRed(s) ? 'red' : 'black', faceUp: false });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const dealCards = () => {
  stock.value = []; waste.value = [];
  foundations.value = [[], [], [], []];
  tableaus.value = [[], [], [], [], [], [], []];
  selectedArea.value = null;
  score.value = 0;
  movesCount.value = 0;
  gameResult.value = null;

  let deck = createDeck();

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      let card = deck.pop();
      if (row === col) card.faceUp = true;
      tableaus.value[col].push(card);
    }
  }
  stock.value = deck; 
};

onMounted(() => { dealCards(); }); 

// 🌟 COBRO POR REINICIAR (15 COBRES)
const handleReplayClick = async () => {
  if (gamificationStore.totalWealthInCopper >= 15) {
    const success = await gamificationStore.payRecreationEntry(15);
    if (success) {
      playSound(sndFlip); 
      dealCards(); 
    }
  } else {
    gamificationStore.bubbleMessage = "¡No tienes 15 monedas de cobre para jugar otra vez!";
    emit('close'); 
  }
};

// ==========================================
// 🕹️ FÍSICA DE MOVIMIENTO E INTERACCIÓN
// ==========================================
const triggerError = () => {
  moveError.value = true;
  setTimeout(() => moveError.value = false, 300);
};

const incrementMoves = () => { movesCount.value++; };

const handleStockClick = () => {
  if (selectedArea.value) selectedArea.value = null;

  if (stock.value.length > 0) {
    let card = stock.value.pop();
    card.faceUp = true;
    waste.value.push(card);
    incrementMoves();
    playSound(sndFlip);
  } else if (waste.value.length > 0) {
    waste.value.forEach(c => c.faceUp = false);
    stock.value = waste.value.reverse();
    waste.value = [];
    incrementMoves();
    playSound(sndFlip); 
  }
};

const selectCard = (area, col, index) => {
  selectedArea.value = { area, col, index };
  playSound(sndPlace); 
};

const clearSelection = () => { selectedArea.value = null; };

const handleBoardClick = () => {
  clearSelection();
};

// --- VALIDACIONES ---
const canMoveToTableau = (movingCard, targetCard) => {
  if (!targetCard) return movingCard.value === 13; 
  return movingCard.color !== targetCard.color && movingCard.value === targetCard.value - 1;
};

const canMoveToFoundation = (movingCard, foundationIndex) => {
  const topCard = foundations.value[foundationIndex][foundations.value[foundationIndex].length - 1];
  if (!topCard) return movingCard.value === 1; 
  return movingCard.suit === topCard.suit && movingCard.value === topCard.value + 1;
};

// 🌟 CEREBRO DE AUTO-MOVIMIENTO
const attemptAutoMove = (area, colIndex, cardIndex) => {
  let card = null;
  let sourceStack = null;
  let isBottomCard = false;

  if (area === 'waste') {
    sourceStack = waste.value;
    card = sourceStack[cardIndex];
    isBottomCard = cardIndex === sourceStack.length - 1;
  } else if (area === 'tableau') {
    sourceStack = tableaus.value[colIndex];
    card = sourceStack[cardIndex];
    isBottomCard = cardIndex === sourceStack.length - 1;
  }

  if (!card) return false;

  if (isBottomCard) {
    for (let i = 0; i < foundations.value.length; i++) {
      if (canMoveToFoundation(card, i)) {
        foundations.value[i].push(sourceStack.pop());
        score.value += 15;
        incrementMoves();
        playSound(sndSpecial);
        if (area === 'tableau') setTimeout(() => revealTopCard(colIndex), 200);
        clearSelection();
        checkWin();
        return true;
      }
    }
  }

  if (card.value === 13) {
    if (area === 'tableau' && cardIndex === 0) return false;

    const emptyColIdx = tableaus.value.findIndex(col => col.length === 0);
    if (emptyColIdx !== -1) {
      let movingCards = [];
      if (area === 'waste') {
        movingCards = [sourceStack.pop()];
      } else if (area === 'tableau') {
        movingCards = sourceStack.splice(cardIndex);
      }
      tableaus.value[emptyColIdx].push(...movingCards);
      incrementMoves();
      playSound(sndPlace);
      if (area === 'tableau') setTimeout(() => revealTopCard(colIndex), 200);
      clearSelection();
      return true; 
    }
  }

  return false; 
};

// --- EJECUCIÓN DE CLICS (CON AUTO-DESBLOQUEO FLUIDO) ---
const handleWasteClick = () => {
  if (waste.value.length === 0) return;
  if (!selectedArea.value) {
    if (attemptAutoMove('waste', null, waste.value.length - 1)) return;
    selectCard('waste', null, waste.value.length - 1);
  } else if (selectedArea.value.area === 'waste') {
    clearSelection();
  } else {
    clearSelection();
    selectCard('waste', null, waste.value.length - 1);
  }
};

const handleFoundationClick = (fIndex) => {
  if (selectedArea.value) {
    let movingCard = null;
    let fromStack = null;

    if (selectedArea.value.area === 'waste') {
      movingCard = waste.value[waste.value.length - 1];
      fromStack = waste.value;
    } else if (selectedArea.value.area === 'tableau') {
      const col = tableaus.value[selectedArea.value.col];
      if (selectedArea.value.index === col.length - 1) {
        movingCard = col[col.length - 1];
        fromStack = col;
      }
    }

    if (movingCard && canMoveToFoundation(movingCard, fIndex)) {
      foundations.value[fIndex].push(fromStack.pop());
      score.value += 15; 
      incrementMoves();
      playSound(sndSpecial);
      if (selectedArea.value.area === 'tableau') {
        setTimeout(() => revealTopCard(selectedArea.value.col), 200);
      }
      clearSelection();
      checkWin();
    } else {
      clearSelection();
      const fCol = foundations.value[fIndex];
      if (fCol.length > 0) {
        selectCard('foundation', fIndex, fCol.length - 1);
      } else {
        triggerError();
      }
    }
  } else {
    const fCol = foundations.value[fIndex];
    if (fCol.length > 0) {
      selectCard('foundation', fIndex, fCol.length - 1);
    }
  }
};

const handleTableauClick = (colIndex, cardIndex) => {
  const col = tableaus.value[colIndex];
  const targetCard = col[col.length - 1];

  if (!selectedArea.value) {
    if (col[cardIndex] && col[cardIndex].faceUp) {
      if (attemptAutoMove('tableau', colIndex, cardIndex)) return;
      selectCard('tableau', colIndex, cardIndex);
    }
  } else {
    if (selectedArea.value.area === 'tableau' && selectedArea.value.col === colIndex) {
      clearSelection(); 
      if (col[cardIndex] && col[cardIndex].faceUp) {
        selectCard('tableau', colIndex, cardIndex);
      }
      return;
    }

    let movingCards = [];
    let fromStack = null;
    let originColIndex = null;

    if (selectedArea.value.area === 'waste') {
      movingCards = [waste.value[waste.value.length - 1]];
      fromStack = waste.value;
    } else if (selectedArea.value.area === 'foundation') {
      movingCards = [foundations.value[selectedArea.value.col][foundations.value[selectedArea.value.col].length - 1]];
      fromStack = foundations.value[selectedArea.value.col];
    } else if (selectedArea.value.area === 'tableau') {
      originColIndex = selectedArea.value.col;
      fromStack = tableaus.value[originColIndex];
      movingCards = fromStack.slice(selectedArea.value.index);
    }

    if (movingCards.length > 0 && canMoveToTableau(movingCards[0], targetCard)) {
      col.push(...movingCards);
      fromStack.splice(fromStack.length - movingCards.length, movingCards.length);
      incrementMoves();
      playSound(sndPlace); 
      
      if (originColIndex !== null) {
        setTimeout(() => revealTopCard(originColIndex), 200);
      }
      
      clearSelection();
    } else {
      clearSelection();
      if (col[cardIndex] && col[cardIndex].faceUp) {
        selectCard('tableau', colIndex, cardIndex);
      } else {
        triggerError();
      }
    }
  }
};

const handleEmptyTableauClick = (colIndex) => {
  if (tableaus.value[colIndex].length === 0) {
    handleTableauClick(colIndex, -1);
  }
};

const revealTopCard = (colIndex) => {
  if (colIndex === null) return;
  const col = tableaus.value[colIndex];
  if (col.length > 0 && !col[col.length - 1].faceUp) {
    col[col.length - 1].faceUp = true;
    score.value += 5; 
    playSound(sndFlip); 
  }
};

const checkWin = () => {
  if (foundations.value.every(f => f.length === 13)) {
    gameResult.value = 'win';
    winReason.value = `¡Baraja completada en ${movesCount.value} movimientos!`;
  }
};

const isSelected = (area, col, index) => {
  if (!selectedArea.value) return false;
  return selectedArea.value.area === area && selectedArea.value.col === col && selectedArea.value.index === index;
};

const getCardColorClass = (suit) => isRed(suit) ? 'text-red-600' : 'text-black';
</script>

<template>
  <div class="master-container">
    <main class="app-canvas font-inter">
      
      <header class="header-standard shrink-0">
        <div class="flex items-center gap-3">
          <div class="bg-emerald-600 p-2 rounded-xl shadow-[0_3px_0_rgb(4,120,87)]">
            <Club class="text-white" :size="24" stroke-width="2.5" />
          </div>
          <div>
            <h2 class="game-title !text-emerald-700">Solitario</h2>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Paciencia y Orden</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showRules = true" class="bg-emerald-50 p-2 rounded-full hover:bg-emerald-100 transition-colors text-emerald-600 border border-emerald-200" title="Ver Reglas">
            <Info :size="24" stroke-width="2.5" />
          </button>
          <button @click="emit('close')" class="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
            <CloseIcon :size="24" stroke-width="2.5" />
          </button>
        </div>
      </header>

      <div :class="[
        'flex-1 flex flex-col items-center justify-center w-full px-4 gap-4 overflow-hidden relative pb-4',
        props.allowLandscape ? 'landscape:flex-row landscape:justify-around landscape:gap-6' : ''
      ]">
        
        <div :class="[
          'w-full max-w-sm flex justify-between items-end px-2 shrink-0',
          props.allowLandscape ? 'landscape:w-1/4 landscape:flex-col landscape:items-center landscape:justify-center landscape:gap-6 landscape:h-full' : 'mt-2'
        ]">
          <div class="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 w-full landscape:flex-col landscape:text-center">
            <div class="bg-yellow-100 p-2 rounded-xl text-yellow-600"><Star :size="20" fill="currentColor"/></div>
            <div>
              <span class="block text-slate-400 font-black text-[10px] uppercase tracking-widest leading-none mb-0.5">Puntaje</span>
              <span class="block text-slate-800 font-black text-lg leading-none">{{ score }} <span class="text-sm text-slate-400">PTS</span></span>
            </div>
          </div>
          <div class="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 w-full landscape:flex-col landscape:text-center">
            <div class="bg-blue-100 p-2 rounded-xl text-blue-600"><MousePointerClick :size="20" /></div>
            <div>
              <span class="block text-slate-400 font-black text-[10px] uppercase tracking-widest leading-none mb-0.5">Movimientos</span>
              <span class="block text-slate-800 font-black text-lg leading-none">{{ movesCount }}</span>
            </div>
          </div>
        </div>

        <div @click="handleBoardClick" :class="[
          'game-chassis shadow-2xl flex-1 w-full max-w-4xl min-h-[45vh] max-h-[68vh]',
          props.allowLandscape ? 'landscape:w-2/4 landscape:h-[90%] landscape:max-w-none' : ''
        ]">
          <div class="chassis-inner-shadow flex flex-col p-3 sm:p-4 gap-3 h-full relative">
            
            <div class="grid grid-cols-6 gap-1 sm:gap-2 h-[14%] min-h-[4rem] w-full shrink-0">
              
              <div class="card-slot relative cursor-pointer h-full aspect-[2.5/3.5]" @click.stop="handleStockClick">
                <template v-if="stock.length > 5">
                  <div class="card-back absolute inset-0 rounded-lg border-2 border-white translate-y-[4px] translate-x-[2px] shadow-sm"></div>
                  <div class="card-back absolute inset-0 rounded-lg border-2 border-white translate-y-[2px] translate-x-[1px] shadow-sm"></div>
                </template>
                
                <div v-if="stock.length > 0" class="card-back absolute inset-0 rounded-lg border-2 border-white shadow-md z-10"></div>
                <div v-else class="absolute inset-0 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.5)] border border-green-900/40 bg-black/10 flex items-center justify-center">
                    <RotateCcw class="text-green-950 opacity-40" :size="24" />
                </div>
              </div>
              
              <div class="card-slot relative cursor-pointer h-full aspect-[2.5/3.5]" @click.stop="handleWasteClick">
                <div class="absolute inset-0 rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.5)] border border-green-900/40 bg-black/10"></div>
                
                <div v-if="waste.length > 0" :class="['playing-card absolute inset-0 shadow-md transition-all duration-300 ease-in-out', getCardColorClass(waste[waste.length-1].suit), isSelected('waste', null, waste.length-1) ? 'laser-selected scale-[1.03] z-50' : '']">
                  <span class="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 text-[10px] sm:text-xs font-black leading-none">{{ waste[waste.length-1].label }}</span>
                  <span class="absolute top-3.5 left-1 sm:top-4.5 sm:left-1.5 text-[10px] sm:text-xs leading-none">{{ suitSymbols[waste[waste.length-1].suit] }}</span>
                  <span class="text-2xl sm:text-4xl m-auto font-bold">{{ suitSymbols[waste[waste.length-1].suit] }}</span>
                </div>
              </div>

              <div v-for="(f, i) in foundations" :key="'f'+i" class="card-slot relative cursor-pointer h-full aspect-[2.5/3.5]" @click.stop="handleFoundationClick(i)">
                <div class="absolute inset-0 flex items-center justify-center font-black text-3xl sm:text-5xl rounded-lg shadow-[inset_0_4px_6px_rgba(0,0,0,0.5)] border border-green-900/40 bg-black/10">
                  <span :class="foundationPlaceholders[i] === '♥' || foundationPlaceholders[i] === '♦' ? 'text-red-500 drop-shadow-md' : 'text-slate-800 drop-shadow-md'">
                    {{ foundationPlaceholders[i] }}
                  </span>
                </div>
                
                <div v-if="f.length > 0" :class="['playing-card z-10 absolute inset-0 shadow-md transition-all duration-300 ease-in-out', getCardColorClass(f[f.length-1].suit), isSelected('foundation', i, f.length-1) ? 'laser-selected scale-[1.03] z-20' : '']">
                  <span class="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 text-[10px] sm:text-xs font-black leading-none">{{ f[f.length-1].label }}</span>
                  <span class="text-2xl sm:text-4xl m-auto font-bold">{{ suitSymbols[f[f.length-1].suit] }}</span>
                </div>
              </div>
              
            </div>

            <div class="grid grid-cols-7 gap-1 sm:gap-2 flex-1 relative mt-2">
              <div v-for="(col, colIdx) in tableaus" :key="'t'+colIdx" class="relative w-full h-full cursor-pointer" @click.stop="handleEmptyTableauClick(colIdx)">
                
                <div class="card-slot absolute top-0 w-full aspect-[2.5/3.5] rounded-lg flex items-center justify-center border-2 border-dashed border-green-900/30 bg-green-800/10">
                   <span v-if="col.length === 0" class="text-green-950/40 font-black text-xl">K</span>
                </div>

                <template v-for="(card, cIdx) in col" :key="card.id">
                  <div @click.stop="handleTableauClick(colIdx, cIdx)"
                       :style="{ top: `calc(${cIdx} * clamp(10px, 1.8vh, 18px))`, zIndex: cIdx + 10 }"
                       :class="[
                         'absolute w-full aspect-[2.5/3.5] rounded-md sm:rounded-lg cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out',
                         card.faceUp ? 'playing-card ' + getCardColorClass(card.suit) : 'card-back border border-slate-700',
                         isSelected('tableau', colIdx, cIdx) ? 'laser-selected z-50' : '',
                         moveError && isSelected('tableau', colIdx, cIdx) ? 'animate-shake' : ''
                       ]">
                    
                    <template v-if="card.faceUp">
                      <span class="absolute top-0.5 left-1 sm:top-1 sm:left-1.5 text-[10px] sm:text-xs font-black leading-none">{{ card.label }}</span>
                      <span class="absolute top-3.5 left-1 sm:top-4.5 sm:left-1.5 text-[10px] sm:text-xs leading-none">{{ suitSymbols[card.suit] }}</span>
                      <span class="text-2xl sm:text-4xl m-auto font-bold">{{ suitSymbols[card.suit] }}</span>
                    </template>

                  </div>
                </template>
              </div>
            </div>

          </div>
        </div>

        <div :class="[
          'w-full max-w-sm flex justify-between items-center px-2 shrink-0',
          props.allowLandscape ? 'landscape:w-1/4 landscape:flex-col-reverse landscape:items-center landscape:justify-center landscape:gap-4 landscape:h-full' : ''
        ]">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-lg bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
              <User class="text-slate-600" :size="20" />
            </div>
            <div>
              <span class="block text-slate-700 font-black text-sm uppercase leading-none mb-0.5">Tú</span>
              <span class="block text-slate-400 font-bold text-[10px] uppercase">Solitario Klondike</span>
            </div>
          </div>
          <button @click="handleReplayClick" class="p-3 rounded-lg bg-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-300 transition-colors" title="Pagar 15 cobres y Reiniciar">
            <RotateCcw :size="20" stroke-width="2.5" />
          </button>
        </div>

        <Transition name="bubble-pop">
          <div v-if="showRules" class="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border-4 border-emerald-400 bg-white flex flex-col items-center gap-4 relative">
              <div class="w-16 h-16 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 flex items-center justify-center -mt-12 shadow-lg">
                <Info :size="32" stroke-width="2.5" />
              </div>
              <h3 class="text-2xl font-black uppercase tracking-tighter leading-none text-emerald-800">Reglas del Juego</h3>
              <div class="text-slate-600 text-sm font-medium space-y-3 text-left w-full">
                <p><strong>🎯 Objetivo:</strong> Mover todas las cartas a las 4 "Fundaciones" (huecos con símbolos), ordenadas por palo desde el As (A) hasta el Rey (K).</p>
                <p><strong>🕹️ El Tablero:</strong> Apila cartas en orden descendente y <strong>alternando colores</strong> (ej. un 6 Negro sobre un 7 Rojo). Si vacías una columna, solo puedes colocar un Rey (K) ahí.</p>
                <p><strong>🃏 El Mazo:</strong> Si te quedas sin movimientos, toca el mazo superior izquierdo para sacar una nueva carta. ¡Úsalo sabiamente!</p>
              </div>
              <button @click="showRules = false" class="w-full py-3 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-lg transition-all uppercase shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none">
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
                <button @click="emit('close')" class="w-full py-3 bg-transparent rounded-xl font-bold text-sm uppercase transition-colors text-slate-400 hover:text-slate-700 transition-colors">
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
  background: radial-gradient(circle, #166534 0%, #064e3b 100%); 
  border-radius: 16px; 
  border-bottom: 8px solid #451a03; border-right: 6px solid #451a03; border-top: 4px solid #92400e; border-left: 4px solid #92400e;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.chassis-inner-shadow { 
  width: 100%; height: 100%; border-radius: 8px; 
  box-shadow: inset 0px 8px 20px rgba(0,0,0,0.6); 
  overflow: hidden; 
}

.card-slot { width: 100%; }

.playing-card {
  background: linear-gradient(to bottom right, #ffffff, #f1f5f9);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  border-radius: 0.5rem;
  box-shadow: 0 3px 6px rgba(0,0,0,0.4), inset 0 -2px 0 rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.8);
  border: 1px solid #cbd5e1; font-family: Arial, Helvetica, sans-serif;
}

.card-back {
  background: repeating-linear-gradient(45deg, #1e3a8a, #1e3a8a 4px, #172554 4px, #172554 8px); 
  border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); border-radius: 0.5rem;
}

.laser-selected { 
  box-shadow: 0 0 15px rgba(250, 204, 21, 0.8) !important; 
  border: 2px solid #facc15 !important; 
}

.animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>