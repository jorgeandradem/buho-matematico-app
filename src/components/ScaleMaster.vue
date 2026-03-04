<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { X as CloseIcon, Coins, Star } from 'lucide-vue-next';
import { gsap } from 'gsap'; 
import { useGamificationStore } from '@/stores/useGamificationStore'; 

const emit = defineEmits(['close']);
const gamificationStore = useGamificationStore();

// --- ESTADO ---
const currentLevel = ref(1);
const totalLevels = 10;
const isVictory = ref(false); 
const showFinalCelebration = ref(false); 
const targetWeight = ref(0); 
const rightWeights = ref([]); 

// 🚀 MÉTODO PARA CARGAR IMÁGENES COMPATIBLE CON VERCEL
const getAssetUrl = (name) => {
  return new URL(`../assets/scale-master/${name}`, import.meta.url).href;
};

const inventory = computed(() => {
  return currentLevel.value < 5 ? [2, 3, 5, 10] : [2, 3, 10, 20, 25];
});

const playSound = (name) => {
  const audio = new Audio(`/audios/${name}.mp3`);
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

const currentRotation = ref(0);

watch(totalRight, (newTotal) => {
  const diff = newTotal - targetWeight.value;
  const targetRot = Math.max(Math.min(diff * 2.5, 18), -18);
  gsap.to(currentRotation, {
    value: targetRot,
    duration: 0.8,
    ease: "back.out(1.7)", 
    onUpdate: () => currentRotation.value = currentRotation.value
  });
});

const isGoldMode = computed(() => currentLevel.value >= 7);

// 🚀 RUTAS CORREGIDAS PARA PRODUCCIÓN
const weightImage = computed(() => 
  isGoldMode.value 
    ? getAssetUrl('weight-gold.png') 
    : getAssetUrl('weight-iron.png')
);

const resetGame = () => {
  currentLevel.value = 1;
  targetWeight.value = generateRandomWeight();
  rightWeights.value = [];
  isVictory.value = false;
  showFinalCelebration.value = false;
};

watch(totalRight, (newTotal) => {
  if (newTotal === targetWeight.value && !isVictory.value && newTotal > 0) {
    isVictory.value = true; 
    if (currentLevel.value < totalLevels) playSound('correct1');

    setTimeout(() => {
      if (currentLevel.value >= totalLevels) {
        showFinalCelebration.value = true;
        gamificationStore.addCoins('copper', 10); 
        gamificationStore.updateMissionProgress('complete_challenge', 1); 
        gamificationStore.bubbleMessage = "¡Excelente equilibrio! He guardado tus monedas en la bóveda. 🦉💰";
        triggerCoinRain();
        playSound('finish1'); 
        playSound('coins');   
      } else {
        autoNextLevel();
      }
    }, 1200); 
  }
});

const autoNextLevel = () => {
  currentLevel.value++;
  targetWeight.value = generateRandomWeight();
  rightWeights.value = [];
  isVictory.value = false;
};

const triggerCoinRain = () => {
  const container = document.querySelector('.game-viewport');
  if (!container) return;
  for (let i = 0; i < 50; i++) {
    const coin = document.createElement('div');
    coin.innerHTML = '🪙';
    coin.className = 'absolute text-4xl z-[999] pointer-events-none drop-shadow-2xl';
    coin.style.left = Math.random() * 90 + 5 + '%';
    coin.style.top = '-60px';
    container.appendChild(coin);
    gsap.to(coin, {
      y: container.offsetHeight + 100,
      x: (Math.random() - 0.5) * 200,
      rotation: Math.random() * 1080,
      duration: Math.random() * 2.5 + 1.5,
      ease: "power1.in",
      onComplete: () => coin.remove()
    });
  }
};

const addWeight = (val, event) => {
  if (isVictory.value || showFinalCelebration.value || rightWeights.value.length >= 15) return;
  playSound('whoosh');
  const rect = event.currentTarget.getBoundingClientRect();
  const flyer = event.currentTarget.cloneNode(true);
  Object.assign(flyer.style, { 
    position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, 
    width: `${rect.width}px`, zIndex: '5000', pointerEvents: 'none' 
  });
  document.body.appendChild(flyer);
  const targetArea = document.querySelector('.plate-target-area').getBoundingClientRect();
  gsap.to(flyer, {
    x: targetArea.left - rect.left + (targetArea.width / 4),
    y: targetArea.top - rect.top,
    scale: 0.7, duration: 0.5, ease: "power2.out",
    onComplete: () => {
      document.body.removeChild(flyer);
      rightWeights.value.push({ 
        id: Math.random().toString(36).substr(2, 9), 
        value: val, isRemoving: false 
      });
      playSound('correct1');
    }
  });
};

const triggerRemove = (id, event) => {
  if (isVictory.value || showFinalCelebration.value) return;
  const weightObj = rightWeights.value.find(w => w.id === id);
  if (!weightObj || weightObj.isRemoving) return;
  weightObj.isRemoving = true; 
  playSound('wrong1');
  gsap.to(event.currentTarget, {
    y: 1000, opacity: 0, scale: 0, duration: 0.25, ease: "power4.in",
    onComplete: () => { 
      rightWeights.value = rightWeights.value.filter(w => w.id !== id); 
    }
  });
};
</script>

<template>
  <div class="fixed inset-0 bg-[#FDF6E3] flex flex-col items-center overflow-hidden z-[200] game-viewport">
    <header class="w-full p-6 flex justify-between items-center z-[210]">
      <div class="bg-amber-100 px-6 py-2 rounded-full border-2 border-amber-300 shadow-md">
        <Star class="text-orange-500 fill-orange-500 mr-2 inline" :size="20" />
        <span class="text-amber-900 font-black text-lg uppercase italic">RETO {{ currentLevel }} / {{ totalLevels }}</span>
      </div>
      <button @click="emit('close')" class="bg-red-500 w-14 h-14 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl hover:scale-110 active:scale-90 transition-all">
        <CloseIcon :size="32" stroke-width="3" />
      </button>
    </header>

    <div class="relative w-full flex-1 flex flex-col items-center justify-center -mt-10 px-4">
      <img :src="getAssetUrl('scale-base.png')" class="absolute w-[380px] bottom-32 z-10 pointer-events-none" />
      
      <div class="relative w-full max-w-2xl flex justify-between items-end pointer-events-none transition-transform duration-100"
           :style="{ transform: `rotate(${currentRotation}deg)` }">
        
        <div class="relative w-48 flex flex-col items-center origin-top" :style="{ transform: `rotate(${-currentRotation}deg)` }">
          <div class="relative z-30 -mb-4 flex items-center justify-center">
            <img :src="weightImage" class="w-24 drop-shadow-md" />
            <div v-if="!isGoldMode" class="absolute w-12 h-12 bg-white rounded-full border-2 border-slate-300 shadow-inner"></div>
            <span class="absolute inset-0 flex items-center justify-center font-black text-3xl text-slate-900 z-40">
              {{ targetWeight }}
            </span>
          </div>
          <img :src="getAssetUrl('scale-plate.png')" class="w-full z-10" />
        </div>

        <div class="relative w-48 flex flex-col items-center origin-top plate-target-area" :style="{ transform: `rotate(${-currentRotation}deg)` }">
          <div class="absolute bottom-10 w-full flex flex-wrap-reverse justify-center gap-2 p-2 z-30 pointer-events-auto">
             <button v-for="w in rightWeights" :key="w.id" @click.stop="triggerRemove(w.id, $event)"
                     :class="{ 'filter-red': w.isRemoving }" class="relative hover:scale-110 active:scale-90 transition-all cursor-pointer flex items-center justify-center">
                <img :src="weightImage" class="w-14 drop-shadow-sm" />
                <div v-if="!isGoldMode" class="absolute w-7 h-7 bg-white rounded-full border border-slate-200"></div>
                <span class="absolute inset-0 flex items-center justify-center font-black text-slate-900 text-[10px] z-40">{{ w.value }}</span>
             </button>
          </div>
          <img :src="getAssetUrl('scale-plate.png')" class="w-full z-10" />
        </div>
      </div>
    </div>

    <div class="w-full max-w-lg bg-white/60 backdrop-blur-xl p-10 rounded-t-[50px] border-t-4 border-white shadow-2xl z-[220]">
      <div class="flex justify-around items-center">
        <button v-for="w in inventory" :key="w" @click="addWeight(w, $event)" class="relative active:scale-50 transition-all flex items-center justify-center hover:scale-110">
          <img :src="weightImage" class="w-16 drop-shadow-xl" />
          <div v-if="!isGoldMode" class="absolute w-9 h-9 bg-white rounded-full border border-slate-200"></div>
          <span class="absolute inset-0 flex items-center justify-center font-black text-slate-800 text-xl z-40">{{ w }}</span>
        </button>
      </div>
    </div>

    <div v-if="isVictory && !showFinalCelebration" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none">
        <div class="bg-green-500 text-white px-10 py-4 rounded-3xl font-black text-4xl shadow-2xl animate-bounce-in uppercase italic">¡LOGRADO!</div>
    </div>

    <div v-if="showFinalCelebration" class="absolute inset-0 z-[700] bg-indigo-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in">
      <button @click="resetGame" class="absolute top-8 right-8 bg-white/20 hover:bg-white/40 w-12 h-12 rounded-full flex items-center justify-center text-white border-2 border-white/50 z-[710] transition-all">
        <CloseIcon :size="28" stroke-width="3" />
      </button>
      <div class="bg-white rounded-[60px] p-16 flex flex-col items-center shadow-2xl border-8 border-amber-400 text-center relative">
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
.origin-top { transition: transform 0.1s linear; }
</style>