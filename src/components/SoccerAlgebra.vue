<script setup>
/** * ARCHIVO: SoccerAlgebra.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.3 + BLINDAJE DVH + REPORTE VIVO
 * LOGICA: Operaciones algebraicas con reporte de goles al Store para misiones.
 */
import { ref, computed, onMounted } from 'vue';
import { Trophy, X, Star, PlayCircle, RotateCcw, BookOpen, ChevronRight } from 'lucide-vue-next';
import { gsap } from 'gsap';
import { useGamificationStore } from '@/stores/useGamificationStore'; 

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- 1. SISTEMA DE RECOMPENSAS EN TIEMPO REAL ---
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const progress = ref(0); 

// --- 2. ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const balls = ref([]);
const currentEquation = ref(null);
const gameArea = ref(null);

const levelName = computed(() => {
  if (progress.value < 3) return 'Bronce (Sumas)';
  if (progress.value < 7) return 'Plata (Restas)';
  return 'Oro (Tablas)';
});

// Sonidos calibrados
const soundKick = new Audio(new URL('../assets/sounds/soccer/kick.mp3', import.meta.url).href);
const soundGoal = new Audio(new URL('../assets/sounds/soccer/goal.mp3', import.meta.url).href);
soundGoal.volume = 0.75; 
const soundCoins = new Audio('/audios/coins.mp3');

const formattedEquation = computed(() => {
  if (!currentEquation.value) return '';
  return currentEquation.value.text.replace(/x/g, '<span class="chalk-x-container"><span class="chalk-x">x</span></span>');
});

const currentBg = computed(() => {
  if (progress.value < 3) return '#22c55e'; 
  if (progress.value < 7) return '#16a34a'; 
  return '#15803d'; 
});

// --- 3. LÓGICA DE NAVEGACIÓN ---
const startGame = () => {
  gameState.value = 'playing';
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  generateChallenge();
};

const returnToRules = () => {
  gameState.value = 'rules';
  balls.value = [];
};

// --- 4. MOTOR DEL JUEGO ---
const generateChallenge = () => {
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
  setTimeout(() => spawnBalls(x), 50);
};

const spawnBalls = (correctValue) => {
  const newBalls = [];
  const options = [correctValue];
  while(options.length < 3) {
    const wrong = Math.floor(Math.random() * 40);
    if (!options.includes(wrong)) options.push(wrong);
  }
  options.sort(() => Math.random() - 0.5);
  const containerWidth = gameArea.value ? gameArea.value.clientWidth : 400;
  
  options.forEach((val, i) => {
    const startX = (containerWidth / 4) * (i + 1) - 37;
    newBalls.push({
      id: i, value: val, x: startX, originalX: startX, 
      y: 70, scale: 1, rotation: 0, kicked: false
    });
  });
  balls.value = newBalls;
};

const kickBall = (ball) => {
  if (ball.kicked || gameState.value !== 'playing') return;
  ball.kicked = true;
  soundKick.play();
  
  if (ball.value === currentEquation.value.answer) {
    const tl = gsap.timeline();
    tl.to(ball, { y: 285, scale: 0.45, rotation: 360, duration: 0.3, ease: "power2.out" })
      .to(ball, { y: 300, duration: 0.05, ease: "sine.inOut" })
      .to(ball, { y: 220, scale: 0.38, rotation: 720, duration: 0.25, ease: "bounce.out",
        onComplete: () => {
          soundGoal.play();
          if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

          // 🛡️ REPORTE QUIRÚRGICO A MISIONES: Cada gol avanza la llamita
          store.updateMissionProgress('soccer_goal_algebra', 1);

          const opType = currentEquation.value.type;
          if (opType === 'add') sessionCoins.value.copper += 1;
          else if (opType === 'sub') sessionCoins.value.copper += 5;
          else if (opType === 'multi') sessionCoins.value.silver += 1;
          else if (opType === 'div') sessionCoins.value.gold += 1;
          progress.value++;
          setTimeout(() => { if (progress.value >= 10) endGame(); else generateChallenge(); }, 600);
        }
      });
  } else {
    gsap.to(ball, { y: 180, x: ball.x + (Math.random() > 0.5 ? 100 : -100), scale: 0.5, rotation: 1080, duration: 0.5,
      onComplete: () => { gsap.to(ball, { y: 70, x: ball.originalX, scale: 1, rotation: 0, duration: 0.6, onComplete: () => { ball.kicked = false; } }); }
    });
  }
};

const endGame = async () => { 
  gameState.value = 'finished'; 
  
  // 🛡️ REPORTE DE PARTIDA COMPLETADA PARA LA RACHA:
  store.updateMissionProgress('play_any_game', 1);

  await store.addMultipleCoins({...sessionCoins.value});
  await store.updateMissionProgress('complete_challenge', 1);
  soundCoins.play().catch(() => {}); 
  emit('win', { ...sessionCoins.value });
};

const resetGame = () => {
  progress.value = 0;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  startGame();
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas shadow-smartphone transition-colors duration-1000" :style="{ backgroundColor: gameState === 'playing' ? currentBg : '#f8fafc' }">
      
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
        <button @click="returnToRules" class="btn-close-circle"><X size="20" /></button>
      </header>

      <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 bg-slate-50 relative animate-fade-in">
        <button @click="emit('close')" class="absolute top-4 right-4 bg-slate-200 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all">
          <X size="24" stroke-width="3" />
        </button>

        <div class="flex flex-col items-center mt-6 w-full text-center">
          <h1 class="game-title text-4xl mb-10 italic font-black text-indigo-900">SOCCER ALGEBRA</h1>
          
          <div class="spherical-ball-rules-wrapper animate-float">
            <svg viewBox="35 35 130 130" xmlns="http://www.w3.org/2000/svg" class="ball-svg-full-size">
              <defs>
                <radialGradient id="shadeRules" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffffff" /><stop offset="40%" stop-color="#e6e6f0" /><stop offset="100%" stop-color="#b3b3cc" /></radialGradient>
                <filter id="shadowRules"><feOffset dx="0" dy="1" /><feGaussianBlur stdDeviation="1" result="b" /><feComposite operator="out" in="SourceGraphic" in2="b" result="i" /><feFlood flood-color="black" flood-opacity="0.2" result="c" /><feComposite operator="in" in="c" in2="i" result="s" /><feComposite operator="over" in="s" in2="SourceGraphic" /></filter>
              </defs>
              <circle cx="100" cy="100" r="65" fill="url(#shadeRules)" stroke="#94a3b8" stroke-width="0.5" />
              <g filter="url(#shadowRules)">
                <path d="M100 75 L120 90 L112 115 L88 115 L80 90 Z" fill="#2563eb" />
                <path d="M60 70 L75 60 L80 45 Q65 45 55 60 Z" fill="#2563eb" /><path d="M140 70 L125 60 L120 45 Q135 45 145 60 Z" fill="#2563eb" /><path d="M70 130 L55 120 L50 105 Q50 125 65 135 Z" fill="#2563eb" /><path d="M130 130 L145 120 L150 105 Q150 125 135 135 Z" fill="#2563eb" /><path d="M100 165 L115 155 L85 155 Z" fill="#2563eb" />
                <g fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M100 75 V55" /><path d="M120 90 L140 85" /><path d="M112 115 L125 135" /><path d="M88 115 L75 135" /><path d="M80 90 L60 85" /><path d="M80 45 L100 35 L120 45" /></g>
              </g>
              <ellipse cx="85" cy="75" rx="30" ry="20" fill="white" fill-opacity="0.3" transform="rotate(-30, 85, 75)" />
            </svg>
          </div>
        </div>

        <div class="rules-panel shadow-2xl w-full">
          <div class="rules-badge uppercase font-black tracking-widest">MANUAL DEL CAMPEÓN</div>
          <ul class="p-4 space-y-4 text-slate-700 font-bold list-none">
            <li class="flex gap-3 text-sm">🥅 <span>Anota 10 goles para ganar la racha.</span></li>
            <li class="flex gap-3 text-sm text-indigo-700">➕ <span>Suma: 🥉 | Resta: 🥈 | Mult/Div: 🥇</span></li>
          </ul>
        </div>

        <button @click="startGame" 
                class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                       text-white font-black italic text-xl uppercase rounded-[2rem] 
                       border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                       active:translate-y-[4px] active:border-b-[4px] transition-all 
                       flex items-center justify-center py-4 group mb-4">
            ¡A LA CANCHA! 
            <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
            </div>
        </button>
      </div>

      <div v-else-if="gameState === 'playing'" class="game-content flex-1 flex flex-col items-center relative">
        <div class="scoreboard-container mt-6 z-20">
          <div class="text-white font-black text-center uppercase tracking-widest text-sm mb-4 drop-shadow-md">Nivel: {{ levelName }}</div>
          <div class="equation-display">
            <span v-if="currentEquation" class="equation-text"><span v-html="formattedEquation"></span></span>
          </div>
        </div>

        <div class="pitch" ref="gameArea">
          <div class="goal-area"></div>
          <div 
            v-for="ball in balls" :key="ball.id"
            class="soccer-ball-vector soccer-ball-vector-game-static"
            :class="{ 'ball-kicked': ball.kicked }"
            :style="{ left: ball.x + 'px', bottom: ball.y + 'px', transform: `scale(${ball.scale}) rotate(${ball.rotation}deg)` }"
            @pointerdown.prevent.stop="kickBall(ball)"
          >
            <svg viewBox="35 35 130 130" xmlns="http://www.w3.org/2000/svg" class="ball-svg-full-size">
              <defs>
                <radialGradient :id="'shadeGame'+ball.id" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stop-color="#ffffff" /><stop offset="40%" stop-color="#e6e6f0" /><stop offset="100%" stop-color="#b3b3cc" />
                </radialGradient>
                <filter :id="'shadowGame'+ball.id"><feOffset dx="0" dy="1" /><feGaussianBlur stdDeviation="1" result="offset-blur" /><feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" /><feFlood flood-color="black" flood-opacity="0.2" result="color" /><feComposite operator="in" in="color" in2="inverse" result="shadow" /><feComposite operator="over" in="shadow" in2="SourceGraphic" /></filter>
              </defs>
              <circle cx="100" cy="100" r="65" :fill="'url(#shadeGame'+ball.id+')'" stroke="#94a3b8" stroke-width="0.5" />
              <g :filter="'url(#shadowGame'+ball.id+')'">
                <path d="M100 75 L120 90 L112 115 L88 115 L80 90 Z" fill="#2563eb" />
                <path d="M60 70 L75 60 L80 45 Q65 45 55 60 Z" fill="#2563eb" /><path d="M140 70 L125 60 L120 45 Q135 45 145 60 Z" fill="#2563eb" /><path d="M70 130 L55 120 L50 105 Q50 125 65 135 Z" fill="#2563eb" /><path d="M130 130 L145 120 L150 105 Q150 125 135 135 Z" fill="#2563eb" /><path d="M100 165 L115 155 L85 155 Z" fill="#2563eb" />
                <g fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M100 75 V55" /><path d="M120 90 L140 85" /><path d="M112 115 L125 135" /><path d="M88 115 L75 135" /><path d="M80 90 L60 85" /><path d="M80 45 L100 35 L120 45" /></g>
              </g>
              <ellipse cx="85" cy="75" rx="30" ry="20" fill="white" fill-opacity="0.3" transform="rotate(-30, 85, 75)" />
            </svg>
            <div class="ball-number-overlay-surgical font-black">{{ ball.value }}</div>
          </div>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center relative overflow-hidden">
        <div class="bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center w-full max-w-[380px] animate-fade-in border-4 border-amber-400 uppercase italic">
          <Trophy size="80" class="text-yellow-500 mb-4 animate-bounce drop-shadow-lg" />
          <h2 class="text-3xl font-black text-indigo-900 mb-2 tracking-tight">¡MISIÓN LOGRADA!</h2>
          
          <div class="bg-slate-50 rounded-3xl p-5 mb-8 w-full flex justify-around border-2 border-slate-100 shadow-inner">
            <div class="flex flex-col items-center"><img src="/images/coin-gold.png" class="w-10 h-10 mb-1" /><span class="text-xl font-black text-slate-800">+{{ sessionCoins.gold }}</span></div>
            <div class="flex flex-col items-center border-x border-slate-200 px-4"><img src="/images/coin-silver.png" class="w-10 h-10 mb-1" /><span class="text-xl font-black text-slate-800">+{{ sessionCoins.silver }}</span></div>
            <div class="flex flex-col items-center"><img src="/images/coin-copper.png" class="w-10 h-10 mb-1" /><span class="text-xl font-black text-slate-800">+{{ sessionCoins.copper }}</span></div>
          </div>

          <div class="w-full flex flex-col gap-4">
            <button @click="resetGame" 
                    class="w-full py-4 rounded-[2rem] text-xl font-black italic uppercase text-white bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] border-b-[8px] border-[#1E3A8A] shadow-lg active:translate-y-[4px] active:border-b-[4px] transition-all flex items-center justify-center">
              <RotateCcw size="20" class="mr-2" /> NUEVA RONDA
            </button>
            <button @click="emit('close')" class="text-slate-400 py-1 font-black text-sm hover:text-indigo-600 tracking-widest opacity-70">
              TERMINAR
            </button>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* 🛡️ BLINDAJE TÉCNICO MASTER-CONTAINER v2.9.3 */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; height: 100dvh; top: 0; left: 0; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: all 0.4s; width: 100vw; height: 100dvh; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 100; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.btn-close-circle { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

.spherical-ball-rules-wrapper { position: relative; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; }
.ball-svg-full-size { width: 100%; height: 100%; }

.equation-display { background: #1a1a1a; padding: 10px 40px; border: 4px solid #333; border-radius: 20px; min-height: 100px; display: flex; align-items: center; box-shadow: 0 8px 0 #000; }
.equation-text { color: #fcd34d; font-size: 2.5rem; font-weight: 900; }
:deep(.chalk-x) { font-family: 'Caveat', cursive; color: #ffffff; font-size: 5rem; filter: drop-shadow(0px 0px 2px #fbbf24); margin: 0 8px; }

.pitch { position: absolute; bottom: 0; width: 100%; height: 60%; perspective: 1000px; border-top: 3px solid rgba(255,255,255,0.6); }
.goal-area { width: 75%; height: 150px; border: 8px solid white; border-bottom: none; margin: 0 auto; transform: rotateX(20deg); transform-origin: bottom center; background-image: linear-gradient(45deg, rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(-45deg, rgba(255,255,255,0.9) 1px, transparent 1px); background-size: 16px 16px; }

.soccer-ball-vector { position: absolute; width: 85px; height: 85px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; }
.ball-number-overlay-surgical { position: absolute; z-index: 10; font-weight: 900; font-size: 2.1rem; color: #1e3a8a; background: rgba(255,255,255,0.8); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #22c55e; }

.rules-panel { width: 95%; background: white; padding: 1.5rem; border-radius: 2.5rem; border: 2px solid #e2e8f0; position: relative; margin-top: 1rem; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

.game-title { font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>