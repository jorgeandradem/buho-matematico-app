<script setup>
/** * ARCHIVO: AngleNavigation.vue
 * NOTA INTERNA: NAVEGACIÓN DE ÁNGULOS v6.2 - MANDO DE RESPUESTA INMEDIATA
 * FIX: Implementación de @pointerdown para ignorar delay táctil y conflictos de scroll.
 * FIX: Z-Index reforzado (500) en el botón de cierre y eventos de arrastre blindados.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Trophy, X, Compass, Anchor, RotateCcw, Home, Volume2 } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';
import CoinRain from './CoinRain.vue';

const emit = defineEmits(['close']);
const gamification = useGamificationStore();

// --- ESTADOS DEL JUEGO ---
const currentStep = ref(1); 
const progress = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

const currentRotation = ref(0); 
const isAnimating = ref(false);
const feedback = ref('idle'); 

const rudderRef = ref(null);
const isDragging = ref(false);
let startAngle = 0;
let startRot = 0;

const anglesList = [
  { value: 0, name: 'NORTE (0°)', spokenName: 'NORTE, cero grados', hint: 'Frente, sin giro' },
  { value: 45, name: 'AGUDO (45°)', spokenName: 'AGUDO, cuarenta y cinco grados', hint: 'Un giro corto' },
  { value: 90, name: 'RECTO (90°)', spokenName: 'RECTO, noventa grados', hint: 'Una "L" perfecta' },
  { value: 135, name: 'OBTUSO (135°)', spokenName: 'OBTUSO, ciento treinta y cinco grados', hint: 'Más abierto que una "L"' },
  { value: 180, name: 'LLANO (180°)', spokenName: 'LLANO, ciento ochenta grados', hint: 'Media vuelta exacta (Sur)' },
  { value: 225, name: 'MAYOR A LLANO (225°)', spokenName: 'MAYOR A LLANO, doscientos veinticinco grados', hint: 'Media vuelta + un giro corto' },
  { value: 270, name: 'REFLEJO (270°)', spokenName: 'REFLEJO, doscientos setenta grados', hint: 'Tres cuartos de vuelta (Oeste)' },
  { value: 360, name: 'COMPLETO (360°)', spokenName: 'COMPLETO, trescientos sesenta grados', hint: 'Una vuelta entera' }
];

const currentQuestion = ref(anglesList[2]); 

const difficulty = computed(() => {
  if (progress.value < 5) return 'copper';
  if (progress.value < 8) return 'silver';
  return 'gold';
});

const bestCoinType = computed(() => {
  if (sessionCoins.value.gold > 0) return 'gold';
  if (sessionCoins.value.silver > 0) return 'silver';
  return 'copper';
});

const speak = (text, state = 'intro') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); 

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';

  switch (state) {
    case 'gold': utterance.pitch = 1.2; utterance.rate = 1.1; break;
    case 'silver': utterance.pitch = 1.0; utterance.rate = 1.0; break;
    case 'copper': utterance.pitch = 0.9; utterance.rate = 0.95; break;
    case 'intro': default: utterance.pitch = 1.0; utterance.rate = 1.0; break;
  }
  window.speechSynthesis.speak(utterance);
};

const playIntroVoiceInternal = () => {
  speak("Navegación de Ángulos. Revisa la bitácora para conocer los grados. En el mar, Babor es izquierda y color rojo, Estribor es derecha y color verde. Usa los botones o gira el timón manualmente hasta el rumbo que pide el capitán. ¡A toda vela!", 'intro');
}

const playSound = (type) => {
  try {
    const audio = new Audio(type === 'success' ? '/audios/success.mp3' : '/audios/lightning.mp3');
    audio.play().catch(e => {});
  } catch (e) {}
};

const announceChallenge = () => {
  speak(`Capitán pide rumbo a ${currentQuestion.value.spokenName}. ${currentQuestion.value.hint}. Gira a babor o estribor.`, 'intro');
};

const generateQuestion = () => {
  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * anglesList.length);
  } while (anglesList[nextIndex].value === currentQuestion.value.value);
  currentQuestion.value = anglesList[nextIndex];
  currentRotation.value = 0; 

  if (currentStep.value === 2) {
    announceChallenge();
  }
};

const rotate = (deg) => {
  if (isAnimating.value || isDragging.value) return;
  currentRotation.value += deg;
};

const onPointerDown = (e) => {
  if (isAnimating.value) return;
  isDragging.value = true;
  
  const rect = rudderRef.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const px = e.touches ? e.touches[0].clientX : e.clientX;
  const py = e.touches ? e.touches[0].clientY : e.clientY;
  
  startAngle = Math.atan2(py - cy, px - cx) * (180 / Math.PI);
  startRot = currentRotation.value;

  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);
};

const onPointerMove = (e) => {
  if (!isDragging.value) return;
  e.preventDefault(); 
  
  const rect = rudderRef.value.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const px = e.touches ? e.touches[0].clientX : e.clientX;
  const py = e.touches ? e.touches[0].clientY : e.clientY;
  
  const angle = Math.atan2(py - cy, px - cx) * (180 / Math.PI);
  currentRotation.value = startRot + (angle - startAngle);
};

const onPointerUp = () => {
  isDragging.value = false;
  currentRotation.value = Math.round(currentRotation.value / 45) * 45;
  
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('touchmove', onPointerMove);
  window.removeEventListener('mouseup', onPointerUp);
  window.removeEventListener('touchend', onPointerUp);
};

const checkAngle = () => {
  if (isAnimating.value) return;

  let targetAngle = currentQuestion.value.value;
  let currentDeg = currentRotation.value;
  let isCorrect = false;

  let normalizedRotation = ((currentDeg % 360) + 360) % 360;
  let targetNormalized = targetAngle % 360; 

  if (normalizedRotation === targetNormalized) {
    isCorrect = true;
  }

  if (isCorrect) {
    playSound('success');
    feedback.value = 'correct';
    isAnimating.value = true;
    
    if (difficulty.value === 'copper') sessionCoins.value.copper++;
    else if (difficulty.value === 'silver') sessionCoins.value.silver++;
    else sessionCoins.value.gold++;

    setTimeout(() => {
      if (progress.value < 9) {
        progress.value++;
        generateQuestion();
        feedback.value = 'idle';
        isAnimating.value = false;
      } else {
        progress.value = 10;
        finishGame();
      }
    }, 1500); 
  } else {
    playSound('error');
    feedback.value = 'error';
    isAnimating.value = true;
    setTimeout(() => { 
      feedback.value = 'idle'; 
      isAnimating.value = false;
    }, 1000); 
  }
};

const finishGame = () => {
  gamification.addCoins('copper', sessionCoins.value.copper);
  gamification.addCoins('silver', sessionCoins.value.silver);
  gamification.addCoins('gold', sessionCoins.value.gold);
  currentStep.value = 3;
  speak(`¡Tierra a la vista! Has ganado ${sessionCoins.value.gold} oros, ${sessionCoins.value.silver} platas y ${sessionCoins.value.copper} cobres.`, bestCoinType.value);
};

const startGame = () => {
  currentStep.value = 2;
  window.speechSynthesis.cancel(); 
  generateQuestion(); 
};

const resetGame = () => {
  progress.value = 0;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  currentStep.value = 1;
  playIntroVoiceInternal();
};

const handleClose = () => {
  window.speechSynthesis.cancel();
  if (currentStep.value === 2) {
    currentStep.value = 1; 
    playIntroVoiceInternal();
  } else {
    emit('close'); 
  }
};

onMounted(() => playIntroVoiceInternal());
onUnmounted(() => window.speechSynthesis.cancel());
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas ocean-bg">
      
      <button 
        @pointerdown.stop.prevent="handleClose" 
        class="absolute w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white shadow-lg border border-white/40 active:scale-75 transition-all cursor-pointer z-[500]" 
        style="top: 15px; right: 15px;"
      >
        <X size="24" stroke-width="3" />
      </button>

      <div v-if="currentStep === 3" class="pointer-events-none absolute inset-0 z-[150]">
        <CoinRain :type="bestCoinType" :count="40" />
      </div>

      <header v-if="currentStep !== 1" class="header-standard shrink-0 !bg-white/10 backdrop-blur-md border-b border-white/20 relative z-[100] h-[70px]">
        <div class="flex-1 flex items-center animate-fade-in">
          <div class="flex items-center gap-2">
            <Trophy size="22" class="text-yellow-400 drop-shadow-md" />
            <span class="text-xl font-black text-white">{{ progress }}/10</span>
          </div>
        </div>

        <div class="flex-1 flex justify-center animate-fade-in">
          <div class="session-loot-capsule !bg-white/20 !border-white/30">
            <div class="loot-item"><img src="/images/coin-gold.png" alt="Oro" /><span class="font-bold text-white">{{ sessionCoins.gold }}</span></div>
            <div class="loot-item border-x border-white/20"><img src="/images/coin-silver.png" alt="Plata" /><span class="font-bold text-white">{{ sessionCoins.silver }}</span></div>
            <div class="loot-item"><img src="/images/coin-copper.png" alt="Cobre" /><span class="font-bold text-white">{{ sessionCoins.copper }}</span></div>
          </div>
        </div>

        <div class="flex-1"></div>
      </header>

      <div v-if="currentStep === 1" class="game-content flex-1 flex flex-col items-center justify-center gap-6 pt-16 pb-6 w-full animate-fade-in z-50 relative">
        <div class="text-center shrink-0">
          <div class="intro-wheel-wrapper mb-3">
             <div class="css-3d-wheel animate-spin-slow">
                <div class="wheel-spoke"></div><div class="wheel-spoke" style="transform: rotate(45deg);"></div>
                <div class="wheel-spoke" style="transform: rotate(90deg);"></div><div class="wheel-spoke" style="transform: rotate(135deg);"></div>
                <div class="wheel-rim"></div>
                <div class="wheel-hub"><div class="wheel-hub-inner"></div></div>
             </div>
          </div>
          <h1 class="game-title text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] leading-none text-center">Navegación de Ángulos</h1>
        </div>
        
        <div class="rules-panel shadow-2xl bg-[#0f172a]/80 backdrop-blur-md border-[#fbbf24] border-2 mx-auto w-[90%] max-w-[600px] flex flex-col">
          <div class="rules-badge bg-[#fbbf24] text-[#020617] flex justify-between items-center w-full px-4 box-border left-0 top-[-14px] rounded-full">
            <span class="drop-shadow-sm uppercase font-black text-[10px] sm:text-xs">BITÁCORA DEL CAPITÁN</span>
            <button @pointerdown.stop.prevent="playIntroVoiceInternal" class="text-slate-900 hover:text-slate-700 transition-colors active:scale-90 ml-4 touch-manipulation">
              <Volume2 size="18" />
            </button>
          </div>
          <div class="rules-grid p-2 text-left space-y-2 mt-2 text-slate-200 font-medium overflow-y-auto custom-scrollbar flex-1 relative z-10 max-h-[40vh]">
             <div class="flex gap-3 items-center border-b border-slate-700/50 pb-2"><span class="text-lg w-6 text-center text-sky-400">⚓</span><p class="text-xs leading-tight font-bold"><strong>0°:</strong> Norte / Frente (Sin giro).</p></div>
             <div class="flex gap-3 items-center border-b border-slate-700/50 pb-2"><span class="text-lg w-6 text-center text-amber-400">🍕</span><p class="text-xs leading-tight font-bold"><strong>45°:</strong> Agudo (Un giro corto).</p></div>
             <div class="flex gap-3 items-center border-b border-slate-700/50 pb-2"><span class="text-lg w-6 text-center text-slate-400">📐</span><p class="text-xs leading-tight font-bold"><strong>90°:</strong> Recto (Una "L" perfecta).</p></div>
             <div class="flex gap-3 items-center border-b border-slate-700/50 pb-2"><span class="text-lg w-6 text-center text-red-400">🪃</span><p class="text-xs leading-tight font-bold"><strong>135°:</strong> Obtuso (Más de 90°).</p></div>
             <div class="flex gap-3 items-center border-b border-slate-700/50 pb-2"><span class="text-lg w-6 text-center text-blue-400">🌏</span><p class="text-xs leading-tight font-bold"><strong>180°:</strong> Llano (Media vuelta, Sur).</p></div>
             <div class="flex gap-3 items-center border-b border-slate-700/50 pb-2"><span class="text-lg w-6 text-center text-yellow-400">🌙</span><p class="text-xs leading-tight font-bold"><strong>270°:</strong> Reflejo (Tres cuartos, Oeste).</p></div>
             <div class="flex gap-3 items-center"><span class="text-lg w-6 text-center text-amber-500">💫</span><p class="text-xs leading-tight font-bold"><strong>360°:</strong> Vuelta Completa.</p></div>
          </div>
        </div>

        <button @pointerdown.stop.prevent="startGame" class="btn-ocean w-[90%] max-w-sm flex justify-center items-center gap-2 text-lg shrink-0 touch-manipulation relative z-[100]">
          ¡A TODA VELA! <Compass stroke-width="3" class="animate-spin-slow" />
        </button>
      </div>

      <div v-if="currentStep === 2" class="game-content flex-1 flex flex-col items-center justify-between py-4 animate-fade-in z-40 relative overflow-hidden w-full min-h-0">
        <div class="instruction-banner z-20 text-center w-[90%] max-w-sm shrink-0 mt-2 bg-white/95 shadow-md rounded-xl">
          <span class="text-slate-500 text-xs font-black uppercase tracking-widest block mb-0.5">El Capitán Pide:</span>
          <strong class="text-sky-600 text-2xl block">{{ currentQuestion.name }}</strong>
          <p class="text-xs text-slate-500 font-bold mt-0.5">{{ currentQuestion.hint }}</p>
        </div>

        <div class="main-visual-area flex-1 w-full relative min-h-0 flex items-center justify-center">
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <span v-for="a in [0, 45, 90, 135, 180, 225, 270, 315]" :key="a" 
                  class="absolute text-white/50 font-black text-sm md:text-base tracking-widest drop-shadow-md"
                  :style="{ transform: `rotate(${a}deg) translateY(-140px) rotate(-${a}deg)` }">
              {{ a }}°
            </span>
          </div>
          
          <div class="rudder-container z-20 w-full h-full flex items-center justify-center" :class="{'animate-shake': feedback === 'error'}">
            <div ref="rudderRef"
                  class="rudder-wheel transition-transform duration-[400ms] ease-out relative cursor-grab active:cursor-grabbing touch-none" 
                  :style="{ transform: `rotate(${currentRotation}deg)` }"
                  :class="{
                    'glow-success': feedback === 'correct',
                    'glow-error': feedback === 'error',
                    'border-[#78350f] shadow-2xl': feedback === 'idle',
                    'duration-0': isDragging
                  }"
                  @mousedown="onPointerDown"
                  @touchstart="onPointerDown">
              <div class="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-sky-300 drop-shadow-md z-30"></div>
              <div class="rudder-handle"></div><div class="rudder-handle" style="transform: rotate(45deg);"></div>
              <div class="rudder-handle" style="transform: rotate(90deg);"></div><div class="rudder-handle" style="transform: rotate(135deg);"></div>
              <div class="w-16 h-16 md:w-20 md:h-20 bg-[#78350f] rounded-full border-4 border-[#451a03] flex items-center justify-center z-10 shadow-inner">
                <Anchor class="text-[#b45309]" :size="28" />
              </div>
            </div>
          </div>
        </div>

        <div class="controls-area w-[90%] max-w-sm shrink-0 flex flex-col items-center gap-3 pb-2">
            <div class="flex gap-3 w-full z-20">
               <button @pointerdown.stop.prevent="rotate(-45)" :disabled="isAnimating" class="flex-1 bg-white/95 text-red-600 font-black py-2 md:py-3 rounded-xl shadow-lg active:scale-95 border-b-4 border-red-200 disabled:opacity-50 transition-all flex flex-col items-center leading-none gap-1 touch-manipulation cursor-pointer">
                 <span class="text-[10px] text-red-400">BABOR</span>
                 <span class="text-sm md:text-base">↺ -45°</span>
               </button>
               <button @pointerdown.stop.prevent="rotate(45)" :disabled="isAnimating" class="flex-1 bg-white/95 text-green-600 font-black py-2 md:py-3 rounded-xl shadow-lg active:scale-95 border-b-4 border-green-200 disabled:opacity-50 transition-all flex flex-col items-center leading-none gap-1 touch-manipulation cursor-pointer">
                 <span class="text-[10px] text-green-500">ESTRIBOR</span>
                 <span class="text-sm md:text-base">+45° ↻</span>
               </button>
            </div>

            <button @pointerdown.stop.prevent="checkAngle" :disabled="isAnimating" class="btn-ocean z-20 w-full disabled:opacity-50 disabled:grayscale transition-all touch-manipulation cursor-pointer">
              VALIDAR RUMBO
            </button>
        </div>
      </div>

      <div v-if="currentStep === 3" class="game-content result-screen flex-1 flex flex-col items-center justify-center py-6 px-4 animate-fade-in z-[160] relative min-h-0">
        <h1 class="text-4xl sm:text-5xl font-black text-sky-100 mb-8 italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center uppercase tracking-tighter z-10 relative">¡TIERRA A LA VISTA!</h1>
        <div class="final-loot-display flex gap-4 md:gap-6 mb-12 bg-[#0f172a]/80 p-4 md:p-6 rounded-[2.5rem] shadow-2xl border-4 border-[#38bdf8]/50 backdrop-blur-md mx-auto relative z-[170]">
            <div v-if="sessionCoins.gold > 0" class="loot-big gold-glow flex flex-col items-center gap-2">
              <img src="/images/coin-gold.png" class="w-12 h-12 md:w-16 md:h-16 animate-bounce-slow" />
              <span class="text-xl md:text-2xl font-black text-amber-400">+{{ sessionCoins.gold }}</span>
            </div>
            <div v-if="sessionCoins.silver > 0" class="loot-big silver-glow flex flex-col items-center gap-2">
              <img src="/images/coin-silver.png" class="w-12 h-12 md:w-16 md:h-16 animate-bounce-slow" style="animation-delay: 0.1s" />
              <span class="text-xl md:text-2xl font-black text-slate-400">+{{ sessionCoins.silver }}</span>
            </div>
            <div v-if="sessionCoins.copper > 0" class="loot-big copper-glow flex flex-col items-center gap-2">
              <img src="/images/coin-copper.png" class="w-12 h-12 md:w-16 md:h-16 animate-bounce-slow" style="animation-delay: 0.2s" />
              <span class="text-xl md:text-2xl font-black text-orange-400">+{{ sessionCoins.copper }}</span>
            </div>
        </div>

        <div class="action-buttons flex flex-col w-full max-w-xs mx-auto gap-4 mb-8 shrink-0 relative z-[180]">
          <button @pointerdown.stop.prevent="resetGame" class="w-full py-4 bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 rounded-2xl font-black text-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3 touch-manipulation cursor-pointer">
            <RotateCcw stroke-width="3" /> NUEVO VIAJE
          </button>
          <button @pointerdown.stop.prevent="handleClose" class="btn-ocean w-full flex items-center justify-center gap-3 text-lg touch-manipulation cursor-pointer">
            <Home stroke-width="3" /> AL PORTAL
          </button>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* 🛠️ CSS BLINDADO Y OPTIMIZADO */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #080c14; overflow: hidden; }

.app-canvas {
  display: flex; flex-direction: column; justify-content: space-between; position: relative; 
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; -webkit-tap-highlight-color: transparent;
  padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);
  width: 100vw; height: 100dvh; 
  overflow: hidden !important;
  touch-action: none;
}

.touch-manipulation { touch-action: manipulation; cursor: pointer; position: relative; }

.ocean-bg { background: linear-gradient(180deg, #1e3a8a 0%, #080c14 100%); }

@media (min-width: 1025px) {
  .master-container { background-color: #f1f5f9; }
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.5); border: 8px solid white; padding: 0; overflow: hidden !important; }
}
@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 100vw; height: 100vh; border-radius: 0; box-shadow: none; padding: 0; overflow: hidden !important; }
  .game-content { position: relative; z-index: 50; }
}

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem; pointer-events: auto !important; }
.session-loot-capsule { display: flex; align-items: center; padding: 6px 16px; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.2); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.loot-item img { width: 1.1rem; height: 1.1rem; object-fit: contain; }

.game-title { font-size: clamp(1.2rem, 5vw, 2.5rem); font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }

.rules-panel { width: 92%; max-width: 600px; padding: 1.2rem 1rem 1rem 1rem; border-radius: 1.5rem; position: relative; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); z-index: 60; }
.rules-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); font-size: 11px; padding: 4px 14px; border-radius: 9999px; letter-spacing: 0.05em; white-space: nowrap; }

.app-canvas::-webkit-scrollbar { display: none; }
.app-canvas { -ms-overflow-style: none; scrollbar-width: none; }

.intro-wheel-wrapper {
  display: inline-flex; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 50%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1);
  pointer-events: none;
}

.css-3d-wheel { width: 60px; height: 60px; position: relative; display: flex; align-items: center; justify-content: center; }
@media (min-width: 768px) { .css-3d-wheel { width: 80px; height: 80px; } }

.wheel-rim { width: 100%; height: 100%; border-radius: 50%; border: 8px solid #78350f; box-shadow: inset 0 4px 8px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5); position: absolute; z-index: 5; }
@media (min-width: 768px) { .wheel-rim { border-width: 12px; } }

.wheel-spoke { position: absolute; width: 6px; height: 80px; background: linear-gradient(to right, #451a03, #92400e, #451a03); border-radius: 4px; z-index: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
@media (min-width: 768px) { .wheel-spoke { width: 8px; height: 110px; } }

.wheel-hub { width: 20px; height: 20px; background: #451a03; border-radius: 50%; position: absolute; z-index: 10; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.6); }

.wheel-hub-inner { width: 8px; height: 8px; background: #d97706; border-radius: 50%; box-shadow: inset 0 1px 2px rgba(255,255,255,0.5); }

.btn-ocean {
  background: linear-gradient(to bottom, #0ea5e9, #0284c7); color: white; padding: 1.2rem; border-radius: 2rem; font-weight: 900;
  border-bottom: 6px solid #0369a1; box-shadow: 0 10px 20px rgba(0,0,0,0.3); transition: all 0.1s;
  pointer-events: auto !important;
}
.btn-ocean:active { transform: translateY(4px); border-bottom-width: 2px; }

.instruction-banner { padding: 15px; border-radius: 1rem; border-bottom-width: 4px; position: relative; z-index: 25; }

.rudder-wheel { width: 200px; height: 200px; background: transparent; border: 15px solid #78350f; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.8); position: relative; z-index: 30; }
@media (min-width: 768px) { .rudder-wheel { width: 250px; height: 250px; border-width: 20px; } }

.rudder-handle { position: absolute; width: 18px; height: 240px; background: linear-gradient(to right, #451a03, #78350f, #451a03); z-index: -1; border-radius: 12px; box-shadow: 0 5px 10px rgba(0,0,0,0.5); }
@media (min-width: 768px) { .rudder-handle { width: 24px; height: 310px; } }

.glow-success { border-color: #22c55e !important; box-shadow: 0 0 40px rgba(34, 197, 94, 0.9), inset 0 0 30px rgba(34, 197, 94, 0.8) !important; animation: pulse-glow 0.3s infinite alternate; }
.glow-error { border-color: #ef4444 !important; box-shadow: 0 0 40px rgba(239, 68, 68, 0.9), inset 0 0 30px rgba(239, 68, 68, 0.8) !important; animation: pulse-glow 0.2s infinite alternate; }
@keyframes pulse-glow { from { filter: brightness(1); } to { filter: brightness(1.5); } }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-spin-slow { animation: spin 8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.animate-bounce-slow { animation: bounceSlow 3s infinite ease-in-out; }
@keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

.animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-4px, 0, 0); } 20%, 80% { transform: translate3d(6px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-10px, 0, 0); } 40%, 60% { transform: translate3d(10px, 0, 0); } }

.gold-glow { filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.6)); }
.silver-glow { filter: drop-shadow(0 0 15px rgba(148, 163, 184, 0.6)); }
.copper-glow { filter: drop-shadow(0 0 15px rgba(180, 83, 9, 0.6)); }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
</style>