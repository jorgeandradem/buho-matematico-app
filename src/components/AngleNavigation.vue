<script setup>
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
const feedback = ref('idle'); // 'idle', 'correct', 'error'

// Ref para la lógica híbrida (arrastre manual)
const rudderRef = ref(null);
const isDragging = ref(false);
let startAngle = 0;
let startRot = 0;

// Catálogo de Ángulos ampliado
const anglesList = [
  { value: 0, name: 'NORTE (0°)', hint: 'Frente, sin giro' },
  { value: 45, name: 'AGUDO (45°)', hint: 'Un giro corto' },
  { value: 90, name: 'RECTO (90°)', hint: 'Una "L" perfecta' },
  { value: 135, name: 'OBTUSO (135°)', hint: 'Más abierto que una "L"' },
  { value: 180, name: 'LLANO (180°)', hint: 'Media vuelta exacta (Sur)' },
  { value: 225, name: 'MAYOR A LLANO (225°)', hint: 'Media vuelta + un giro corto' },
  { value: 270, name: 'REFLEJO (270°)', hint: 'Tres cuartos de vuelta (Oeste)' },
  { value: 360, name: 'COMPLETO (360°)', hint: 'Una vuelta entera' }
];

// Inicia en un ángulo aleatorio excluyendo el 0° para el primer reto
const currentQuestion = ref(anglesList[2]); 

// Dificultad
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

// --- MOTOR DE VOZ UNIFICADO (OFFLINE/ONLINE) ---
const speak = (text, state = 'intro') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); 

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';

  switch (state) {
    case 'gold':
      utterance.pitch = 1.2; utterance.rate = 1.1; break;
    case 'silver':
      utterance.pitch = 1.0; utterance.rate = 1.0; break;
    case 'copper':
      utterance.pitch = 0.9; utterance.rate = 0.95; break;
    case 'intro':
    default:
      utterance.pitch = 1.0; utterance.rate = 1.0; break;
  }
  window.speechSynthesis.speak(utterance);
};

const playIntroVoice = () => {
  speak("Navegación de Ángulos. Revisa la bitácora para conocer los grados. En el mar, Babor es izquierda y color rojo, Estribor es derecha y color verde. Usa los botones o gira el timón manualmente hasta el rumbo que pide el capitán. ¡A toda vela!", 'intro');
};

// --- EFECTOS DE SONIDO ---
const playSound = (type) => {
  try {
    const audio = new Audio(type === 'success' ? '/audios/success.mp3' : '/audios/lightning.mp3');
    audio.play();
  } catch (e) {
    console.warn("Sonido no encontrado", e);
  }
};

// --- LÓGICA DE PARTIDA ---
const announceChallenge = () => {
  speak(`Capitán pide rumbo a ${currentQuestion.value.name}. ${currentQuestion.value.hint}. Gira a babor o estribor.`, 'intro');
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

// Botones fijos
const rotate = (deg) => {
  if (isAnimating.value || isDragging.value) return;
  currentRotation.value += deg;
};

// LÓGICA HÍBRIDA (TOUCH / MOUSE DRAG)
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
  e.preventDefault(); // Evita scroll de pantalla
  
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
  // Efecto Imán: Ajusta al múltiplo de 45 más cercano
  currentRotation.value = Math.round(currentRotation.value / 45) * 45;
  
  window.removeEventListener('mousemove', onPointerMove);
  window.removeEventListener('touchmove', onPointerMove);
  window.removeEventListener('mouseup', onPointerUp);
  window.removeEventListener('touchend', onPointerUp);
};

// --- VALIDACIÓN MATEMÁTICA EXACTA Y DINÁMICA NÁUTICA ---
const checkAngle = () => {
  if (isAnimating.value) return;

  let targetAngle = currentQuestion.value.value;
  let currentDeg = currentRotation.value;
  let isCorrect = false;

  // Lógica Náutica Exacta: 0° y 360° apuntan al mismo Norte Verdadero
  let normalizedRotation = ((currentDeg % 360) + 360) % 360;
  let targetNormalized = targetAngle % 360; // Convierte 360 en 0

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
  window.speechSynthesis.cancel(); 
  currentStep.value = 2;
  generateQuestion(); // Al llamarlo aquí, también activará la voz inicial del primer reto
};

const resetGame = () => {
  progress.value = 0;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  currentStep.value = 1;
  playIntroVoice();
};

const handleClose = () => {
  window.speechSynthesis.cancel();
  if (currentStep.value === 2) {
    currentStep.value = 1; 
    playIntroVoice();
  } else {
    emit('close'); 
  }
};

onMounted(() => playIntroVoice());
onUnmounted(() => window.speechSynthesis.cancel());
</script>

<template>
  <div class="master-container">
    <main class="app-canvas ocean-bg">
      
      <div v-if="currentStep === 3">
        <CoinRain :type="bestCoinType" :count="40" />
      </div>

      <header class="header-standard shrink-0 z-10 relative !py-2">
        <template v-if="currentStep !== 1">
          <div class="trophy-section flex items-center gap-2 animate-fade-in">
            <Trophy size="22" class="text-blue-600 drop-shadow-sm" />
            <span class="text-xl font-black text-blue-900">{{ progress }}/10</span>
          </div>

          <div class="session-loot-capsule animate-fade-in">
            <div class="loot-item"><img src="/images/coin-gold.png" alt="Oro" /><span>{{ sessionCoins.gold }}</span></div>
            <div class="loot-item border-x border-blue-200"><img src="/images/coin-silver.png" alt="Plata" /><span>{{ sessionCoins.silver }}</span></div>
            <div class="loot-item"><img src="/images/coin-copper.png" alt="Cobre" /><span>{{ sessionCoins.copper }}</span></div>
          </div>
        </template>
        
        <div v-else class="flex-1"></div>

        <button @click="handleClose" class="btn-close-circle p-2 bg-white/50 rounded-full text-slate-800 hover:text-red-500 hover:bg-white transition-all backdrop-blur-sm shadow-sm">
          <X size="20" stroke-width="3" />
        </button>
      </header>

      <div v-if="currentStep === 1" class="game-content flex-1 flex flex-col items-center justify-start pt-2 pb-2 px-4 animate-fade-in z-10 relative">
        <div class="text-center">
          <div class="intro-wheel-wrapper mb-3">
             <div class="css-3d-wheel animate-spin-slow">
                <div class="wheel-spoke"></div>
                <div class="wheel-spoke" style="transform: rotate(45deg);"></div>
                <div class="wheel-spoke" style="transform: rotate(90deg);"></div>
                <div class="wheel-spoke" style="transform: rotate(135deg);"></div>
                <div class="wheel-rim"></div>
                <div class="wheel-hub">
                   <div class="wheel-hub-inner"></div>
                </div>
             </div>
          </div>
          <h1 class="game-title text-sky-100 drop-shadow-md leading-none">Navegación de Ángulos</h1>
        </div>
        
        <div class="rules-panel shadow-2xl bg-white/95 backdrop-blur-sm border-orange-500 border-4 w-full max-w-sm mt-4 flex-1 max-h-[40vh] flex flex-col">
          <div class="rules-badge bg-orange-500 flex justify-between items-center w-full px-4 box-border left-0 top-[-14px]">
            <span class="drop-shadow-sm">BITÁCORA DEL CAPITÁN</span>
            <button @click="playIntroVoice" class="text-orange-100 hover:text-white transition-colors active:scale-90 drop-shadow-sm">
              <Volume2 size="16" />
            </button>
          </div>
          <div class="rules-grid p-4 text-left space-y-2 mt-2 text-slate-700 font-medium overflow-y-auto custom-scrollbar flex-1">
             <div class="flex gap-3 items-center border-b border-slate-100 pb-2">
               <span class="text-lg w-6 text-center">⚓</span>
               <p class="text-xs leading-tight"><strong>0°:</strong> Norte / Frente (Sin giro).</p>
             </div>
             <div class="flex gap-3 items-center border-b border-slate-100 pb-2">
               <span class="text-lg w-6 text-center">🍕</span>
               <p class="text-xs leading-tight"><strong>45°:</strong> Agudo (Un giro corto).</p>
             </div>
             <div class="flex gap-3 items-center border-b border-slate-100 pb-2">
               <span class="text-lg w-6 text-center">📐</span>
               <p class="text-xs leading-tight"><strong>90°:</strong> Recto (Una "L" perfecta).</p>
             </div>
             <div class="flex gap-3 items-center border-b border-slate-100 pb-2">
               <span class="text-lg w-6 text-center">🪃</span>
               <p class="text-xs leading-tight"><strong>135°:</strong> Obtuso (Más de 90°).</p>
             </div>
             <div class="flex gap-3 items-center border-b border-slate-100 pb-2">
               <span class="text-lg w-6 text-center">🌏</span>
               <p class="text-xs leading-tight"><strong>180°:</strong> Llano (Media vuelta, Sur).</p>
             </div>
             <div class="flex gap-3 items-center border-b border-slate-100 pb-2">
               <span class="text-lg w-6 text-center">🌙</span>
               <p class="text-xs leading-tight"><strong>270°:</strong> Reflejo (Tres cuartos, Oeste).</p>
             </div>
             <div class="flex gap-3 items-center">
               <span class="text-lg w-6 text-center">💫</span>
               <p class="text-xs leading-tight"><strong>360°:</strong> Vuelta Completa.</p>
             </div>
          </div>
        </div>

        <button @click="startGame" class="btn-ocean w-full max-w-sm mt-4 mb-8 flex justify-center items-center gap-2 text-lg shrink-0">
          ¡A TODA VELA! <Compass stroke-width="3" class="animate-spin-slow" />
        </button>
      </div>

      <div v-if="currentStep === 2" class="game-content flex-1 flex flex-col items-center justify-center animate-fade-in z-10 relative overflow-hidden w-full">
        
        <div class="instruction-banner z-20 text-center w-[90%] max-w-sm shrink-0 mt-4">
          <span class="text-slate-500 text-xs font-black uppercase tracking-widest block mb-0.5">El Capitán Pide:</span>
          Gira el timón a <strong class="text-sky-600 text-xl block">{{ currentQuestion.name }}</strong>
          <p class="text-xs text-slate-400 font-bold mt-0.5">{{ currentQuestion.hint }}</p>
        </div>

        <div class="sea-area flex-1 w-full max-h-[360px] relative mt-2">
          
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <span v-for="a in [0, 45, 90, 135, 180, 225, 270, 315]" :key="a" 
                  class="absolute text-white/70 font-black text-base tracking-widest drop-shadow-md"
                  :style="{ transform: `rotate(${a}deg) translateY(-180px) rotate(-${a}deg)` }">
              {{ a }}°
            </span>
          </div>
          
          <div class="rudder-container z-20 h-full" :class="{'animate-shake': feedback === 'error'}">
            <div ref="rudderRef"
                 class="rudder-wheel transition-transform duration-[400ms] ease-out relative cursor-grab active:cursor-grabbing" 
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

              <div class="rudder-handle"></div>
              <div class="rudder-handle" style="transform: rotate(45deg);"></div>
              <div class="rudder-handle" style="transform: rotate(90deg);"></div>
              <div class="rudder-handle" style="transform: rotate(135deg);"></div>
              <div class="w-20 h-20 bg-amber-900 rounded-full border-4 border-amber-950 flex items-center justify-center z-10 shadow-inner">
                <Anchor class="text-amber-700/80" :size="32" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 w-full max-w-sm px-4 z-20 mt-4 shrink-0">
           <button @click="rotate(-45)" :disabled="isAnimating" class="flex-1 bg-white text-red-600 font-black py-3 rounded-xl shadow-md active:scale-95 border-2 border-red-100 disabled:opacity-50 transition-all flex flex-col items-center leading-none gap-1">
             <span class="text-[10px] text-red-400">BABOR</span>
             <span class="text-base">↺ -45°</span>
           </button>
           <button @click="rotate(45)" :disabled="isAnimating" class="flex-1 bg-white text-green-600 font-black py-3 rounded-xl shadow-md active:scale-95 border-2 border-green-200 disabled:opacity-50 transition-all flex flex-col items-center leading-none gap-1">
             <span class="text-[10px] text-green-500">ESTRIBOR</span>
             <span class="text-base">+45° ↻</span>
           </button>
        </div>

        <button @click="checkAngle" :disabled="isAnimating" class="btn-ocean mt-4 mb-8 z-20 w-[90%] max-w-sm disabled:opacity-50 disabled:grayscale transition-all shrink-0">
          VALIDAR RUMBO
        </button>
      </div>

      <div v-if="currentStep === 3" class="game-content result-screen flex-1 flex flex-col items-center justify-center py-6 px-4 animate-fade-in z-10 relative">
        <h1 class="text-4xl sm:text-5xl font-black text-sky-100 mb-8 italic drop-shadow-lg text-center uppercase tracking-tighter">¡TIERRA A LA VISTA!</h1>
        
        <div class="final-loot-display flex gap-6 mb-12 bg-white/90 p-6 rounded-[2.5rem] shadow-2xl border-4 border-sky-200 backdrop-blur-sm">
            <div v-if="sessionCoins.gold > 0" class="loot-big gold-glow flex flex-col items-center gap-2">
              <img src="/images/coin-gold.png" class="w-16 h-16 animate-bounce-slow" />
              <span class="text-2xl font-black text-amber-500">+{{ sessionCoins.gold }}</span>
            </div>
            <div v-if="sessionCoins.silver > 0" class="loot-big silver-glow flex flex-col items-center gap-2">
              <img src="/images/coin-silver.png" class="w-16 h-16 animate-bounce-slow" style="animation-delay: 0.1s" />
              <span class="text-2xl font-black text-slate-400">+{{ sessionCoins.silver }}</span>
            </div>
            <div v-if="sessionCoins.copper > 0" class="loot-big copper-glow flex flex-col items-center gap-2">
              <img src="/images/coin-copper.png" class="w-16 h-16 animate-bounce-slow" style="animation-delay: 0.2s" />
              <span class="text-2xl font-black text-amber-700">+{{ sessionCoins.copper }}</span>
            </div>
        </div>

        <div class="action-buttons flex flex-col w-full max-w-xs gap-4 mb-8 shrink-0">
          <button @click="resetGame" class="w-full py-4 bg-white border-4 border-sky-200 text-sky-700 rounded-2xl font-black text-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3">
            <RotateCcw stroke-width="3" /> NUEVO VIAJE
          </button>
          <button @click="handleClose" class="btn-ocean w-full flex items-center justify-center gap-3 text-lg">
            <Home stroke-width="3" /> VOLVER AL PUERTO
          </button>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.master-container {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; justify-content: center; align-items: center;
  background-color: #f1f5f9; overflow: hidden; touch-action: none !important;
}

.app-canvas {
  display: flex; flex-direction: column; justify-content: space-between;
  position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none; touch-action: none !important; -webkit-tap-highlight-color: transparent;
  width: 100vw; height: 100dvh;
}

.ocean-bg {
  background: linear-gradient(to bottom, #0ea5e9, #0369a1);
}

@media (min-width: 1025px) {
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.4); border: 8px solid white; }
}
@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; }
}

.header-standard {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1.25rem; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px);
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.session-loot-capsule {
  display: flex; align-items: center; background: white; padding: 6px 16px;
  border-radius: 9999px; border: 2px solid #bae6fd; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; color: #0c4a6e; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }

.game-title { font-size: 2rem; font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; line-height: 1; }

.rules-panel { border-radius: 1.75rem; position: relative; }
.rules-badge { position: absolute; color: white; font-size: 11px; font-weight: 900; padding: 6px 16px; border-radius: 9999px; letter-spacing: 0.05em; }

/* NUEVO ICONO TIMÓN 3D CSS PORTADA */
.intro-wheel-wrapper {
  display: inline-flex;
  padding: 15px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2), inset 0 0 10px rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
}

.css-3d-wheel {
  width: 80px; height: 80px;
  position: relative;
  display: flex; align-items: center; justify-content: center;
}

.wheel-rim {
  width: 100%; height: 100%;
  border-radius: 50%;
  border: 12px solid #78350f;
  box-shadow: inset 0 4px 8px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5);
  position: absolute; z-index: 5;
}

.wheel-spoke {
  position: absolute;
  width: 8px; height: 110px;
  background: linear-gradient(to right, #451a03, #92400e, #451a03);
  border-radius: 4px; z-index: 1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.wheel-hub {
  width: 24px; height: 24px;
  background: #451a03; border-radius: 50%;
  position: absolute; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.6);
}

.wheel-hub-inner {
  width: 10px; height: 10px;
  background: #d97706; border-radius: 50%;
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.5);
}

.btn-ocean {
  background: linear-gradient(to bottom, #f59e0b, #d97706); color: white; 
  padding: 1.2rem 2rem; border-radius: 16px; font-weight: 900; border: 2px solid #b45309;
  box-shadow: 0 6px 0 #92400e, 0 15px 20px rgba(3, 105, 161, 0.4); transition: all 0.1s;
}
.btn-ocean:active { transform: translateY(6px); box-shadow: 0 0 0 #92400e, 0 5px 10px rgba(3, 105, 161, 0.4); }

.sea-area { position: relative; display: flex; align-items: center; justify-content: center; }

/* Banner más estrecho */
.instruction-banner {
  background: white; padding: 10px 20px; border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); margin-bottom: 15px; border: 4px solid #e0f2fe;
}

.rudder-container { position: relative; display: flex; justify-content: center; align-items: center; }

.rudder-wheel {
  width: 250px; height: 250px; background: transparent; border: 20px solid #78350f;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.8);
}

.rudder-handle {
  position: absolute; width: 24px; height: 310px;
  background: linear-gradient(to right, #451a03, #78350f, #451a03);
  z-index: -1; border-radius: 12px; box-shadow: 0 5px 10px rgba(0,0,0,0.5);
}

/* Efectos de Acierto / Error */
.glow-success {
  border-color: #22c55e !important;
  box-shadow: 0 0 40px rgba(34, 197, 94, 0.9), inset 0 0 30px rgba(34, 197, 94, 0.8) !important;
  animation: pulse-glow 0.3s infinite alternate;
}

.glow-error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.9), inset 0 0 30px rgba(239, 68, 68, 0.8) !important;
  animation: pulse-glow 0.2s infinite alternate;
}

@keyframes pulse-glow {
  from { filter: brightness(1); }
  to { filter: brightness(1.5); }
}

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-spin-slow { animation: spin 8s linear infinite; }
.animate-bounce-slow { animation: bounceSlow 3s infinite ease-in-out; }
@keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

/* Temblor para el error */
.animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-4px, 0, 0); }
  20%, 80% { transform: translate3d(6px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-10px, 0, 0); }
  40%, 60% { transform: translate3d(10px, 0, 0); }
}

.gold-glow { filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.6)); }
.silver-glow { filter: drop-shadow(0 0 15px rgba(148, 163, 184, 0.6)); }
.copper-glow { filter: drop-shadow(0 0 15px rgba(180, 83, 9, 0.6)); }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>