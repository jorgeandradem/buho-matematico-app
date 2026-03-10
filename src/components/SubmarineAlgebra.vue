<script setup>
/** * ARCHIVO: SubmarineAlgebra.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.2 + BOTÓN 3D AZUL + ICONO QUIRÚRGICO
 * LOGICA: Burbujas ascendentes + Inyección Atómica al Banco Central.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Trophy, X, Star, PlayCircle, RotateCcw, BookOpen, Waves, Target, Coins, Zap, ChevronRight } from 'lucide-vue-next';
import { gsap } from 'gsap';
import { useGamificationStore } from '@/stores/useGamificationStore';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- 1. SISTEMA DE RECOMPENSAS EN TIEMPO REAL ---
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const progress = ref(0); 

// --- 2. ESTADO DEL JUEGO ---
const bubbles = ref([]);
const currentEquation = ref(null);
const gameState = ref('rules'); 
const gameActive = ref(false);
let bubbleInterval = null;

const levelName = computed(() => {
  if (progress.value < 3) return 'Bronce (Sumas)';
  if (progress.value < 7) return 'Plata (Restas)';
  return 'Oro (Tablas)';
});

// Sonidos
const soundPop = new Audio(new URL('../assets/sounds/submarine/bubble_pop.mp3', import.meta.url).href);
const soundAmbient = new Audio(new URL('../assets/sounds/submarine/underwater_ambience.mp3', import.meta.url).href);
const soundCoins = new Audio('/audios/coins.mp3');

const formattedEquation = computed(() => {
  if (!currentEquation.value) return '';
  return currentEquation.value.text.replace(/x/g, '<span class="chalk-x-container"><span class="chalk-x">x</span></span>');
});

// --- 3. LÓGICA DE NAVEGACIÓN QUIRÚRGICA ---
const startGame = () => {
  gameState.value = 'playing';
  gameActive.value = true;
  generateEquation();
  if (!bubbleInterval) bubbleInterval = setInterval(spawnBubble, 1400);
  soundAmbient.play().catch(() => {});
};

const returnToRules = () => {
  gameActive.value = false;
  gameState.value = 'rules';
  bubbles.value = [];
};

// --- 4. MOTOR DEL JUEGO ---
const generateEquation = () => {
  let x, a, text, type;
  if (progress.value >= 7) {
    x = Math.floor(Math.random() * 9) + 1; a = Math.floor(Math.random() * 9) + 1;
    text = `${x * a} ÷ ${a} = x`; type = 'div';
  } else if (progress.value >= 4) {
    x = Math.floor(Math.random() * 10); a = Math.floor(Math.random() * 9) + 1; 
    text = `${a} × x = ${a * x}`; type = 'multi';
  } else if (progress.value >= 2) {
    x = Math.floor(Math.random() * 20); a = Math.floor(Math.random() * 20);
    text = `${x + a} - x = ${a}`; type = 'sub';
  } else {
    x = Math.floor(Math.random() * 20); a = Math.floor(Math.random() * 20);
    text = `x + ${a} = ${x + a}`; type = 'add';
  }
  currentEquation.value = { text, answer: x, type };
};

const spawnBubble = () => {
  if (!gameActive.value || gameState.value !== 'playing') return;
  const id = Date.now();
  const val = Math.random() > 0.7 ? currentEquation.value.answer : Math.floor(Math.random() * 40);
  bubbles.value.push({
    id, value: val, x: Math.random() * 250 + 20, y: -80, 
    size: 65, speed: 1.5 + (progress.value * 0.3), opacity: 1
  });
};

const animateBubbles = () => {
  if (gameActive.value) {
    bubbles.value.forEach((b, index) => {
      b.y += b.speed;
      if (b.y > window.innerHeight + 100) bubbles.value.splice(index, 1);
    });
  }
  requestAnimationFrame(animateBubbles);
};

const checkAnswer = (bubble) => {
  if (bubble.value === currentEquation.value.answer) {
    const pop = soundPop.cloneNode(); pop.play();
    const opType = currentEquation.value.type;
    if (opType === 'add') sessionCoins.value.copper += 1;
    else if (opType === 'sub') sessionCoins.value.copper += 5;
    else if (opType === 'multi') sessionCoins.value.silver += 1;
    else if (opType === 'div') sessionCoins.value.gold += 1;

    progress.value++;
    bubbles.value = [];
    if (progress.value >= 10) endGame();
    else generateEquation();
  } else { bubble.opacity = 0.3; }
};

const endGame = async () => {
  gameState.value = 'finished';
  gameActive.value = true;
  soundAmbient.pause();
  soundCoins.play().catch(() => {});
  
  await store.addMultipleCoins({...sessionCoins.value});
  await store.updateMissionProgress('complete_challenge', 1);
  
  triggerFinalEffects();
  emit('win', { ...sessionCoins.value });
};

const triggerFinalEffects = () => {
  const container = document.querySelector('.app-canvas');
  if (!container) return;

  const rainInterval = setInterval(() => {
    if (gameState.value !== 'finished') { clearInterval(rainInterval); return; }
    bubbles.value.push({
      id: Math.random(), value: '🫧', 
      x: Math.random() * window.innerWidth, y: -50,
      size: Math.random() * 40 + 20, speed: Math.random() * 4 + 2, opacity: 0.6
    });
  }, 150);

  for (let i = 0; i < 30; i++) {
    const coin = document.createElement('div');
    coin.innerHTML = ['🥇', '🥈', '🥉'][Math.floor(Math.random() * 3)];
    coin.className = 'absolute text-3xl z-[60] pointer-events-none';
    coin.style.left = Math.random() * 100 + '%';
    coin.style.top = '-50px';
    container.appendChild(coin);
    gsap.to(coin, {
      y: window.innerHeight + 100, x: (Math.random() - 0.5) * 200,
      rotation: Math.random() * 1080, duration: Math.random() * 2.5 + 1.5,
      ease: "power1.in", onComplete: () => coin.remove()
    });
  }
};

const resetGame = () => {
  progress.value = 0;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  bubbles.value = [];
  startGame();
};

onMounted(() => {
  animateBubbles();
  soundAmbient.loop = true;
  soundAmbient.volume = 0.3;
});

onBeforeUnmount(() => { clearInterval(bubbleInterval); soundAmbient.pause(); });
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas submarino-bg shadow-smartphone">
      
      <header v-if="gameState === 'playing'" class="header-standard shrink-0">
        <div class="trophy-section">
          <Trophy size="22" class="text-yellow-500" />
          <span class="text-xl font-black text-indigo-900">{{ progress }}/10</span>
        </div>
        <div class="session-loot-capsule">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>
        <button @click.prevent.stop="returnToRules" class="btn-close-circle"><X size="20" /></button>
      </header>

      <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 bg-[#0ea5e9] relative animate-fade-in">
        <button @click.prevent.stop="emit('close')" class="absolute top-4 right-4 bg-white/30 w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-75 transition-all z-[300]">
          <X size="28" stroke-width="3" />
        </button>

        <div class="flex flex-col items-center mt-6">
          <div class="text-7xl mb-4 animate-bounce">🌊</div>
          <h1 class="game-title text-white text-4xl uppercase font-black italic tracking-tighter">Submarine Algebra</h1>
        </div>

        <div class="rules-panel shadow-2xl w-full bg-[#0f172a]/90 border-2 border-[#38bdf8] backdrop-blur-md">
          <div class="rules-badge bg-[#fbbf24] text-[#020617] uppercase tracking-tighter font-black">Manual de Inmersión</div>
          <div class="p-6 space-y-6">
            <div class="flex gap-4 items-start text-white">
                <div class="bg-sky-500/20 p-2.5 rounded-lg shrink-0"><Target class="text-sky-300" size="24" /></div>
                <div>
                  <p class="font-black text-base text-sky-100 leading-tight">Calcula la incógnita X</p>
                  <p class="text-xs text-slate-300 leading-snug">Observa la pizarra y busca el número que falta en la operación.</p>
                </div>
            </div>
            <div class="flex gap-4 items-start text-white">
                <div class="bg-amber-500/20 p-2.5 rounded-lg shrink-0"><Zap class="text-amber-300" size="24" /></div>
                <div>
                  <p class="font-black text-base text-amber-100 leading-tight">Explota las burbujas</p>
                  <p class="text-xs text-slate-300 leading-snug">Toca el resultado correcto antes de que las burbujas escapen.</p>
                </div>
            </div>
            <div class="flex gap-4 items-start text-white">
                <div class="bg-green-500/20 p-2.5 rounded-lg shrink-0"><Coins class="text-green-300" size="24" /></div>
                <div>
                  <p class="font-black text-base text-green-100 leading-tight">Gana tu Botín</p>
                  <p class="text-xs text-slate-300 leading-snug">Junta 10 aciertos para ganar. ¡Suma: 🥉 | Resta: 🥈 | Multi: 🥇!</p>
                </div>
            </div>
          </div>
        </div>

        <button @click.prevent.stop="startGame" 
                class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                       text-white font-black italic text-xl uppercase rounded-[2rem] 
                       border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                       active:translate-y-[4px] active:border-b-[4px] transition-all 
                       flex items-center justify-center py-4 group mb-4">
            ¡EMPEZAR MISIÓN! 
            <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
            </div>
        </button>
      </div>

      <div v-else-if="gameState === 'playing'" class="game-content flex-1 flex flex-col items-center py-4 relative">
        <div class="equation-board z-20">
          <div class="equation-badge-surgical">Nivel: {{ levelName }}</div>
          <h2 v-if="currentEquation" class="equation-text shadow-xl"><span v-html="formattedEquation"></span></h2>
        </div>

        <div class="ocean-area">
          <div 
            v-for="bubble in bubbles" :key="bubble.id"
            class="bubble shadow-lg hover:scale-110 transition-transform"
            :style="{ left: bubble.x + 'px', bottom: bubble.y + 'px', width: bubble.size + 'px', height: bubble.size + 'px', opacity: bubble.opacity }"
            @pointerdown.prevent.stop="checkAnswer(bubble)"
          >
            {{ bubble.value }}
          </div>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center relative overflow-hidden">
        <div class="ocean-area pointer-events-none opacity-20">
           <div v-for="bubble in bubbles" :key="bubble.id" class="bubble" :style="{ left: bubble.x + 'px', bottom: bubble.y + 'px', width: bubble.size + 'px', height: bubble.size + 'px' }">{{ bubble.value }}</div>
        </div>

        <div class="bg-white p-8 rounded-[3rem] border-4 border-[#fbbf24] shadow-2xl flex flex-col items-center w-full max-w-[380px] z-[100] animate-fade-in uppercase italic">
          <Trophy size="80" class="text-[#fbbf24] mb-4 animate-bounce drop-shadow-lg" />
          <h2 class="text-3xl font-black text-indigo-900 mb-2">¡MISIÓN LOGRADA!</h2>
          
          <div class="bg-slate-50 rounded-3xl p-6 mb-8 w-full flex justify-around border-2 border-slate-100 shadow-inner">
            <div class="flex flex-col items-center"><img src="/images/coin-gold.png" class="w-10 h-10 mb-1" /><span class="text-2xl font-black text-slate-800">+{{ sessionCoins.gold }}</span></div>
            <div class="flex flex-col items-center border-x border-slate-200 px-4"><img src="/images/coin-silver.png" class="w-10 h-10 mb-1" /><span class="text-2xl font-black text-slate-800">+{{ sessionCoins.silver }}</span></div>
            <div class="flex flex-col items-center"><img src="/images/coin-copper.png" class="w-10 h-10 mb-1" /><span class="text-2xl font-black text-slate-800">+{{ sessionCoins.copper }}</span></div>
          </div>

          <div class="w-full flex flex-col gap-4">
            <button @click.prevent.stop="resetGame" 
                    class="w-full py-4 rounded-[2rem] text-xl font-black text-white bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] border-b-[8px] border-[#1E3A8A] shadow-lg active:translate-y-[4px] active:border-b-[4px] transition-all flex items-center justify-center">
              <RotateCcw size="24" class="mr-2" /> NUEVA RONDA
            </button>
            <button @click.prevent.stop="emit('close')" class="text-slate-400 py-1 font-black text-sm hover:text-indigo-600 tracking-widest opacity-70">
              TERMINAR
            </button>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; background-color: #f8fafc; transition: all 0.4s; width: 100vw; height: 100dvh; }
.submarino-bg { background: linear-gradient(180deg, #1e3a8a 0%, #080c14 100%); }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 100; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.btn-close-circle { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.equation-board { text-align: center; width: 100%; padding: 0 20px; }
.equation-badge-surgical { color: #ffffff; font-weight: 900; text-align: center; text-transform: uppercase; letter-spacing: 0.15em; font-size: 1rem; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0,0,0,0.6); }
.equation-text { background: rgba(15, 23, 42, 0.9); display: inline-flex; align-items: center; justify-content: center; min-height: 100px; padding: 15px 45px; border-radius: 2rem; color: white; font-size: 2.8rem; font-weight: 900; border: 3px solid #38bdf8; }

.ocean-area { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 5; }
.bubble { position: absolute; border-radius: 50%; background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.5), rgba(56, 189, 248, 0.15)); border: 2px solid rgba(255, 255, 255, 0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 2rem; cursor: pointer; z-index: 10; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }

:deep(.chalk-x) { font-family: 'Caveat', cursive; color: #fbbf24; font-size: 5rem; filter: drop-shadow(0px 0px 4px rgba(251, 191, 36, 0.5)); margin: 0 10px; }

.rules-panel { border-radius: 2.5rem; position: relative; margin-top: 1rem; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; font-size: 11px; font-weight: 900; padding: 4px 15px; border-radius: 9999px; }

.game-title { font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>