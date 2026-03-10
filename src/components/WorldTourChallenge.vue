<script setup>
/** * ARCHIVO: WorldTourChallenge.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.2 + BOTÓN 3D AZUL + ICONO QUIRÚRGICO
 * LOGICA: Expedición geográfica con transición optimizada y síntesis de voz.
 */
import { ref, computed, onMounted } from 'vue';
import { Trophy, X, Globe, MapPin, Zap, AlertTriangle, ChevronRight, PlayCircle, BookOpen } from 'lucide-vue-next';
import { worldTourData } from '../data/worldTourData';
import { useGamificationStore } from '../stores/useGamificationStore';
import { playSound } from '../utils/sound';
import CoinRain from './CoinRain.vue';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- 1. ESTADOS DE FLUJO ---
const gameState = ref('rules'); 
const currentRound = ref(1);
const QUESTIONS_COUNT = 10;
const step = ref(1);
const totalErrors = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

// --- 2. MOTOR DE JUEGO Y AUDIO ---
const isRotating = ref(false);
const showRain = ref(false);
const selectedAnswer = ref(null);
const isWrong = ref(false);
const revealFinalAnswer = ref(false);

const speakContinent = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); 
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.9;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
};

const playCustomSound = (file) => {
    const audio = new Audio(`/audios/${file}`);
    audio.volume = 0.9;
    audio.play().catch(e => console.warn("Audio bloqueado", e));
};

const continentPool = ["América", "Europa", "Asia", "África", "Oceanía", "Antártida"];
const shuffledPool = ref([...continentPool].sort(() => Math.random() - 0.5));

const currentChallenge = computed(() => {
  const index = (currentRound.value - 1) % continentPool.length;
  const cont = shuffledPool.value[index];
  const list = worldTourData.filter(d => d.continente === cont);
  return list[Math.floor(Math.random() * list.length)];
});

const logicalSplitHistory = computed(() => {
  const text = currentChallenge.value?.historia || "";
  const dotIndex = text.indexOf('. ');
  return dotIndex !== -1 ? { part1: text.substring(0, dotIndex+1), part2: text.substring(dotIndex+1).trim() } : { part1: text, part2: "" };
});

const targetFields = ref([
    ['a','b','res'][Math.floor(Math.random()*3)], 
    ['a','b','res'][Math.floor(Math.random()*3)]
]);
const isTarget = (r, f) => targetFields.value[r] === f;

const displayCell = (r, f) => {
  if (r === 1 && f === 'a' && !isTarget(1, 'a')) return currentChallenge.value.pasos[0].res;
  if (step.value === 1 && r === 1) return "?"; 
  if (isTarget(r, f)) {
      if (r === 1 && revealFinalAnswer.value) return currentChallenge.value.pasos[1][f];
      if (step.value === r + 1) return "?";
  }
  return currentChallenge.value.pasos[r][f];
};

const currentOptions = computed(() => {
  if (!currentChallenge.value) return [];
  const correct = currentChallenge.value.pasos[step.value - 1][targetFields.value[step.value - 1]];
  const opts = new Set([correct, correct + 2, Math.abs(correct - 1), correct + 1]);
  return Array.from(opts).slice(0, 3).sort(() => Math.random() - 0.5);
});

// --- 3. LÓGICA DE NAVEGACIÓN ---
const startChallenge = () => {
  gameState.value = 'playing';
  currentRound.value = 1;
  totalErrors.value = 0;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  playSound('click');
  setTimeout(() => speakContinent(currentChallenge.value.continente), 500);
};

const closeExpedition = () => {
    if (gameState.value === 'rules') emit('close');
    else { gameState.value = 'rules'; revealFinalAnswer.value = false; step.value = 1; }
};

const checkAnswer = (val) => {
  const correct = currentChallenge.value.pasos[step.value - 1][targetFields.value[step.value - 1]];
  selectedAnswer.value = val;
  if (val === correct) {
    isWrong.value = false;
    playCustomSound('correct1.mp3'); 
    
    // JERARQUÍA DE MONEDAS HOMOLOGADA
    const op = currentChallenge.value.pasos[step.value - 1].op;
    if (op === '+') sessionCoins.value.copper++; 
    else if (op === '-') sessionCoins.value.silver++;
    else sessionCoins.value.gold++; 
    
    if (step.value === 1) {
      setTimeout(() => { step.value = 2; selectedAnswer.value = null; }, 400);
    } else {
      revealFinalAnswer.value = true; 
      setTimeout(() => { handleMissionNext(); }, 1200);
    }
  } else {
    isWrong.value = true; totalErrors.value++;
    playSound('wrong'); setTimeout(() => { selectedAnswer.value = null; }, 600);
  }
};

const handleMissionNext = () => {
  if (currentRound.value < QUESTIONS_COUNT) {
    isRotating.value = true;
    playCustomSound('wrong1.mp3'); 
    setTimeout(() => {
      isRotating.value = false; currentRound.value++; step.value = 1;
      selectedAnswer.value = null; revealFinalAnswer.value = false;
      targetFields.value = [['a','b','res'][Math.floor(Math.random()*3)], ['a','b','res'][Math.floor(Math.random()*3)]];
      speakContinent(currentChallenge.value.continente);
    }, 1200);
  } else { finishGame(); }
};

const finishGame = async () => {
  gameState.value = 'finished'; showRain.value = true; playSound('coins');
  
  if (totalErrors.value > 6) sessionCoins.value = { gold: 0, silver: 0, copper: 5 };

  await store.completeWorldTourChallenge('gold', sessionCoins.value.gold);
  if (sessionCoins.value.silver > 0) await store.addCoins('silver', sessionCoins.value.silver);
  if (sessionCoins.value.copper > 0) await store.addCoins('copper', sessionCoins.value.copper);
  
  emit('win', { ...sessionCoins.value });
};

const resetGame = () => {
    gameState.value = 'rules';
    showRain.value = false;
    revealFinalAnswer.value = false;
    step.value = 1;
    currentRound.value = 1;
    totalErrors.value = 0;
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
};

onMounted(() => { document.body.style.overflow = 'hidden'; });

const getButtonClass = (opt) => {
  const base = "bg-white border-slate-200 text-slate-800";
  if (selectedAnswer.value !== opt) return base;
  return isWrong.value ? 'bg-red-500 border-red-700 text-white animate-shake' : 'bg-green-500 border-green-700 text-white scale-95';
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-white shadow-smartphone">
      
      <header v-if="gameState === 'playing'" class="header-standard shrink-0">
        <div class="trophy-section">
          <Trophy size="22" class="text-yellow-500" />
          <span class="text-xl font-black text-indigo-900">{{ currentRound }}/10</span>
        </div>
        <div class="session-loot-capsule">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>
        <button @click="closeExpedition" class="btn-close-circle"><X size="20" /></button>
      </header>

      <div class="game-content flex-1 flex flex-col relative overflow-hidden">
        
        <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in z-50">
            <button @click="closeExpedition" class="absolute top-4 right-4 bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all">
                <X size="24" stroke-width="3" />
            </button>
            <div class="flex flex-col items-center mt-6">
                <Globe size="80" class="text-indigo-600 mb-4 animate-pulse drop-shadow-xl" />
                <h1 class="game-title text-center text-4xl uppercase italic font-black text-indigo-900 tracking-tighter">Expedición Mundial</h1>
            </div>
            <div class="rules-panel shadow-2xl w-full">
                <div class="rules-badge uppercase font-black tracking-widest">Bitácora de Viaje</div>
                <div class="flex flex-col gap-5 p-2">
                    <div class="flex gap-4 items-start">
                        <div class="bg-indigo-100 p-2.5 rounded-xl shrink-0"><MapPin class="text-indigo-600" size="20" /></div>
                        <p class="text-sm font-bold text-slate-700 leading-tight">Escucha el nombre de cada continente al llegar a una nueva **Misión**.</p>
                    </div>
                    <div class="flex gap-4 items-start">
                        <div class="bg-green-100 p-2.5 rounded-xl shrink-0"><Zap class="text-green-600" size="20" /></div>
                        <p class="text-sm font-bold text-slate-700 leading-tight">Resuelve las estaciones de trabajo para desbloquear el siguiente país.</p>
                    </div>
                </div>
            </div>
            
            <button @click="startChallenge" 
                    class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                           text-white font-black italic text-xl uppercase rounded-[2rem] 
                           border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                           active:translate-y-[4px] active:border-b-[4px] transition-all 
                           flex items-center justify-center py-4 group">
                ¡INICIAR MISIÓN! 
                <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                    <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
                </div>
            </button>
        </div>

        <template v-else-if="gameState === 'playing'">
            <div class="flex-1 flex flex-col items-center py-2 px-2 relative w-full" :style="{ backgroundColor: currentChallenge?.color + '11' }">
                
                <div class="mission-tag-surgical z-20 mt-4 italic font-black">MISIÓN: {{ currentChallenge?.continente }}</div>

                <section class="w-full relative z-20 shrink-0 mt-6">
                  <div class="absolute -top-12 -left-2 w-24 h-24 globe-wrapper z-30 drop-shadow-2xl">
                    <div :class="['relative w-full h-full transition-transform duration-1000', { 'rotate-y-360': isRotating }]">
                      <svg viewBox="0 0 100 100" class="w-full h-full scale-90">
                        <circle cx="50" cy="50" r="48" fill="#3b82f6" stroke="#1e40af" stroke-width="1"/>
                        <path d="M30,40 Q35,30 45,35 T60,30 T75,45 T65,60 T50,70 T30,60 Z" fill="#22c55e" />
                      </svg>
                    </div>
                  </div>

                  <div class="flex flex-col gap-1.5 ml-14 pl-12 pr-4 pt-4 pb-3 bg-white border-4 border-yellow-400 rounded-3xl shadow-lg">
                    <div class="font-bold text-[14px] leading-tight text-slate-800">
                      <p>{{ logicalSplitHistory.part1 }}</p>
                      <p class="text-blue-600 font-extrabold">{{ logicalSplitHistory.part2 }}</p>
                    </div>
                  </div>
                  
                  <div class="bg-yellow-50 text-indigo-950 p-4 rounded-2xl shadow-md border-2 border-yellow-400 mt-4 mx-6">
                    <p class="font-black italic text-[15px] text-center leading-tight">{{ currentChallenge?.pregunta }}</p>
                  </div>
                </section>

                <section class="w-full h-[32%] flex flex-col justify-center bg-white rounded-[3.5rem] border-4 border-indigo-100 relative px-2 my-4 shadow-xl">
                  <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-700 px-8 py-1.5 rounded-full border-2 border-white shadow-md z-20">
                    <h2 class="font-black text-yellow-400 text-xs tracking-widest uppercase italic">Estaciones de Trabajo</h2>
                  </div>
                  
                  <div class="flex flex-col gap-3 py-2">
                    <div v-for="i in [1, 2]" :key="i" class="flex items-center justify-center gap-4 p-2 rounded-3xl transition-all h-[75px]"
                         :class="step === i ? 'bg-indigo-50 border-2 border-indigo-200 scale-105' : 'opacity-20 grayscale'">
                      
                      <span class="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-base shadow-md shrink-0">{{ i }}</span>
                      
                      <div class="flex items-center gap-1.5">
                        <div v-for="field in ['a', 'op', 'b', 'eq', 'res']" :key="field">
                          <span v-if="field === 'op'" class="font-black text-indigo-600 text-2xl mx-1">{{ currentChallenge?.pasos[i-1].op === 'x' ? '×' : currentChallenge?.pasos[i-1].op }}</span>
                          <span v-else-if="field === 'eq'" class="font-black text-slate-300 text-2xl mx-1">=</span>
                          <div v-else class="w-16 h-14 rounded-xl flex items-center justify-center font-black text-3xl border-2 shadow-sm"
                               :class="isTarget(i-1, field) ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-slate-50 border-slate-100'">
                            {{ displayCell(i-1, field) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="w-full grid grid-cols-3 gap-6 shrink-0 z-10 px-4 mt-auto mb-10">
                  <button v-for="(opt, idx) in currentOptions" :key="idx" @click="checkAnswer(opt)" :disabled="revealFinalAnswer"
                          :class="getButtonClass(opt)" 
                          class="h-32 rounded-3xl font-black text-6xl shadow-2xl border-b-[12px] transition-all active:translate-y-2">
                    {{ opt }}
                  </button>
                </section>
            </div>
        </template>

        <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 w-full animate-fade-in relative">
          <CoinRain v-if="showRain" type="gold" class="z-50" />
          <Trophy size="100" class="text-yellow-400 mb-6 animate-bounce drop-shadow-2xl" />
          <h2 class="victory-title text-white text-center mb-8 italic uppercase text-4xl font-black">¡Expedición Lograda!</h2>
          
          <div class="prize-card-large w-full bg-white/10 border-4 border-white/20 rounded-[3rem] p-8 mb-10 text-center backdrop-blur-md">
            <div class="flex justify-around w-full">
              <div class="flex flex-col items-center"><img src="/images/coin-gold.png" class="w-14 h-14" /><span class="font-black text-2xl text-yellow-400">+{{ sessionCoins.gold }}</span></div>
              <div class="flex flex-col items-center border-x border-white/10 px-6"><img src="/images/coin-silver.png" class="w-14 h-14" /><span class="font-black text-2xl text-slate-300">+{{ sessionCoins.silver }}</span></div>
              <div class="flex flex-col items-center"><img src="/images/coin-copper.png" class="w-14 h-14" /><span class="font-black text-2xl text-orange-400">+{{ sessionCoins.copper }}</span></div>
            </div>
          </div>

          <div class="w-full flex flex-col items-center gap-4 max-w-[320px]">
            <button @click="resetGame" 
                    class="w-full py-5 rounded-[2rem] text-2xl font-black italic uppercase text-white bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] border-b-[8px] border-[#1E3A8A] shadow-lg active:translate-y-[4px] active:border-b-[4px] transition-all">
              Nueva Misión
            </button>
            <button @click="emit('close')" class="w-full bg-white/10 text-white py-4 rounded-[2rem] font-black text-lg border-2 border-white/20 active:translate-y-1">SALIR AL PORTAL</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; touch-action: none !important; font-family: 'Inter', sans-serif !important; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; width: 100vw; height: 100dvh; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); border: 8px solid white; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.3rem; height: 1.3rem; object-fit: contain; }
.btn-close-circle { background: #fee2e2; color: #ef4444; width: 40px; height: 40px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

.mission-tag-surgical { background: #312e81; color: #fde047; padding: 6px 24px; border-radius: 9999px; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 2px; border: 2px solid #fde047; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }

.rules-panel { width: 95%; max-width: 420px; background: white; padding: 1.5rem; border-radius: 2.5rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

/* .btn-action-primary eliminado para usar Tailwind directo según norma v2.9.2 */

.game-title { letter-spacing: -0.05em; }
.globe-wrapper { perspective: 1000px; }
.rotate-y-360 { transform: rotateY(360deg); }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@keyframes shake { 0%, 100% { transform: translateX(0); } 25%, 75% { transform: translateX(-4px); } 50% { transform: translateX(4px); } }
.animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
* { -webkit-tap-highlight-color: transparent; }
</style>