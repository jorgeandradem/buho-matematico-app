<script setup>
import { ref, computed, watch } from 'vue';
import { X as CloseIcon, Trophy, Coins, Star } from 'lucide-vue-next';
import { gsap } from 'gsap'; 

const emit = defineEmits(['close']);

// --- ESTADO ---
const currentLevel = ref(1);
const totalLevels = 10;
const isVictory = ref(false); // Feedback visual rápido
const showFinalCelebration = ref(false); 
const targetWeight = ref(12); 
const rightWeights = ref([]); 
const inventory = ref([2, 3, 5, 10]); 

const playSound = (name) => {
  const audio = new Audio(`/sounds/${name}.mp3`);
  audio.play().catch(() => {});
};

// --- MOTOR DE CÁLCULO ---
const totalRight = computed(() => {
  return rightWeights.value
    .filter(w => !w.isRemoving)
    .reduce((a, b) => a + b.value, 0);
});

const scaleRotation = computed(() => {
  const diff = totalRight.value - targetWeight.value;
  return Math.max(Math.min(diff * 2.5, 18), -18);
});

// --- VALIDACIÓN Y SALTO AUTOMÁTICO ---
watch(totalRight, (newTotal) => {
  if (newTotal === targetWeight.value && !isVictory.value && newTotal > 0) {
    isVictory.value = true; // Activa mensaje rápido "¡LOGRADO!"
    playSound('victory');

    setTimeout(() => {
      if (currentLevel.value >= totalLevels) {
        showFinalCelebration.value = true;
        triggerCoinRain();
        playSound('epic-victory');
      } else {
        autoNextLevel();
      }
    }, 1200); // 1.2 segundos de gloria antes del siguiente reto
  }
});

const autoNextLevel = () => {
  currentLevel.value++;
  targetWeight.value = Math.floor(Math.random() * 20) + 5;
  rightWeights.value = [];
  isVictory.value = false;
};

// --- LLUVIA DE MONEDAS FINAL ---
const triggerCoinRain = () => {
  for (let i = 0; i < 40; i++) {
    const coin = document.createElement('div');
    coin.innerHTML = '🪙';
    coin.className = 'fixed text-3xl z-[600] pointer-events-none';
    coin.style.left = Math.random() * 100 + 'vw';
    coin.style.top = '-50px';
    document.body.appendChild(coin);

    gsap.to(coin, {
      y: '110vh',
      x: (Math.random() - 0.5) * 300,
      rotation: Math.random() * 720,
      duration: Math.random() * 2 + 1.5,
      ease: "power1.in",
      onComplete: () => document.body.removeChild(coin)
    });
  }
};

const addWeight = (val, event) => {
  if (isVictory.value || showFinalCelebration.value || rightWeights.value.length >= 8) return;
  playSound('whoosh');
  const rect = event.currentTarget.getBoundingClientRect();
  const flyer = event.currentTarget.cloneNode(true);
  Object.assign(flyer.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, zIndex: '5000', pointerEvents: 'none' });
  document.body.appendChild(flyer);
  const target = document.querySelector('.plate-target-area').getBoundingClientRect();
  gsap.to(flyer, {
    x: target.left - rect.left + (target.width / 4),
    y: target.top - rect.top,
    scale: 0.7, duration: 0.5, ease: "power2.out",
    onComplete: () => {
      document.body.removeChild(flyer);
      rightWeights.value.push({ id: Math.random().toString(36).substr(2, 9), value: val, isRemoving: false });
      playSound('clink');
    }
  });
};

const triggerRemove = (id, event) => {
  if (isVictory.value || showFinalCelebration.value) return;
  const weightObj = rightWeights.value.find(w => w.id === id);
  if (!weightObj || weightObj.isRemoving) return;
  weightObj.isRemoving = true; 
  playSound('whoosh');
  gsap.to(event.currentTarget, {
    y: 1000, opacity: 0, scale: 0, duration: 0.25, ease: "power4.in",
    onComplete: () => { rightWeights.value = rightWeights.value.filter(w => w.id !== id); }
  });
};
</script>

<template>
  <div class="fixed inset-0 bg-[#FDF6E3] flex flex-col items-center overflow-hidden z-[200]">
    
    <header class="w-full p-6 flex justify-between items-center z-[210]">
      <div class="bg-amber-100 px-6 py-2 rounded-full border-2 border-amber-300 shadow-md">
        <span class="text-amber-900 font-black text-lg uppercase italic">RETO {{ currentLevel }} / {{ totalLevels }}</span>
      </div>
      <button @click="emit('close')" class="bg-red-500 w-14 h-14 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl">
        <CloseIcon :size="32" stroke-width="3" />
      </button>
    </header>

    <div class="relative w-full flex-1 flex flex-col items-center justify-center -mt-10 px-4">
      <img src="@/assets/scale-master/scale-base.png" class="absolute w-[380px] bottom-32 z-10 pointer-events-none" />
      <div class="relative w-full max-w-2xl transition-transform duration-700 ease-out flex justify-between items-end pointer-events-none"
           :style="{ transform: `rotate(${scaleRotation}deg)` }">
        
        <div class="relative w-48 flex flex-col items-center">
          <div class="relative z-30 -mb-4">
            <img :src="currentLevel > 5 ? '/src/assets/scale-master/weight-gold.png' : '/src/assets/scale-master/weight-iron.png'" class="w-24 drop-shadow-md" />
            <span class="absolute inset-0 flex items-center justify-center font-black text-3xl text-slate-900 drop-shadow-[0_2px_2px_rgba(255,255,255,0.9)]">{{ targetWeight }}</span>
          </div>
          <img src="@/assets/scale-master/scale-plate.png" class="w-full z-10" />
        </div>

        <div class="relative w-48 flex flex-col items-center plate-target-area">
          <div class="absolute bottom-10 w-full flex flex-wrap-reverse justify-center gap-2 p-2 z-30 pointer-events-auto">
             <button v-for="w in rightWeights" :key="w.id" @click.stop="triggerRemove(w.id, $event)"
                     :class="{ 'filter-red': w.isRemoving }" class="relative hover:scale-110 active:scale-90 transition-all cursor-pointer">
                <img src="@/assets/scale-master/weight-iron.png" class="w-14 drop-shadow-sm" />
                <span class="absolute inset-0 flex items-center justify-center font-black text-slate-900 text-xs">{{ w.value }}</span>
             </button>
          </div>
          <img src="@/assets/scale-master/scale-plate.png" class="w-full z-10" />
        </div>
      </div>
    </div>

    <div class="w-full max-w-lg bg-white/60 backdrop-blur-xl p-10 rounded-t-[50px] border-t-4 border-white shadow-2xl z-[220]">
      <div class="flex justify-around items-center">
        <button v-for="w in inventory" :key="w" @click="addWeight(w, $event)" class="relative active:scale-50 transition-all">
          <img src="@/assets/scale-master/weight-iron.png" class="w-20 drop-shadow-xl" />
          <span class="absolute inset-0 flex items-center justify-center font-black text-slate-800 text-2xl">{{ w }}</span>
        </button>
      </div>
    </div>

    <div v-if="isVictory && !showFinalCelebration" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none">
       <div class="bg-green-500 text-white px-10 py-4 rounded-3xl font-black text-4xl shadow-2xl animate-bounce-in uppercase italic">
          ¡EQUILIBRADO!
       </div>
    </div>

    <div v-if="showFinalCelebration" class="absolute inset-0 z-[700] bg-indigo-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in">
      <div class="bg-white rounded-[60px] p-16 flex flex-col items-center shadow-2xl border-8 border-amber-400 text-center">
        <div class="bg-amber-100 p-8 rounded-full mb-8 shadow-inner"><Coins class="text-amber-600" :size="100" /></div>
        <h2 class="text-5xl font-black text-slate-800 mb-4 uppercase leading-none">¡MAESTRO DE LA BALANZA!</h2>
        <p class="text-slate-500 font-bold mb-12 text-xl italic px-4">Has completado los 10 desafíos con éxito.</p>
        <button @click="emit('close')" class="bg-amber-500 text-white px-20 py-6 rounded-full font-black text-2xl uppercase shadow-[0_10px_0_rgb(180,130,0)] active:translate-y-2 active:shadow-none transition-all">FINALIZAR</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.filter-red { filter: brightness(0.4) sepia(1) hue-rotate(-50deg) saturate(10); pointer-events: none; }
.plate-target-area { min-height: 180px; }
.animate-bounce-in { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes bounceIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1.1); } }
.animate-in { animation: fadeIn 0.5s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>