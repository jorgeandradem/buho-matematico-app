<script setup>
/** * ARCHIVO: SUBMARINE ALGEBRA - SubmarineAlgebra.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v4.0 + BLINDAJE DVH + CSS 3D SUBMARINO
 * LOGICA: Burbujas ascendentes, pantalla de victoria retenida, CoinRain integrado.
 * ESTADO VISUAL: Capas opacas eliminadas. Transparencia y océano profundo restaurado.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Trophy, X, PlayCircle, RotateCcw, Target, Coins, Zap, ChevronRight } from 'lucide-vue-next';
import { useGamificationStore } from '@/stores/useGamificationStore';
import CoinRain from './CoinRain.vue';

const emit = defineEmits(['close']);
const store = useGamificationStore();

// --- 1. SISTEMA DE RECOMPENSAS EN TIEMPO REAL ---
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const progress = ref(0); 
const showCoinRain = ref(false);

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

const formattedEquation = computed(() => {
  if (!currentEquation.value) return '';
  return currentEquation.value.text.replace(/x/g, '<span class="chalk-x-container"><span class="chalk-x">x</span></span>');
});

// --- 3. LÓGICA DE NAVEGACIÓN ---
const startGame = () => {
  gameState.value = 'playing';
  gameActive.value = true;
  showCoinRain.value = false;
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
    id, value: val, x: Math.random() * (window.innerWidth * 0.7), y: -80, 
    size: 65, speed: 1.5 + (progress.value * 0.3), opacity: 1
  });
};

const animateBubbles = () => {
  if (gameState.value === 'playing' || gameState.value === 'finished') {
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

    store.updateMissionProgress('submarine_bubble_pop', 1);

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
  gameActive.value = false; 
  showCoinRain.value = true; 
  
  soundAmbient.pause();
  new Audio('/audios/finish.mp3').play().catch(() => {}); 
  
  store.updateMissionProgress('play_any_game', 1);
  await store.addMultipleCoins({...sessionCoins.value});
  await store.updateMissionProgress('complete_challenge', 1);
  
  triggerFinalEffects(); 
};

const triggerFinalEffects = () => {
  const rainInterval = setInterval(() => {
    if (gameState.value !== 'finished') { clearInterval(rainInterval); return; }
    bubbles.value.push({
      id: Math.random(), value: '🫧', 
      x: Math.random() * window.innerWidth, y: -50,
      size: Math.random() * 40 + 20, speed: Math.random() * 4 + 2, opacity: 0.6
    });
  }, 150);
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
  <div class="master-container font-inter select-none">
    
    <CoinRain v-if="showCoinRain" type="gold" :count="40" />

    <main class="app-canvas submarino-bg">
      
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

      <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 relative animate-fade-in z-50">
        <button @click.prevent.stop="emit('close')" class="absolute top-4 right-4 bg-white/10 w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-75 transition-all z-[300] border border-white/20 backdrop-blur-sm">
          <X size="24" stroke-width="2.5" />
        </button>

        <div class="flex flex-col items-center mt-6 text-center">
          
          <div class="submarine-3d-epic animate-sub-float">
              <div class="sub-periscope"></div>
              <div class="sub-cabin"></div>
              <div class="sub-body">
                  <div class="sub-window"><div class="glass-reflection"></div></div>
                  <div class="sub-stripe"></div>
              </div>
              <div class="sub-propeller-box"><div class="propeller animate-spin-fast"></div></div>
              <div class="sub-bubbles">
                  <div class="s-bub b1"></div><div class="s-bub b2"></div><div class="s-bub b3"></div>
              </div>
          </div>

          <h1 class="game-title drop-shadow-lg mt-2">Submarine Algebra</h1>
        </div>

        <div class="rules-panel shadow-2xl w-full max-w-[420px] bg-[#0f172a]/80 border-2 border-[#38bdf8]/50 backdrop-blur-md">
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
                       flex items-center justify-center py-4 group mb-4 mt-2">
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

        <div class="ocean-area z-10">
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

      <div v-else class="flex flex-col items-center justify-center p-6 animate-fade-in text-center z-10 w-full h-full overflow-y-auto relative">
        
        <div class="ocean-area pointer-events-none opacity-40 absolute inset-0 z-0">
           <div v-for="bubble in bubbles" :key="bubble.id" class="bubble" :style="{ left: bubble.x + 'px', bottom: bubble.y + 'px', width: bubble.size + 'px', height: bubble.size + 'px' }">{{ bubble.value }}</div>
        </div>

        <Trophy size="100" class="text-[#fbbf24] mb-4 drop-shadow-2xl animate-bounce shrink-0 z-10" />
        <h2 class="text-4xl font-black text-white italic tracking-tighter uppercase shrink-0 z-10 drop-shadow-md">¡Misión Lograda!</h2>
        
        <div class="bg-[#0f172a]/80 backdrop-blur-md w-full max-w-[340px] p-8 rounded-[2.5rem] shadow-2xl mt-6 border-4 border-[#38bdf8]/50 shrink-0 z-10 relative">
            <p class="text-[#38bdf8] font-black uppercase text-[10px] tracking-[0.2em] mb-4">Botín Rescatado</p>
            <div class="flex justify-around items-center w-full">
                <div class="flex flex-col items-center">
                    <img src="/images/coin-gold.png" class="w-10 h-10 mb-1 drop-shadow-md" />
                    <span class="text-2xl font-black text-amber-400">+{{ sessionCoins.gold }}</span>
                </div>
                <div class="flex flex-col items-center border-x border-slate-600/50 px-6">
                    <img src="/images/coin-silver.png" class="w-12 h-12 mb-1 drop-shadow-md" />
                    <span class="text-4xl font-black text-slate-200">+{{ sessionCoins.silver }}</span>
                </div>
                <div class="flex flex-col items-center">
                    <img src="/images/coin-copper.png" class="w-10 h-10 mb-1 drop-shadow-md" />
                    <span class="text-2xl font-black text-orange-400">+{{ sessionCoins.copper }}</span>
                </div>
            </div>
        </div>
        
        <div class="w-full max-w-[340px] flex flex-col gap-3 mt-8 z-10">
            <button @click.prevent.stop="resetGame" class="w-full btn-main-ocean shrink-0 flex items-center justify-center">
                <RotateCcw size="20" class="mr-2" /> NUEVA RONDA
            </button>
            <button @click.prevent.stop="emit('close')" class="text-slate-300 py-3 font-black text-xs hover:text-[#38bdf8] tracking-widest uppercase active:scale-95 transition-all">
                Regresar a la Base
            </button>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* CONTENEDOR MAESTRO (FONDO PANTALLA EXTERIOR PC) */
.master-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9; /* Fondo gris claro profesional fuera de la app */
  overflow: hidden;
  touch-action: none !important;
}

/* LIENZO DE LA APP (CANVAS) */
.app-canvas {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  touch-action: none !important;
  -webkit-tap-highlight-color: transparent;
  width: 100vw;
  height: 100dvh;
}

/* GRADIENTE DEL OCÉANO PROFUNDO - Es el fondo real de toda la app */
.submarino-bg { 
  background: linear-gradient(180deg, #1e3a8a 0%, #080c14 100%); 
}

/* ADAPTACIÓN PROGRESIVA PC */
@media (min-width: 1025px) {
  .app-canvas {
    width: 1024px; 
    height: 90dvh;
    border-radius: 45px;
    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
    border: 8px solid white;
  }
}
@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; }
}

/* ESTILOS DE COMPONENTES HOMOLOGADOS */
.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 100; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.btn-close-circle { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.btn-close-circle:active { transform: scale(0.85); }

/* --- 🌊 BOTÓN OCEAN v4.0 --- */
.btn-main-ocean { background: linear-gradient(to bottom, #0ea5e9, #0284c7); color: white; padding: 1.2rem; border-radius: 2rem; border-bottom: 6px solid #0369a1; font-size: 1.2rem; font-weight: 900; text-transform: uppercase; box-shadow: 0 10px 20px rgba(2, 132, 199, 0.3); transition: 0.1s; cursor: pointer;}
.btn-main-ocean:active { transform: translateY(4px); border-bottom-width: 2px; }

/* --- 🌊 SUBMARINO 3D CSS ESPECTACULAR --- */
.submarine-3d-epic { position: relative; width: 140px; height: 100px; margin-bottom: 1.5rem; }
.sub-body { position: absolute; bottom: 10px; left: 20px; width: 120px; height: 60px; background: linear-gradient(180deg, #fde047 0%, #eab308 40%, #b45309 100%); border-radius: 40px 60px 60px 40px; border: 4px solid #451a03; box-shadow: inset -5px -5px 15px rgba(0,0,0,0.3), 0 15px 20px rgba(0,0,0,0.4); z-index: 3; overflow: hidden; }
.sub-stripe { position: absolute; top: 50%; left: 0; width: 100%; height: 8px; background: #451a03; transform: translateY(-50%); opacity: 0.8; }
.sub-cabin { position: absolute; top: 10px; left: 60px; width: 45px; height: 25px; background: linear-gradient(180deg, #facc15, #ca8a04); border: 4px solid #451a03; border-bottom: none; border-radius: 15px 15px 0 0; z-index: 2; }
.sub-periscope { position: absolute; top: -10px; left: 75px; width: 8px; height: 25px; background: #94a3b8; border: 2px solid #0f172a; z-index: 1; }
.sub-periscope::after { content: ''; position: absolute; top: -2px; left: 0px; width: 16px; height: 8px; background: #ef4444; border-radius: 4px; border: 2px solid #0f172a; }
.sub-window { position: absolute; top: 10px; left: 60px; width: 32px; height: 32px; background: radial-gradient(circle at 30% 30%, #bae6fd, #0284c7); border-radius: 50%; border: 4px solid #451a03; box-shadow: inset -2px -2px 5px rgba(0,0,0,0.5), 0 0 0 2px #facc15; z-index: 4; }
.glass-reflection { position: absolute; top: 4px; left: 4px; width: 10px; height: 6px; background: rgba(255,255,255,0.6); border-radius: 50%; transform: rotate(-30deg); }
.sub-propeller-box { position: absolute; bottom: 25px; left: 5px; width: 20px; height: 30px; background: #475569; border: 4px solid #0f172a; border-radius: 5px 0 0 5px; z-index: 2; }
.propeller { position: absolute; top: -5px; left: -10px; width: 10px; height: 32px; background: #94a3b8; border-radius: 5px; border: 2px solid #0f172a; }

.animate-spin-fast { animation: prop-spin 0.08s linear infinite alternate; }
@keyframes prop-spin { 0% { transform: scaleY(1); } 100% { transform: scaleY(0.2); } }
.animate-sub-float { animation: subFloat 3s ease-in-out infinite; }
@keyframes subFloat { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-2deg); } }

.sub-bubbles .s-bub { position: absolute; background: rgba(255,255,255,0.6); border-radius: 50%; bottom: 30px; left: -10px; animation: sBubbles 1.5s linear infinite; }
.sub-bubbles .b1 { width: 8px; height: 8px; animation-delay: 0s; }
.sub-bubbles .b2 { width: 12px; height: 12px; animation-delay: 0.5s; left: -15px; }
.sub-bubbles .b3 { width: 6px; height: 6px; animation-delay: 1s; left: -5px; }
@keyframes sBubbles { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(-30px, -40px) scale(1.5); opacity: 0; } }

/* PIZARRA DE ECUACIONES */
.equation-board { text-align: center; width: 100%; padding: 0 20px; }
.equation-badge-surgical { color: #ffffff; font-weight: 900; text-align: center; text-transform: uppercase; letter-spacing: 0.15em; font-size: 1rem; margin-bottom: 1rem; text-shadow: 0 4px 8px rgba(0,0,0,0.6); }
.equation-text { background: rgba(15, 23, 42, 0.9); display: inline-flex; align-items: center; justify-content: center; min-height: 100px; padding: 15px 45px; border-radius: 2rem; color: white; font-size: 2.5rem; font-weight: 900; border: 3px solid #38bdf8; }

.ocean-area { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 5; overflow: hidden; pointer-events: none; }
.bubble { pointer-events: auto; position: absolute; border-radius: 50%; background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.5), rgba(56, 189, 248, 0.15)); border: 2px solid rgba(255, 255, 255, 0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 2rem; cursor: pointer; z-index: 10; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }

:deep(.chalk-x) { font-family: 'Caveat', cursive; color: #fbbf24; font-size: 5rem; filter: drop-shadow(0px 0px 4px rgba(251, 191, 36, 0.5)); margin: 0 10px; }

/* REGLAS ESTILOS (Sin fondos que tapen el océano) */
.rules-panel { border-radius: 1.75rem; position: relative; margin-bottom: 1rem; padding: 1.5rem; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; font-size: 11px; padding: 4px 15px; border-radius: 9999px; }
.game-title { font-size: 2.25rem; font-weight: 900; color: white; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; text-shadow: 0 4px 8px rgba(0,0,0,0.6); }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>