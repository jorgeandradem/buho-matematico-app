<script setup>
/** * ARCHIVO: TABLAS RÁPIDAS - QuickFly.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.5 - CONSOLIDACIÓN MOTOR DE VOZ FINAL
 * LOGICA: Silencio absoluto en juego. Locución quirúrgica en reglas y premiación.
 */
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { 
    X as CloseIcon, Trophy, Coins, MousePointer2, 
    PlayCircle, BookOpen, ChevronRight, Volume2 
} from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';

const props = defineProps({
  operation: { type: String, default: 'add' }, 
  tableNumber: { type: [Number, String], default: 'random' }
});

const emit = defineEmits(['back', 'close']); 
const gamificationStore = useGamificationStore();

// --- 🔊 MOTOR DE VOZ UNIFICADO (Web Speech API) ---
const speak = (text, mood = 'intro') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';

    // Configuración de estados según Compendio Maestro
    if (mood === 'gold') {
        utterance.pitch = 1.4; // Entusiasta y aguda
        utterance.rate = 1.1; 
    } else if (mood === 'silver') {
        utterance.pitch = 1.0; 
        utterance.rate = 1.0;
    } else if (mood === 'copper') {
        utterance.pitch = 0.8; // Grave y pausada (aliento)
        utterance.rate = 0.9;
    } else {
        // Modo 'intro' o instrucciones
        utterance.pitch = 1.1;
        utterance.rate = 1.0;
    }

    window.speechSynthesis.speak(utterance);
};

// Función para narrar las instrucciones iniciales
const vocalizeRules = () => {
    speak("¡Bienvenido a Tablas Rápidas! Observa la operación en la pantalla central y elige la respuesta correcta lo más rápido posible. ¡Suma cobre, resta plata y multiplica o divide para ganar oro!");
};

// --- 1. ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
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

// --- ⚡ WATCHERS ---
watch(gameState, (newState) => {
    if (newState === 'rules') {
        vocalizeRules();
    }
});

// --- 2. LÓGICA DE NAVEGACIÓN ---
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

// --- 3. MOTOR DEL JUEGO & AUDIO (.MP3 INTACTOS) ---
const playCorrectAudio = () => {
    const audio = new Audio('/audios/correct1.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => {});
};

const playErrorAudio = () => {
    const audio = new Audio('/audios/wrong1.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
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

    if (selected === currentQuestion.value.answer) {
        playCorrectAudio(); // ✅ Audio MP3
        score.value++;
        feedbackMessage.value = "¡Bien!";
        feedbackColor.value = "text-green-500";
        
        // SILENCIO EN JUEGO: Se elimina locución "¡Bien!"

        gamificationStore.updateMissionProgress('quick_fly_answer', 1);

        const type = getCurrencyType(activeOp.value);
        sessionCoins.value[type]++;
        
        if (currentQuestionIndex.value < QUESTIONS_COUNT - 1) {
            currentQuestionIndex.value++;
            setTimeout(() => { feedbackMessage.value = ""; generateQuestion(); }, 500);
        } else {
            await finishGame();
        }
    } else {
        playErrorAudio(); // ❌ Audio MP3
        feedbackMessage.value = "¡Ups!";
        feedbackColor.value = "text-red-500";
        // SILENCIO EN JUEGO: Se elimina locución "Ups"
        setTimeout(() => feedbackMessage.value = "", 800);
    }
};

const finishGame = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    gamificationStore.updateMissionProgress('play_any_game', 1);

    const bonusType = getCurrencyType(activeOp.value);
    sessionCoins.value[bonusType] += 5;

    // Vocalización de Salida: Narra premio y botín
    let mood = score.value === QUESTIONS_COUNT ? 'gold' : (score.value >= 7 ? 'silver' : 'copper');
    const finalMsg = `¡Misión cumplida! Has ganado un botín de ${sessionCoins.value.gold} monedas de oro, ${sessionCoins.value.silver} de plata y ${sessionCoins.value.copper} de cobre.`;
    speak(finalMsg, mood);

    if (sessionCoins.value.gold > 0) await gamificationStore.addCoins('gold', sessionCoins.value.gold);
    if (sessionCoins.value.silver > 0) await gamificationStore.addCoins('silver', sessionCoins.value.silver);
    if (sessionCoins.value.copper > 0) await gamificationStore.addCoins('copper', sessionCoins.value.copper);
};

const resetGame = () => {
    currentQuestionIndex.value = 0;
    score.value = 0;
    showCoinRain.value = false;
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 }; 
    generateQuestion();
};

onMounted(() => { 
    if (gameState.value === 'rules') vocalizeRules();
    if (gameState.value === 'playing') generateQuestion(); 
});

onUnmounted(() => {
    window.speechSynthesis.cancel(); // Limpieza obligatoria
});
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas shadow-smartphone bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1]">
      
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
              <button @click="closeQuickFly" class="absolute top-4 right-4 bg-white/50 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all shadow-sm">
                  <CloseIcon size="24" stroke-width="3" />
              </button>

              <div class="flex flex-col items-center mt-6">
                  <div class="rocket-3d-wrap animate-rocket-float">
                      <div class="rocket-body">
                          <div class="rocket-window">
                              <div class="rocket-glass"></div>
                          </div>
                      </div>
                      <div class="rocket-fin left"></div>
                      <div class="rocket-fin right"></div>
                      <div class="rocket-thruster"></div>
                      <div class="rocket-fire"></div>
                  </div>
                  <h1 class="game-title text-4xl uppercase font-black italic text-indigo-900 mt-4 drop-shadow-md">Tablas Rápidas</h1>
              </div>

              <div class="rules-panel-fly shadow-2xl w-full bg-white relative">
                  <button @click="vocalizeRules" 
                          class="absolute -top-3 -right-3 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-white">
                      <Volume2 size="24" />
                  </button>

                  <div class="rules-badge uppercase font-black tracking-widest">Manual del Piloto</div>
                  <div class="flex flex-col gap-5 p-2">
                      <div class="flex gap-4 items-start">
                          <div class="bg-indigo-100 p-2.5 rounded-xl"><BookOpen class="text-indigo-600" size="20" /></div>
                          <p class="text-sm font-bold text-slate-700 leading-tight">Observa la operación que aparece en la pantalla central.</p>
                      </div>
                      <div class="flex gap-4 items-start">
                          <div class="bg-green-100 p-2.5 rounded-xl"><MousePointer2 class="text-green-600" size="20" /></div>
                          <p class="text-sm font-bold text-slate-700 leading-tight">Elige la respuesta correcta lo más rápido posible.</p>
                      </div>
                      <div class="flex gap-4 items-start">
                          <div class="bg-amber-100 p-2.5 rounded-xl"><Coins class="text-amber-600" size="20" /></div>
                          <p class="text-sm font-bold text-slate-700 leading-tight">¡Suma cobre, Resta plata y Multi/Div gana oro! Bono de +5.</p>
                      </div>
                  </div>
              </div>

              <button @click="startGame" 
                      class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                             text-white font-black italic text-xl uppercase rounded-[2rem] 
                             border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                             active:translate-y-[4px] active:border-b-[4px] transition-all 
                             flex items-center justify-center py-4 group mt-4">
                  ¡INICIAR VUELO! 
                  <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                      <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
                  </div>
              </button>
          </div>

          <template v-else-if="gameState === 'playing'">
              <h1 class="title-fly shrink-0 drop-shadow-sm">Vuelo en Curso</h1>

              <div class="question-container-fly">
                  <div :class="['op-box-fly shadow-2xl', opColorClass]">
                      <span>{{ currentQuestion?.num1 }}</span>
                      <span class="text-3xl opacity-50">{{ currentQuestion?.symbol }}</span>
                      <span>{{ currentQuestion?.num2 }}</span>
                  </div>

                  <div class="feedback-area">
                      <span v-if="feedbackMessage" :class="[feedbackColor, 'feedback-text animate-ping-once drop-shadow-md']">
                          {{ feedbackMessage }}
                      </span>
                  </div>

                  <div class="grid grid-cols-1 gap-3 w-full px-8">
                      <button v-for="opt in options" :key="opt" @click="selectOption(opt)" 
                              class="btn-option-fly shadow-lg active:shadow-none bg-white border-b-6 border-slate-300 text-3xl font-black p-3 rounded-2xl active:translate-y-1 active:border-b-2 transition-all text-slate-800">
                          {{ opt }}
                      </button>
                  </div>
              </div>
              <div class="h-10"></div>
          </template>

          <div v-else class="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/90 backdrop-blur-sm w-full animate-fade-in uppercase z-50">
              <Trophy class="w-24 h-24 text-yellow-500 mb-4 drop-shadow-xl animate-bounce" />
              <h2 class="victory-title text-indigo-950 font-black italic">¡Misión Cumplida!</h2>
              
              <div class="prize-card-fly border-b-[10px] border-indigo-100 bg-white">
                  <div class="flex justify-around items-center w-full">
                      <div class="loot-item-final"><img src="/images/coin-gold.png" class="w-10 h-10" /><span class="text-2xl font-black">+{{ sessionCoins.gold }}</span></div>
                      <div class="loot-item-final border-x border-slate-200 px-6"><img src="/images/coin-silver.png" class="w-10 h-10" /><span class="text-2xl font-black">+{{ sessionCoins.silver }}</span></div>
                      <div class="loot-item-final"><img src="/images/coin-copper.png" class="w-10 h-10" /><span class="text-2xl font-black">+{{ sessionCoins.copper }}</span></div>
                  </div>
              </div>

              <div class="flex flex-col gap-4 w-full max-w-[280px]">
                  <button @click="startGame" 
                          class="w-full bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                                 text-white py-4 rounded-[1.5rem] font-black italic uppercase 
                                 border-b-[6px] border-[#1E3A8A] shadow-lg active:translate-y-[2px] active:border-b-[2px] transition-all">
                      OTRA CARRERA
                  </button>
                  <button @click="emit('close')" class="text-slate-500 py-2 font-bold text-xs tracking-widest hover:text-indigo-600">SALIR AL PORTAL</button>
              </div>
          </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
/* (Se mantienen los estilos originales sin cambios para no romper el blindaje visual) */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; touch-action: none !important; height: 100dvh; top: 0; left: 0; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: all 0.4s; user-select: none; width: 100vw; height: 100dvh; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }
.header-fly { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-bottom: 2px solid rgba(255,255,255,0.5); z-index: 50; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.coin-stat { display: flex; align-items: center; gap: 0.4rem; padding: 0 8px; font-weight: 900; color: #1e293b; }
.coin-stat img { width: 1.2rem; height: 1.2rem; }
.btn-close-fly { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.rocket-3d-wrap { position: relative; width: 60px; height: 100px; margin-bottom: 20px; transform: rotate(15deg); }
.rocket-body { position: absolute; top: 0; left: 10px; width: 40px; height: 80px; background: linear-gradient(90deg, #e2e8f0 0%, #ffffff 50%, #cbd5e1 100%); border-radius: 50% 50% 10px 10px / 100% 100% 10px 10px; border: 2px solid #94a3b8; box-shadow: inset -5px -5px 10px rgba(0,0,0,0.1); z-index: 2; }
.rocket-window { position: absolute; top: 25px; left: 50%; transform: translateX(-50%); width: 20px; height: 20px; background: #94a3b8; border-radius: 50%; display: flex; justify-content: center; align-items: center; }
.rocket-glass { width: 14px; height: 14px; background: radial-gradient(circle at 30% 30%, #bae6fd, #3b82f6); border-radius: 50%; box-shadow: inset -2px -2px 4px rgba(0,0,0,0.2); }
.rocket-fin { position: absolute; bottom: 20px; width: 20px; height: 30px; background: linear-gradient(90deg, #ef4444, #b91c1c); border: 2px solid #9f1239; z-index: 1; }
.rocket-fin.left { left: -5px; border-radius: 20px 0 0 5px; transform: skewY(-20deg); }
.rocket-fin.right { right: -5px; border-radius: 0 20px 5px 0; transform: skewY(20deg); }
.rocket-thruster { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); width: 20px; height: 10px; background: #475569; border-radius: 0 0 5px 5px; z-index: 1; }
.rocket-fire { position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); width: 14px; height: 30px; background: linear-gradient(180deg, #facc15, #ef4444, transparent); border-radius: 50% 50% 20% 20%; z-index: 0; animation: exhaust 0.1s infinite alternate; }
@keyframes exhaust { 0% { height: 25px; background: linear-gradient(180deg, #fde047, #f97316, transparent); } 100% { height: 35px; background: linear-gradient(180deg, #fef08a, #ef4444, transparent); } }
.animate-rocket-float { animation: rfloat 3s ease-in-out infinite; }
@keyframes rfloat { 0%, 100% { transform: translateY(0) rotate(15deg); } 50% { transform: translateY(-10px) rotate(18deg); } }
.title-fly { font-size: 1.5rem; font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; margin-bottom: 0.5rem; }
.question-container-fly { width: 100%; max-width: 400px; display: flex; flex-direction: column; align-items: center; }
.op-box-fly { display: flex; align-items: center; justify-content: center; gap: 1rem; width: 90%; padding: 1.5rem; border-radius: 2.5rem; border-width: 6px; font-size: 3.5rem; font-weight: 900; background: white; }
.rules-panel-fly { width: 92%; max-width: 400px; padding: 2rem 1.5rem; border-radius: 2.5rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -14px; left: 1.5rem; background: #4f46e5; color: white; font-size: 11px; padding: 5px 15px; border-radius: 9999px; }
.victory-title { font-size: 2.5rem; line-height: 1; margin-bottom: 1.5rem; text-align: center; }
.prize-card-fly { border: 4px solid #f1f5f9; border-radius: 3rem; padding: 2rem; width: 100%; max-width: 320px; margin-bottom: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
.loot-item-final { display: flex; flex-direction: column; align-items: center; }
.loot-item-final img { width: 2.5rem; height: 2.5rem; }
.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.feedback-area { height: 2.5rem; margin: 0.5rem 0; }
.feedback-text { font-size: 1.6rem; font-weight: 900; text-transform: uppercase; }
</style>