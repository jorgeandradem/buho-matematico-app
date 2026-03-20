<script setup>
/** * ARCHIVO: SCALE MASTER - ScaleMaster.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.3 + BLINDAJE DVH + REPORTE VIVO + CSS 3D PREMIUM
 * LOGICA: Desafío de equilibrio con reporte de niveles al Store para la llamita.
 */
import { ref, computed, watch, onMounted } from 'vue';
import { X, Trophy, CheckCircle2, AlertCircle, Coins, ChevronRight } from 'lucide-vue-next';
import { gsap } from 'gsap'; 
import { useGamificationStore } from '@/stores/useGamificationStore'; 

const emit = defineEmits(['close']);
const store = useGamificationStore();

// --- 1. ESTADOS DE FLUJO ---
const gameState = ref('rules'); 
const currentLevel = ref(1);
const totalLevels = 10;
const isVictory = ref(false); 
const targetWeight = ref(0); 
const rightWeights = ref([]); 

// --- SISTEMA DE RECOMPENSAS EN TIEMPO REAL ---
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

const getAssetUrl = (name) => {
  return new URL(`../assets/scale-master/${name}`, import.meta.url).href;
};

const inventory = computed(() => {
  return currentLevel.value < 5 ? [2, 3, 5, 10] : [2, 3, 10, 20, 25];
});

const playSound = (name) => {
  const audio = new Audio(`/audios/${name}.mp3`);
  audio.volume = 0.9;
  audio.play().catch(() => {});
};

const generateRandomWeight = () => Math.floor(Math.random() * 76) + 5;

onMounted(() => {
  targetWeight.value = generateRandomWeight();
});

const totalRight = computed(() => {
  return rightWeights.value
    .filter(w => !w.isRemoving)
    .reduce((a, b) => a + b.value, 0);
});

// --- 2. LÓGICA DE BALANCEO Y BURBUJA ---
const currentRotation = ref(0);
const weightOffset = computed(() => totalRight.value - targetWeight.value);
const bubbleX = ref(0); 

watch(totalRight, (newTotal) => {
  const diff = newTotal - targetWeight.value;
  
  const targetRot = Math.max(Math.min(diff * 2.5, 18), -18);
  gsap.to(currentRotation, { value: targetRot, duration: 0.8, ease: "back.out(1.7)" });

  let newBubbleX = Math.max(Math.min(diff * 1.5, 50), -50);
  gsap.to(bubbleX, { value: newBubbleX, duration: 0.6, ease: "power2.out" });

  if (newTotal === targetWeight.value && !isVictory.value && newTotal > 0) {
    isVictory.value = true; 
    playSound('correct1');

    // 🛡️ REPORTE QUIRÚRGICO A MISIONES
    store.updateMissionProgress('scale_balanced', 1);
    
    if (currentLevel.value < 7) sessionCoins.value.copper++;
    else sessionCoins.value.silver++;

    setTimeout(() => {
      if (currentLevel.value >= totalLevels) finishGame();
      else autoNextLevel();
    }, 1200); 
  }
});

const isGoldMode = computed(() => currentLevel.value >= 7);
const weightImage = computed(() => isGoldMode.value ? getAssetUrl('weight-gold.png') : getAssetUrl('weight-iron.png'));

// --- 3. LÓGICA DE NAVEGACIÓN ---
const startGame = () => {
  gameState.value = 'playing';
  currentLevel.value = 1;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  targetWeight.value = generateRandomWeight();
  rightWeights.value = [];
  isVictory.value = false;
};

const closeScaleMaster = () => {
    if (gameState.value === 'rules') {
        emit('close'); 
    } else {
        gameState.value = 'rules';
    }
};

const autoNextLevel = () => {
  currentLevel.value++;
  targetWeight.value = generateRandomWeight();
  rightWeights.value = [];
  isVictory.value = false;
};

const finishGame = async () => {
  gameState.value = 'finished';
  
  // 🛡️ REPORTE DE PARTIDA COMPLETA
  store.updateMissionProgress('play_any_game', 1);

  if (sessionCoins.value.silver > 0) await store.addCoins('silver', sessionCoins.value.silver);
  if (sessionCoins.value.copper > 0) await store.addCoins('copper', sessionCoins.value.copper);
  
  await store.updateMissionProgress('complete_challenge', 1);
  playSound('finish1'); playSound('coins'); triggerCoinRain();
};

const triggerCoinRain = () => {
  const container = document.querySelector('.app-canvas');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const coin = document.createElement('div');
    coin.innerHTML = isGoldMode.value ? '🟡' : '🥉';
    coin.className = 'absolute text-3xl z-[999] pointer-events-none';
    coin.style.left = Math.random() * 90 + 5 + '%';
    coin.style.top = '-50px';
    container.appendChild(coin);
    gsap.to(coin, {
      y: container.offsetHeight + 100,
      x: (Math.random() - 0.5) * 150,
      rotation: Math.random() * 720,
      duration: Math.random() * 2 + 1,
      ease: "power1.in",
      onComplete: () => coin.remove()
    });
  }
};

const addWeight = (val, event) => {
  if (isVictory.value || gameState.value !== 'playing' || rightWeights.value.length >= 15) return;
  playSound('whoosh');
  const rect = event.currentTarget.getBoundingClientRect();
  const flyer = event.currentTarget.cloneNode(true);
  Object.assign(flyer.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, zIndex: '5000', pointerEvents: 'none' });
  document.body.appendChild(flyer);
  const targetArea = document.querySelector('.plate-target-area').getBoundingClientRect();
  gsap.to(flyer, {
    x: targetArea.left - rect.left + (targetArea.width / 4),
    y: targetArea.top - rect.top,
    scale: 0.7, duration: 0.5, ease: "power2.out",
    onComplete: () => {
      document.body.removeChild(flyer);
      rightWeights.value.push({ id: Math.random().toString(36).substr(2, 9), value: val, isRemoving: false });
      playSound('correct1');
    }
  });
};

const triggerRemove = (id, event) => {
  if (isVictory.value || gameState.value !== 'playing') return;
  const weightObj = rightWeights.value.find(w => w.id === id);
  if (!weightObj || weightObj.isRemoving) return;
  weightObj.isRemoving = true; 
  playSound('wrong1');
  const element = event.currentTarget;
  element.classList.add('filter-red');
  gsap.to(element, { y: 500, opacity: 0, scale: 0, duration: 0.25, ease: "power4.in", onComplete: () => { rightWeights.value = rightWeights.value.filter(w => w.id !== id); } });
};
</script>

<template>
  <div class="master-container font-inter">
    
    <main class="app-canvas shadow-smartphone bg-gradient-to-br from-[#fdfbf7] via-[#f8f6f0] to-[#f3f0e6]">
      
      <header v-if="gameState === 'playing'" class="header-standard shrink-0 bg-white/70 backdrop-blur-sm">
        <div class="trophy-section">
          <Trophy size="22" class="text-yellow-500" />
          <span class="text-xl font-black text-indigo-900">{{ currentLevel }}/10</span>
        </div>
        <div class="session-loot-capsule">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="loot-item border-x border-slate-200"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>
        <button @click="closeScaleMaster" class="btn-close-circle"><X size="20" /></button>
      </header>

      <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 relative animate-fade-in w-full h-full">
        <button @click="emit('close')" class="absolute top-4 right-4 bg-white/60 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all z-50 shadow-sm border border-slate-200">
          <X size="24" stroke-width="3" />
        </button>

        <div class="flex flex-col items-center justify-center mt-4">
            <div class="scale-3d-wrap">
                <div class="scale-arm-group animate-scale-balance">
                    <div class="scale-arm"></div>
                    <div class="plate-group left"><div class="string left"></div><div class="string right"></div><div class="plate"></div></div>
                    <div class="plate-group right"><div class="string left"></div><div class="string right"></div><div class="plate"></div></div>
                </div>
                <div class="scale-pillar"></div>
                <div class="scale-base"></div>
                <div class="scale-pin"></div>
            </div>

            <h1 class="game-title text-4xl italic uppercase font-black text-indigo-900 mt-4 drop-shadow-sm">Scale Master</h1>
        </div>
        
        <div class="rules-panel-large shadow-xl bg-white/80 backdrop-blur-sm w-full max-w-[400px]">
          <div class="rules-badge uppercase font-black tracking-widest">Manual del Equilibrio</div>
          <div class="rules-grid-content p-2 mt-2">
            <div class="rule-row"><CheckCircle2 class="text-green-500 shrink-0" size="24" /><p class="text-sm font-bold text-slate-700 leading-tight">Iguala el peso objetivo colocando pesas en el plato derecho.</p></div>
            <div class="rule-row"><AlertCircle class="text-indigo-500 shrink-0" size="24" /><p class="text-sm font-bold text-slate-700 leading-tight">Si te pasas del peso, toca una pesa en el plato para eliminarla.</p></div>
            <div class="rule-row"><Coins class="text-amber-500 shrink-0" size="24" /><p class="text-sm font-bold text-slate-700 leading-tight">Niveles 7 al 10 activan el **Modo Oro** con mejores premios.</p></div>
          </div>
        </div>
        
        <button @click="startGame" 
                class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                       text-white font-black italic text-xl uppercase rounded-[2rem] 
                       border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                       active:translate-y-[4px] active:border-b-[4px] transition-all 
                       flex items-center justify-center py-4 group mb-6 z-10">
          ¡AL SUPERMERCADO! 
          <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
            <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
          </div>
        </button>
      </div>

      <div v-else-if="gameState === 'playing'" class="game-content flex-1 flex flex-col items-center p-2 relative w-full h-full">
        <div class="w-full flex flex-col items-center z-[250] py-4 bg-white/40 backdrop-blur-sm border-b border-slate-200">
          <svg width="200" height="34" viewBox="0 0 200 34" class="drop-shadow-md">
            <rect x="2" y="2" width="196" height="30" rx="15" fill="white" fill-opacity="0.2" stroke="black" stroke-width="2" />
            <ellipse :cx="100 + bubbleX" cy="17" rx="9" ry="9" fill="#22c55e" stroke="white" stroke-width="2" class="bubble-glow" />
            <line x1="100" y1="5" x2="100" y2="29" stroke="black" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.3" />
          </svg>
          <div class="mt-2 px-6 py-1 rounded-full border-2 border-white shadow-md transition-all duration-300"
               :class="weightOffset === 0 ? 'bg-green-500 text-white scale-110 font-black' : (weightOffset < 0 ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white')">
            <span class="font-black text-xs uppercase italic tracking-widest">
              {{ weightOffset === 0 ? 'EQUILIBRIO LOGRADO' : (weightOffset < 0 ? 'Faltan ' + Math.abs(weightOffset) : 'Sobran +' + weightOffset) }}
            </span>
          </div>
        </div>

        <div class="relative w-full flex-1 flex flex-col items-center justify-center -mt-4">
          <img :src="getAssetUrl('scale-base.png')" class="absolute w-[260px] bottom-28 z-[10] pointer-events-none opacity-80" />
          <div class="relative w-full flex justify-between items-end transition-transform duration-100 px-4" :style="{ transform: `rotate(${currentRotation}deg)` }">
            
            <div class="relative w-36 flex flex-col items-center origin-top z-[20]" :style="{ transform: `rotate(${-currentRotation}deg)` }">
              <div class="relative z-[100] -mb-4 flex items-center justify-center scale-110">
                <img :src="weightImage" class="w-16 drop-shadow-md" />
                <span class="absolute inset-0 flex items-center justify-center font-black text-2xl text-slate-900 italic">{{ targetWeight }}</span>
              </div>
              <img :src="getAssetUrl('scale-plate.png')" class="w-full z-[15]" />
            </div>
            
            <div class="relative w-36 flex flex-col items-center origin-top plate-target-area z-[20]" :style="{ transform: `rotate(${-currentRotation}deg)` }">
              <img :src="getAssetUrl('scale-plate.png')" class="absolute bottom-0 w-full z-[15]" />
              <div class="absolute bottom-10 w-full flex flex-wrap-reverse justify-center gap-0.5 p-1 z-[400]">
                 <button v-for="w in rightWeights" :key="w.id" @click.stop="triggerRemove(w.id, $event)"
                         class="relative weight-on-plate hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer z-[410]">
                    <img :src="weightImage" class="w-10 drop-shadow-sm" />
                    <span class="absolute inset-0 flex items-center justify-center font-black text-slate-950 text-[10px] z-[420] pointer-events-none">{{ w.value }}</span>
                 </button>
              </div>
            </div>
            
          </div>
        </div>

        <div class="w-full bg-white/80 backdrop-blur-lg p-6 rounded-t-[40px] border-t-4 border-slate-100 shadow-2xl flex justify-around items-center z-[500]">
          <button v-for="w in inventory" :key="w" @click="addWeight(w, $event)" class="relative active:scale-75 transition-all flex items-center justify-center hover:scale-110">
            <img :src="weightImage" class="w-14 drop-shadow-lg" />
            <span class="absolute inset-0 flex items-center justify-center font-black text-slate-800 text-lg z-40">{{ w }}</span>
          </button>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col items-center justify-center p-6 text-center font-inter uppercase italic w-full h-full relative">
          <div class="bg-white/70 p-8 rounded-[4rem] border-4 border-amber-400 backdrop-blur-md flex flex-col items-center w-full max-w-sm animate-fade-in relative shadow-2xl z-10">
            
            <img :src="getAssetUrl('medal-gold.png')" class="w-40 h-40 object-contain mb-4 animate-bounce drop-shadow-2xl" />
            
            <h2 class="text-3xl font-black text-indigo-950 mb-2 italic tracking-tight">¡ESCALA DOMINADA!</h2>
            
            <div class="prize-card-large w-full bg-white/60 rounded-3xl p-6 mb-8 text-center border border-white shadow-sm">
              <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">Tu Botín</p>
              <div class="flex justify-around items-center">
                  <div class="flex flex-col items-center"><img src="/images/coin-silver.png" class="w-10 h-10" /><span class="text-xl font-black text-indigo-950">+{{ sessionCoins.silver }}</span></div>
                  <div class="flex flex-col items-center"><img src="/images/coin-copper.png" class="w-10 h-10" /><span class="text-xl font-black text-indigo-950">+{{ sessionCoins.copper }}</span></div>
              </div>
            </div>

            <div class="w-full flex flex-col gap-4">
              <button @click="startGame" 
                      class="w-full py-5 rounded-[2rem] text-xl font-black italic uppercase text-white bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] border-b-[8px] border-[#1E3A8A] shadow-lg active:translate-y-[4px] active:border-b-[4px] transition-all">
                VOLVER A JUGAR
              </button>
              <button @click="emit('close')" class="text-slate-400 py-2 font-black text-xs hover:text-indigo-600 uppercase tracking-widest transition-colors">SALIR AL PORTAL</button>
            </div>
          </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 🛡️ BLINDAJE TÉCNICO MASTER-CONTAINER v2.9.3 */
.master-container { 
    position: fixed; inset: 0; z-index: 9999; 
    display: flex; justify-content: center; align-items: center; 
    background-color: #ffffff; overflow: hidden; 
    height: 100dvh; width: 100vw;
}

.app-canvas { 
    display: flex; flex-direction: column; position: relative; overflow: hidden; 
    transition: all 0.4s; width: 100vw; height: 100dvh; 
}

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); border: 8px solid white; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-bottom: 1px solid rgba(226, 232, 240, 0.6); }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 14px; border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.loot-item { display: flex; align-items: center; gap: 4px; padding: 0 8px; font-weight: 900; color: #1e293b; }
.loot-item img { width: 1.1rem; height: 1.1rem; object-fit: contain; }
.btn-close-circle { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid #fca5a5; }

/* --- ⚖️ BALANZA 3D CSS EN PORTADA --- */
.scale-3d-wrap {
    position: relative;
    width: 140px;
    height: 120px;
    margin-bottom: 10px;
}

.scale-base {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 15px;
    background: linear-gradient(180deg, #94a3b8, #475569);
    border-radius: 10px 10px 4px 4px;
    border-bottom: 4px solid #1e293b;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 1;
}

.scale-pillar {
    position: absolute;
    bottom: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 80px;
    background: linear-gradient(90deg, #64748b, #cbd5e1, #475569);
    border-radius: 2px;
    z-index: 2;
}

.scale-pin {
    position: absolute;
    top: 25px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 16px;
    background: radial-gradient(circle, #fde047, #b45309);
    border-radius: 50%;
    z-index: 5;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.scale-arm-group {
    position: absolute;
    top: 30px;
    width: 100%;
    height: 90px;
    transform-origin: top center;
    z-index: 3;
}

.animate-scale-balance {
    animation: scale-swing 4s ease-in-out infinite alternate;
}

@keyframes scale-swing {
    0% { transform: rotate(-8deg); }
    100% { transform: rotate(8deg); }
}

.scale-arm {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(180deg, #94a3b8, #334155);
    border-radius: 3px;
    box-shadow: 0 3px 5px rgba(0,0,0,0.2);
}

.plate-group {
    position: absolute;
    top: 3px;
    width: 40px;
    height: 70px;
}
.plate-group.left { left: 5px; }
.plate-group.right { right: 5px; }

/* El contra-giro anula la rotación del brazo para mantener el platillo horizontal */
.plate-group.left { animation: counter-swing 4s ease-in-out infinite alternate; transform-origin: top center; }
.plate-group.right { animation: counter-swing 4s ease-in-out infinite alternate; transform-origin: top center; }

@keyframes counter-swing {
    0% { transform: rotate(8deg); }
    100% { transform: rotate(-8deg); }
}

.string {
    position: absolute;
    top: 0;
    width: 2px;
    height: 60px;
    background: #cbd5e1;
}
.string.left { left: 5px; transform: rotate(-15deg); transform-origin: top; }
.string.right { right: 5px; transform: rotate(15deg); transform-origin: top; }

.plate {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 12px;
    background: radial-gradient(ellipse at top, #f8fafc, #94a3b8);
    border-radius: 50% 50% 10px 10px;
    border-bottom: 2px solid #475569;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

/* ------------------------------------- */

.rules-panel-large { width: 95%; padding: 2.2rem 1.5rem; border-radius: 2.5rem; border: 2px solid rgba(226, 232, 240, 0.8); position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }
.rule-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.4rem; text-align: left; }

.bubble-glow { filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.6)); }
.filter-red img { filter: brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(15) !important; transform: scale(1.1); }
.weight-on-plate { transform-origin: center; }
.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>