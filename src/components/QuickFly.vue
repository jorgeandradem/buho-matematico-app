<script setup>
/** * ARCHIVO: QuickFly.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.2 + REGLAS DIDÁCTICAS
 * LOGICA: Desafío de cálculo mental rápido + Navegación Blindada
 */
import { ref, onMounted, computed } from 'vue';
import { X as CloseIcon, Trophy, Coins, Sparkles, MousePointer2, PlayCircle, BookOpen } from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

const props = defineProps({
  operation: { type: String, default: 'add' }, 
  tableNumber: { type: [Number, String], default: 'random' }
});

const emit = defineEmits(['back', 'close']); 
const gamificationStore = useGamificationStore();

// --- 1. ESTADO DEL JUEGO ---
const gameState = ref('rules'); // 'rules' | 'playing' | 'finished'
const QUESTIONS_COUNT = 10; 

const currentQuestionIndex = ref(0);
const score = ref(0);
const showCoinRain = ref(false);
const currentQuestion = ref(null);
const options = ref([]);
const feedbackMessage = ref('');
const feedbackColor = ref('');

const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const activeOp = ref('add');
const isAudioUnlocked = ref(false);

// --- 2. LÓGICA DE NAVEGACIÓN QUIRÚRGICA ---
const startGame = () => {
    gameState.value = 'playing';
    resetGame();
};

const closeQuickFly = () => {
    if (gameState.value === 'rules') {
        emit('close');
    } else {
        gameState.value = 'rules';
    }
};

// --- 3. MOTOR DEL JUEGO ---
const speakLoud = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0; 
    utterance.rate = 1.2;
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
};

const unlockAudio = () => {
    if (isAudioUnlocked.value) return;
    speakLoud(""); 
    isAudioUnlocked.value = true;
};

const getCurrencyType = (op) => {
  if (op === 'add') return 'copper';
  if (op === 'sub') return 'silver';
  return 'gold';
};

const opColorClass = computed(() => {
  if (activeOp.value === 'add') return 'text-blue-600 border-blue-200 bg-blue-50';
  if (activeOp.value === 'sub') return 'text-red-600 border-red-200 bg-red-50';
  if (activeOp.value === 'mult') return 'text-green-600 border-green-200 bg-green-50';
  return 'text-yellow-600 border-yellow-200 bg-yellow-50';
});

const generateQuestion = () => {
    let num1, num2, answer, symbol;
    const ops = ['add', 'sub', 'mult', 'div'];
    activeOp.value = ops[Math.floor(Math.random() * ops.length)];
    const table = props.tableNumber === 'random' ? Math.floor(Math.random() * 9) + 2 : parseInt(props.tableNumber);
    
    if (activeOp.value === 'add') {
        num1 = table; num2 = Math.floor(Math.random() * 10) + 1; answer = num1 + num2; symbol = '+';
    } else if (activeOp.value === 'sub') {
        num2 = Math.floor(Math.random() * 10) + 1; answer = table; num1 = num2 + answer; symbol = '-';
    } else if (activeOp.value === 'mult') {
        num1 = table; num2 = Math.floor(Math.random() * 10) + 1; answer = num1 * num2; symbol = '×';
    } else if (activeOp.value === 'div') {
        answer = table; num2 = Math.floor(Math.random() * 9) + 2; num1 = answer * num2; symbol = '÷';
    }

    let opts = new Set([answer]);
    while (opts.size < 3) {
        let fake = answer + Math.floor(Math.random() * 10) - 5;
        if (fake > 0 && fake !== answer) opts.add(fake);
    }
    options.value = Array.from(opts).sort(() => Math.random() - 0.5);
    currentQuestion.value = { num1, num2, symbol, answer };
};

const selectOption = async (selected) => {
    if (gameState.value !== 'playing') return;
    unlockAudio(); 

    if (selected === currentQuestion.value.answer) {
        score.value++;
        feedbackMessage.value = "¡Bien!";
        feedbackColor.value = "text-green-500";
        speakLoud("¡Bien!");

        const type = getCurrencyType(activeOp.value);
        sessionCoins.value[type]++;
        if (currentQuestionIndex.value < QUESTIONS_COUNT - 1) {
            currentQuestionIndex.value++;
            setTimeout(() => { feedbackMessage.value = ""; generateQuestion(); }, 500);
        } else {
            await finishGame();
        }
    } else {
        feedbackMessage.value = "¡Ups!";
        feedbackColor.value = "text-red-500";
        speakLoud("Ups");
        setTimeout(() => feedbackMessage.value = "", 800);
    }
};

const finishGame = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    const bonusType = getCurrencyType(activeOp.value);
    sessionCoins.value[bonusType] += 5;

    if (sessionCoins.value.gold > 0) await gamificationStore.addCoins('gold', sessionCoins.value.gold);
    if (sessionCoins.value.silver > 0) await gamificationStore.addCoins('silver', sessionCoins.value.silver);
    if (sessionCoins.value.copper > 0) await gamificationStore.addCoins('copper', sessionCoins.value.copper);
    
    speakLoud(`¡Reto completado!`);
};

const resetGame = () => {
    currentQuestionIndex.value = 0;
    score.value = 0;
    showCoinRain.value = false;
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 }; 
    generateQuestion();
};

onMounted(() => { if (gameState.value === 'playing') generateQuestion(); });
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-white shadow-smartphone">
      
      <div v-if="showCoinRain" class="absolute inset-0 z-[400] pointer-events-none">
          <CoinRain :type="getCurrencyType(activeOp)" :count="40" />
      </div>

      <header v-if="gameState !== 'rules'" class="header-fly shrink-0">
          <div class="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              <Trophy size="18" class="text-yellow-500" />
              <span class="font-black text-sm text-indigo-900">{{ currentQuestionIndex + 1 }}/10</span>
          </div>

          <div class="session-loot-capsule">
              <div class="coin-stat"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
              <div class="coin-stat border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
              <div class="coin-stat"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
          </div>

          <button @click="closeQuickFly" class="btn-close-fly">
              <CloseIcon :size="20" />
          </button>
      </header>

      <div class="game-content flex-1 flex flex-col items-center justify-between py-4 overflow-hidden relative">
          
          <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in z-50">
              <button @click="closeQuickFly" class="absolute top-4 right-4 bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all">
                  <CloseIcon size="24" stroke-width="3" />
              </button>

              <div class="flex flex-col items-center mt-6">
                  <Sparkles size="60" class="text-indigo-600 animate-bounce mb-2" />
                  <h1 class="game-title text-3xl">TABLAS RÁPIDAS</h1>
              </div>

              <div class="rules-panel-fly shadow-xl w-full">
                  <div class="rules-badge">MANUAL DEL PILOTO</div>
                  <div class="flex flex-col gap-5 p-2">
                      <div class="flex gap-4 items-start">
                          <div class="bg-indigo-100 p-2 rounded-xl"><BookOpen class="text-indigo-600" size="20" /></div>
                          <p class="text-sm font-bold text-slate-600">Observa la operación que aparece en la pantalla central.</p>
                      </div>
                      <div class="flex gap-4 items-start">
                          <div class="bg-green-100 p-2 rounded-xl"><MousePointer2 class="text-green-600" size="20" /></div>
                          <p class="text-sm font-bold text-slate-600">Elige la respuesta correcta entre las opciones lo más rápido posible.</p>
                      </div>
                      <div class="flex gap-4 items-start">
                          <div class="bg-amber-100 p-2 rounded-xl"><Coins class="text-amber-600" size="20" /></div>
                          <p class="text-sm font-bold text-slate-600">¡Suma: 🥉 | Resta: 🥈 | Mult/Div: 🥇! Gana un **Bono de +5** al terminar.</p>
                      </div>
                  </div>
              </div>

              <button @click="startGame" class="btn-action-primary w-full py-5 text-xl uppercase italic shadow-[0_6px_0_rgb(30,58,138)]">
                  ¡INICIAR VUELO! <PlayCircle class="ml-2" />
              </button>
          </div>

          <template v-else-if="gameState === 'playing'">
              <h1 class="title-fly shrink-0">Vuelo en Curso</h1>

              <div class="question-container-fly">
                  <div :class="['op-box-fly shadow-lg', opColorClass]">
                      <span>{{ currentQuestion?.num1 }}</span>
                      <span class="text-3xl opacity-50">{{ currentQuestion?.symbol }}</span>
                      <span>{{ currentQuestion?.num2 }}</span>
                  </div>

                  <div class="feedback-area">
                      <span v-if="feedbackMessage" :class="[feedbackColor, 'feedback-text animate-ping-once']">
                          {{ feedbackMessage }}
                      </span>
                  </div>

                  <div class="grid grid-cols-1 gap-3 w-full px-8">
                      <button v-for="opt in options" :key="opt" @click="selectOption(opt)" class="btn-option-fly shadow-md active:shadow-none">
                          {{ opt }}
                      </button>
                  </div>
              </div>
              <div class="h-10"></div>
          </template>

          <div v-else class="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 w-full animate-fade-in uppercase">
              <Trophy class="w-20 h-20 text-yellow-500 mb-4 drop-shadow-2xl animate-bounce" />
              <h2 class="victory-title">¡Misión Cumplida!</h2>
              
              <div class="prize-card-fly">
                  <div class="flex justify-around items-center w-full">
                      <div class="loot-item-final"><img src="/images/coin-gold.png" /><span>+{{ sessionCoins.gold }}</span></div>
                      <div class="loot-item-final border-x border-slate-200 px-6"><img src="/images/coin-silver.png" /><span>+{{ sessionCoins.silver }}</span></div>
                      <div class="loot-item-final"><img src="/images/coin-copper.png" /><span>+{{ sessionCoins.copper }}</span></div>
                  </div>
              </div>

              <div class="flex flex-col gap-4 w-full max-w-[280px]">
                  <button @click="startGame" class="btn-victory-primary py-4 uppercase font-black tracking-widest italic">OTRA CARRERA</button>
                  <button @click="emit('close')" class="btn-victory-secondary py-4 uppercase font-bold text-xs tracking-widest">SALIR AL PORTAL</button>
              </div>
          </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400&family=Inter:wght@400;700;900&display=swap');

.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; touch-action: none !important; font-family: 'Inter', sans-serif !important; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; width: 100vw; height: 100dvh; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; } }

.header-fly { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 50; }

.session-loot-capsule {
    display: flex; align-items: center; background: white; padding: 6px 16px;
    border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.coin-stat { display: flex; align-items: center; gap: 0.4rem; padding: 0 8px; }
.coin-stat img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.coin-stat span { font-weight: 900; font-size: 0.85rem; color: #1e293b; }

.btn-close-fly { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

.title-fly { font-size: 1.5rem; font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; margin-bottom: 0.5rem; }

.question-container-fly { width: 100%; max-width: 400px; display: flex; flex-direction: column; align-items: center; }
.op-box-fly { display: flex; align-items: center; justify-content: center; gap: 1rem; width: 90%; padding: 1.5rem; border-radius: 2.5rem; border-width: 6px; font-size: 4rem; font-weight: 900; }

.btn-option-fly { width: 100%; background: white; border-bottom: 6px solid #e2e8f0; font-size: 3rem; font-weight: 900; padding: 0.75rem; border-radius: 2rem; transition: transform 0.1s; color: #1e293b; }
.btn-option-fly:active { transform: translateY(4px); border-bottom-width: 2px; }

.rules-panel-fly { width: 92%; max-width: 400px; background: white; padding: 1.5rem; border-radius: 2rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

.btn-action-primary { background: #4f46e5; color: white; border-radius: 2rem; font-weight: 900; transition: all 0.1s; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-action-primary:active { transform: translateY(5px); }

.victory-title { font-size: 2.5rem; font-weight: 900; color: #312e81; font-style: italic; line-height: 1; margin-bottom: 1.5rem; text-align: center; }
.prize-card-fly { background: white; border: 4px solid #f1f5f9; border-radius: 3rem; padding: 2rem; width: 100%; max-width: 320px; margin-bottom: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
.loot-item-final { display: flex; flex-direction: column; align-items: center; }
.loot-item-final img { width: 2.5rem; height: 2.5rem; margin-bottom: 4px; }
.loot-item-final span { font-size: 1.5rem; font-weight: 900; color: #1e293b; }

.btn-victory-primary { width: 100%; background: #f59e0b; color: white; font-weight: 900; border-radius: 1.25rem; box-shadow: 0 6px 0 #b45309; }
.btn-victory-secondary { width: 100%; background: #94a3b8; color: white; border-radius: 1.25rem; }

.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.feedback-area { height: 2rem; margin: 0.5rem 0; }
.feedback-text { font-size: 1.5rem; font-weight: 900; text-transform: uppercase; }
</style>