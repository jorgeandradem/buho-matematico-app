<script setup>
/** * ARCHIVO: SubmarineAlgebra.vue
 * NOTA INTERNA: BURBUJAS DE ALGEBRA v5.1 - OPTIMIZACIÓN DE ARRANQUE TOTAL
 * LOGICA: Basada en el motor de SoccerAlgebra para máxima compatibilidad.
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Trophy, X, RotateCcw, Target, Coins, Zap, ChevronRight, Volume2, Home } from 'lucide-vue-next';
import { useGamificationStore } from '@/stores/useGamificationStore';

const emit = defineEmits(['close']);
const store = useGamificationStore();

// --- 🔊 MOTOR DE VOZ UNIFICADO ---
const speak = (text, mood = 'intro') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    if (mood === 'gold') { utterance.pitch = 1.4; utterance.rate = 1.1; }
    else if (mood === 'silver') { utterance.pitch = 1.0; utterance.rate = 1.0; }
    else if (mood === 'copper') { utterance.pitch = 0.8; utterance.rate = 0.9; }
    else { utterance.pitch = 1.1; utterance.rate = 1.0; }
    window.speechSynthesis.speak(utterance);
};

const vocalizeRules = () => {
    speak("¡Bienvenido a Burbujas de Álgebra! Calcula la incógnita equis de la pizarra y explota la burbuja con el resultado correcto. ¡Suma cobre, resta plata y multiplica o divide para ganar oro!");
};

// --- 1. SISTEMA DE ESTADOS ---
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const progress = ref(0); 
const bubbles = ref([]);
const currentEquation = ref(null);
const gameState = ref('rules'); 
const gameActive = ref(false);
let bubbleInterval = null;
let victoryInterval = null;

const levelName = computed(() => {
  if (progress.value < 3) return 'Bronce (Sumas)';
  if (progress.value < 7) return 'Plata (Restas)';
  return 'Oro (Tablas)';
});

// --- 🔊 SONIDOS ---
const soundPop = new Audio(new URL('../assets/sounds/submarine/bubble_pop.mp3', import.meta.url).href);
const soundAmbient = new Audio(new URL('../assets/sounds/submarine/underwater_ambience.mp3', import.meta.url).href);

// --- ⚡ WATCHERS Y LIMPIEZA ---
watch(gameState, (newState) => {
    if (newState === 'rules') {
        stopAllEffects();
        vocalizeRules();
    }
});

const stopAllEffects = () => {
    if (bubbleInterval) clearInterval(bubbleInterval);
    if (victoryInterval) clearInterval(victoryInterval);
    soundAmbient.pause();
    soundAmbient.currentTime = 0;
    window.speechSynthesis.cancel();
    bubbles.value = [];
};

const formattedEquation = computed(() => {
  if (!currentEquation.value) return '';
  return currentEquation.value.text.replace(/x/g, '<span class="chalk-x-container"><span class="chalk-x">x</span></span>');
});

// --- 2. LÓGICA DE NAVEGACIÓN ---
const startGame = () => {
  // 🛠️ MEJORA: Cambio de estado inmediato antes de limpiar audios para evitar bloqueos
  gameState.value = 'playing';
  gameActive.value = true;
  
  // Limpieza selectiva
  window.speechSynthesis.cancel();
  if (bubbleInterval) clearInterval(bubbleInterval);
  
  generateEquation();
  bubbleInterval = setInterval(spawnBubble, 1400);
  
  soundAmbient.loop = true;
  soundAmbient.volume = 0.2;
  soundAmbient.play().catch(() => {});
};

const returnToRules = () => {
  stopAllEffects();
  gameActive.value = false;
  gameState.value = 'rules';
};

// --- 3. MOTOR DEL JUEGO ---
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
  const val = Math.random() > 0.7 ? currentEquation.value.answer : Math.floor(Math.random() * 40);
  bubbles.value.push({
    id: Date.now() + Math.random(), value: val, x: Math.random() * (window.innerWidth * 0.7), y: -80, 
    size: 60 + Math.random() * 20, speed: 1.5 + (progress.value * 0.3), opacity: 1
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
    const pop = soundPop.cloneNode(); 
    pop.volume = 0.6;
    pop.play().catch(() => {});
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
  if (bubbleInterval) clearInterval(bubbleInterval);
  soundAmbient.pause();
  const winAudio = new Audio('/audios/finish.mp3');
  winAudio.volume = 0.7;
  winAudio.play().catch(() => {}); 
  
  store.updateMissionProgress('play_any_game', 1);
  await store.addMultipleCoins({...sessionCoins.value});
  await store.updateMissionProgress('complete_challenge', 1);
  
  const resultText = `¡Misión lograda! Has rescatado ${sessionCoins.value.gold} monedas de oro, ${sessionCoins.value.silver} de plata y ${sessionCoins.value.copper} de cobre.`;
  speak(resultText, sessionCoins.value.gold > 0 ? 'gold' : 'silver');

  triggerFinalEffects(); 
};

const triggerFinalEffects = () => {
  victoryInterval = setInterval(() => {
    if (gameState.value !== 'finished') return;
    const popEffect = soundPop.cloneNode();
    popEffect.volume = 0.15; 
    popEffect.play().catch(() => {});
    bubbles.value.push({
      id: Math.random(), value: '🫧', x: Math.random() * window.innerWidth, y: -50,
      size: Math.random() * 40 + 20, speed: Math.random() * 4 + 2, opacity: 0.6
    });
  }, 200);

  setTimeout(() => {
      if (victoryInterval) clearInterval(victoryInterval);
  }, 3000);
};

const resetGame = () => {
  stopAllEffects();
  progress.value = 0;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  startGame();
};

onMounted(() => {
  animateBubbles();
  if (gameState.value === 'rules') vocalizeRules();
});

onUnmounted(() => { stopAllEffects(); });
</script>

<template>
  <div class="master-container font-inter select-none">
    <main class="app-canvas submarino-bg">
      
      <header v-if="gameState !== 'rules'" class="header-standard shrink-0 !bg-[#0f172a]/60 backdrop-blur-md !border-sky-500/30 z-50">
        <div class="trophy-section flex items-center gap-2">
          <Trophy size="22" class="text-yellow-400 drop-shadow-md" />
          <span class="text-xl font-black text-sky-100">{{ progress }}/10</span>
        </div>

        <div class="session-loot-capsule !bg-[#0f172a]/80 !border-sky-500/50 shadow-inner">
          <div class="loot-item">
            <img src="/images/coin-gold.png" alt="Oro" />
            <span class="font-bold text-sky-100">{{ sessionCoins.gold }}</span>
          </div>
          <div class="loot-item border-x border-slate-600/50">
            <img src="/images/coin-silver.png" alt="Plata" />
            <span class="font-bold text-sky-100">{{ sessionCoins.silver }}</span>
          </div>
          <div class="loot-item">
            <img src="/images/coin-copper.png" alt="Cobre" />
            <span class="font-bold text-sky-100">{{ sessionCoins.copper }}</span>
          </div>
        </div>

        <button @click="gameState === 'playing' ? returnToRules() : emit('close')" class="btn-close-circle p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/20">
          <X size="20" stroke-width="2.5" />
        </button>
      </header>

      <div v-if="gameState === 'rules'" class="game-content flex-1 flex flex-col items-center justify-between py-4 w-full animate-fade-in z-50 relative">
        <button @click.prevent.stop="emit('close')" class="absolute top-2 right-4 bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white border border-white/20 backdrop-blur-sm z-[70] active:scale-75">
          <X size="20" stroke-width="2.5" />
        </button>

        <div class="flex flex-col items-center mt-2 text-center shrink-0">
          <div class="submarine-3d-epic animate-sub-float scale-75 md:scale-100 origin-top">
              <div class="sub-periscope"></div><div class="sub-cabin"></div>
              <div class="sub-body">
                  <div class="sub-window"><div class="glass-reflection"></div></div>
                  <div class="sub-stripe"></div>
              </div>
              <div class="sub-propeller-box"><div class="propeller animate-spin-fast"></div></div>
              <div class="sub-bubbles"><div class="s-bub b1"></div><div class="s-bub b2"></div><div class="s-bub b3"></div></div>
          </div>
          <h1 class="game-title text-sky-100 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] leading-none mt-1">Burbujas de Álgebra</h1>
        </div>

        <div class="rules-panel shadow-2xl w-[90%] max-w-[420px] bg-[#0f172a]/80 border-2 border-[#38bdf8]/50 backdrop-blur-md mx-auto mt-4 max-h-[45vh] flex flex-col">
          <button @click="vocalizeRules" class="absolute -top-4 -right-4 bg-yellow-400 text-slate-900 p-2.5 rounded-full shadow-lg active:scale-90 border-2 border-white z-20">
              <Volume2 size="20" />
          </button>
          
          <div class="rules-badge bg-[#fbbf24] text-[#020617] uppercase tracking-tighter font-black">Manual de Inmersión</div>
          <div class="p-2 md:p-4 text-left space-y-4 mt-2 overflow-y-auto custom-scrollbar flex-1">
            <div class="flex gap-3 md:gap-4 items-center text-white">
                <div class="bg-sky-500/20 p-2 rounded-lg shrink-0"><Target class="text-sky-300" size="20" /></div>
                <div>
                  <p class="font-black text-sm md:text-base text-sky-100 leading-tight">Calcula la incógnita X</p>
                  <p class="text-[10px] md:text-xs text-slate-300 leading-snug">Busca el número que falta en la pizarra.</p>
                </div>
            </div>
            <div class="flex gap-3 md:gap-4 items-center text-white">
                <div class="bg-amber-500/20 p-2 rounded-lg shrink-0"><Zap class="text-amber-300" size="20" /></div>
                <div>
                  <p class="font-black text-sm md:text-base text-amber-100 leading-tight">Explota las burbujas</p>
                  <p class="text-[10px] md:text-xs text-slate-300 leading-snug">Toca el resultado correcto antes de que escapen.</p>
                </div>
            </div>
            <div class="flex gap-3 md:gap-4 items-center text-white">
                <div class="bg-green-500/20 p-2 rounded-lg shrink-0"><Coins class="text-green-300" size="20" /></div>
                <div>
                  <p class="font-black text-sm md:text-base text-green-100 leading-tight">Gana tu Botín</p>
                  <p class="text-[10px] md:text-xs text-slate-300 leading-snug">Junta 10 aciertos. Suma: 🥉 | Resta: 🥈 | Multi/Div: 🥇</p>
                </div>
            </div>
          </div>
        </div>

        <button @pointerdown="startGame" class="w-[90%] max-w-[420px] shrink-0 bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white font-black italic text-lg md:text-xl uppercase rounded-[2rem] border-b-[6px] border-[#1E3A8A] active:translate-y-[4px] active:border-b-[2px] transition-all flex items-center justify-center py-3 md:py-4 group mb-2 mt-4 z-[100] touch-manipulation">
            ¡EMPEZAR MISIÓN! <div class="ml-3 bg-white p-1 rounded-full"><ChevronRight class="text-[#1D4ED8]" size="18" stroke-width="4" /></div>
        </button>
      </div>

      <div v-else-if="gameState === 'playing'" class="game-content flex-1 flex flex-col items-center justify-center py-4 relative w-full min-h-0">
        
        <div class="equation-board z-20 shrink-0 mt-4 md:mt-10">
          <div class="equation-badge-surgical">Nivel: {{ levelName }}</div>
          <h2 v-if="currentEquation" class="equation-text shadow-[0_10px_20px_rgba(0,0,0,0.5)]"><span v-html="formattedEquation"></span></h2>
        </div>
        
        <div class="ocean-area z-10 flex-1 relative w-full min-h-0">
          <div v-for="bubble in bubbles" :key="bubble.id" class="bubble" 
               :style="{ left: bubble.x + 'px', bottom: bubble.y + 'px', width: bubble.size + 'px', height: bubble.size + 'px', opacity: bubble.opacity }" 
               @pointerdown.prevent.stop="checkAnswer(bubble)">
            {{ bubble.value }}
          </div>
        </div>

      </div>

      <div v-else class="game-content result-screen flex-1 flex flex-col items-center justify-center py-6 px-4 animate-fade-in z-10 w-full min-h-0 relative">
        <div class="ocean-area pointer-events-none opacity-40 absolute inset-0 z-0">
           <div v-for="bubble in bubbles" :key="bubble.id" class="bubble" :style="{ left: bubble.x + 'px', bottom: bubble.y + 'px', width: bubble.size + 'px', height: bubble.size + 'px' }">{{ bubble.value }}</div>
        </div>
        
        <Trophy size="80" class="text-[#fbbf24] mb-4 drop-shadow-2xl animate-bounce shrink-0 z-10" />
        <h1 class="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase z-10 drop-shadow-md text-center">¡Misión Lograda!</h1>
        
        <div class="bg-[#0f172a]/80 backdrop-blur-md w-full max-w-[340px] p-6 rounded-[2.5rem] mt-6 border-4 border-[#38bdf8]/50 z-10 shadow-2xl mx-auto shrink-0">
            <div class="flex justify-around items-center w-full">
                <div class="flex flex-col items-center"><img src="/images/coin-gold.png" class="w-10 h-10 mb-1" /><span class="text-xl md:text-2xl font-black text-amber-400">+{{ sessionCoins.gold }}</span></div>
                <div class="flex flex-col items-center border-x border-slate-600/50 px-4 md:px-6"><img src="/images/coin-silver.png" class="w-12 h-12 mb-1" /><span class="text-3xl md:text-4xl font-black text-slate-200">+{{ sessionCoins.silver }}</span></div>
                <div class="flex flex-col items-center"><img src="/images/coin-copper.png" class="w-10 h-10 mb-1" /><span class="text-xl md:text-2xl font-black text-orange-400">+{{ sessionCoins.copper }}</span></div>
            </div>
        </div>
        
        <div class="action-buttons flex flex-col w-full max-w-xs mx-auto gap-3 mt-8 shrink-0 z-20">
          <button @pointerdown="resetGame" class="w-full btn-main-ocean flex items-center justify-center gap-2 touch-manipulation">
            <RotateCcw size="20" stroke-width="3" /> NUEVA RONDA
          </button>
          <button @pointerdown="emit('close')" class="w-full py-3 bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white rounded-[1.5rem] font-black text-sm uppercase transition-all flex items-center justify-center gap-2 touch-manipulation">
            <Home size="18" /> Regresar a la Base
          </button>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* 🛠️ CSS BLINDADO Y OPTIMIZADO */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #0f172a; overflow: hidden; }

.app-canvas {
  display: flex; flex-direction: column; justify-content: space-between; position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; -webkit-tap-highlight-color: transparent;
  
  padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);

  width: 100vw; height: 100dvh; overflow-y: auto; overflow-x: hidden;
}

.submarino-bg { background: linear-gradient(180deg, #1e3a8a 0%, #080c14 100%); }

@media (min-width: 1025px) {
  .master-container { background-color: #f1f5f9; }
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.5); border: 8px solid white; padding: 0; overflow: hidden; }
}

@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); padding: 0; }
}

.touch-manipulation { touch-action: manipulation; cursor: pointer; }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }
.session-loot-capsule { display: flex; align-items: center; padding: 6px 12px; border-radius: 9999px; }
.loot-item { display: flex; align-items: center; gap: 4px; padding: 0 8px; }
.loot-item img { width: 1.1rem; height: 1.1rem; object-fit: contain; }

.game-title { font-size: clamp(1.5rem, 5vw, 2.25rem); font-weight: 900; color: white; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; text-shadow: 0 4px 8px rgba(0,0,0,0.6); }

.rules-panel { width: 92%; max-width: 600px; padding: 1.2rem 1rem 1rem 1rem; border-radius: 1.5rem; position: relative; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); }
.rules-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); color: white; font-size: 11px; font-weight: 900; padding: 4px 14px; border-radius: 9999px; letter-spacing: 0.05em; }

.app-canvas::-webkit-scrollbar { display: none; }
.app-canvas { -ms-overflow-style: none; scrollbar-width: none; }

.btn-main-ocean { background: linear-gradient(to bottom, #0ea5e9, #0284c7); color: white; padding: 1.2rem; border-radius: 2rem; border-bottom: 6px solid #0369a1; font-size: 1.2rem; font-weight: 900; text-transform: uppercase; transition: all 0.1s; }
.btn-main-ocean:active { transform: translateY(4px); border-bottom-width: 2px; }

/* 🛠️ MEJORA: pointer-events none para que la animación no tape los botones */
.submarine-3d-epic { position: relative; width: 140px; height: 100px; margin-bottom: 1rem; pointer-events: none; }
.sub-body { position: absolute; bottom: 10px; left: 20px; width: 120px; height: 60px; background: linear-gradient(180deg, #fde047 0%, #eab308 40%, #b45309 100%); border-radius: 40px 60px 60px 40px; border: 4px solid #451a03; box-shadow: inset -5px -5px 15px rgba(0,0,0,0.3), 0 15px 20px rgba(0,0,0,0.4); z-index: 3; overflow: hidden; }
.sub-stripe { position: absolute; top: 50%; left: 0; width: 100%; height: 8px; background: #451a03; transform: translateY(-50%); opacity: 0.8; }
.sub-cabin { position: absolute; top: 10px; left: 60px; width: 45px; height: 25px; background: linear-gradient(180deg, #facc15, #ca8a04); border: 4px solid #451a03; border-bottom: none; border-radius: 15px 15px 0 0; z-index: 2; }
.sub-periscope { position: absolute; top: -10px; left: 75px; width: 8px; height: 25px; background: #94a3b8; border: 2px solid #0f172a; z-index: 1; }
.sub-periscope::after { content: ''; position: absolute; top: -2px; left: 0px; width: 16px; height: 8px; background: #ef4444; border-radius: 4px; border: 2px solid #0f172a; }
.sub-window { position: absolute; top: 10px; left: 60px; width: 32px; height: 32px; background: radial-gradient(circle at 30% 30%, #bae6fd, #0284c7); border-radius: 50%; border: 4px solid #451a03; box-shadow: inset -2px -2px 5px rgba(0,0,0,0.5), 0 0 0 2px #facc15; z-index: 4; }
.glass-reflection { position: absolute; top: 4px; left: 4px; width: 10px; height: 6px; background: rgba(255,255,255,0.6); border-radius: 50%; transform: rotate(-30deg); }
.sub-propeller-box { position: absolute; bottom: 25px; left: 5px; width: 20px; height: 30px; background: #475569; border: 4px solid #0f172a; border-radius: 5px 0 0 5px; z-index: 2; }
.propeller { position: absolute; top: -5px; left: -10px; width: 10px; height: 32px; background: #94a3b8; border: 2px solid #0f172a; }

.animate-spin-fast { animation: prop-spin 0.08s linear infinite alternate; }
@keyframes prop-spin { 0% { transform: scaleY(1); } 100% { transform: scaleY(0.2); } }
.animate-sub-float { animation: subFloat 3s ease-in-out infinite; }
@keyframes subFloat { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(-2deg); } }

.sub-bubbles .s-bub { position: absolute; background: rgba(255,255,255,0.6); border-radius: 50%; bottom: 30px; left: -10px; animation: sBubbles 1.5s linear infinite; }
@keyframes sBubbles { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(-30px, -40px) scale(1.5); opacity: 0; } }

.equation-board { text-align: center; width: 100%; padding: 0 10px; }
.equation-badge-surgical { color: #ffffff; font-weight: 900; text-transform: uppercase; margin-bottom: 0.5rem; text-shadow: 0 2px 4px black; font-size: 12px; }
.equation-text { background: rgba(15, 23, 42, 0.9); display: inline-flex; align-items: center; justify-content: center; min-height: 80px; padding: 10px 30px; border-radius: 2rem; color: white; font-size: clamp(2rem, 8vw, 3.5rem); font-weight: 900; border: 3px solid #38bdf8; }

.ocean-area { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 5; overflow: hidden; pointer-events: none; }
.bubble { pointer-events: auto; touch-action: manipulation; cursor: pointer; position: absolute; border-radius: 50%; background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.5), rgba(56, 189, 248, 0.15)); border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: clamp(1.2rem, 5vw, 2rem); }
.bubble:active { transform: scale(0.9); }

:deep(.chalk-x) { font-family: 'Caveat', cursive; color: #fbbf24; font-size: 1.5em; filter: drop-shadow(0px 0px 4px rgba(251, 191, 36, 0.5)); margin: 0 5px; }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
</style>