<script setup>
import { ref, computed, watch } from 'vue';
import { X as CloseIcon, Trophy, Star, Coins } from 'lucide-vue-next';
import { gsap } from 'gsap'; 

const emit = defineEmits(['close']);

// --- ESTADO ---
const currentLevel = ref(1);
const totalLevels = 10;
const isVictoryLevel = ref(false); 
const showFinalCelebration = ref(false); 
const targetNumerator = ref(1);
const targetDenominator = ref(2);
const selectedSlices = ref(0); 

const plateColors = [
  '#e2e8f0', '#fef3c7', '#dcfce7', '#fee2e2', '#e0e7ff', 
  '#fae8ff', '#f1f5f9', '#ffedd5', '#ecfdf5', '#fff1f2'
];

const triggerHaptic = (ms = 50) => {
  if (window.navigator?.vibrate) window.navigator.vibrate(ms); //
};

const playSound = (name) => {
  const audio = new Audio(`/sounds/${name}.mp3`);
  audio.play().catch(() => {});
};

// --- MOTOR DE TRANSICIÓN AUTOMÁTICA ---
watch(selectedSlices, (newVal) => {
  if (newVal === targetNumerator.value && !isVictoryLevel.value) {
    isVictoryLevel.value = true;
    triggerHaptic(70);
    playSound('victory-short');

    setTimeout(() => {
      if (currentLevel.value < totalLevels) {
        autoNextLevel();
      } else {
        triggerFinalCelebration();
      }
    }, 1500); // Pausa para ver el resultado
  }
});

const autoNextLevel = () => {
  currentLevel.value++;
  const denoms = [2, 3, 4, 6, 8];
  targetDenominator.value = denoms[Math.floor(Math.random() * denoms.length)];
  targetNumerator.value = Math.floor(Math.random() * (targetDenominator.value - 1)) + 1;
  selectedSlices.value = 0;
  isVictoryLevel.value = false;
  playSound('whoosh-level');
};

const triggerFinalCelebration = () => {
  showFinalCelebration.value = true;
  playSound('fanfare-epic');
  triggerHaptic([100, 50, 100]);
  
  for (let i = 0; i < 50; i++) {
    const coin = document.createElement('div');
    coin.innerHTML = '🪙';
    coin.className = 'fixed text-3xl z-[1000] pointer-events-none';
    coin.style.left = Math.random() * 100 + 'vw';
    coin.style.top = '-50px';
    document.body.appendChild(coin);

    gsap.to(coin, {
      y: '110vh',
      x: (Math.random() - 0.5) * 400,
      rotation: Math.random() * 1000,
      duration: Math.random() * 2 + 1,
      ease: "power1.in",
      onComplete: () => document.body.removeChild(coin)
    });
  }
};

const addSlice = (event) => {
  if (isVictoryLevel.value || showFinalCelebration.value || selectedSlices.value >= targetDenominator.value) return;
  
  const rect = event.currentTarget.getBoundingClientRect();
  const flyer = document.createElement('div');
  flyer.className = "fixed w-10 h-10 bg-orange-500 rounded-tr-full z-[50] pointer-events-none border-2 border-orange-700";
  flyer.style.left = `${rect.left}px`;
  flyer.style.top = `${rect.top}px`;
  document.body.appendChild(flyer);

  const target = document.querySelector('.pizza-container').getBoundingClientRect();
  gsap.to(flyer, {
    x: target.left - rect.left + (target.width / 4),
    y: target.top - rect.top,
    rotation: 120, scale: 1.5, duration: 0.4, ease: "back.out(1.7)",
    onComplete: () => {
      document.body.removeChild(flyer);
      selectedSlices.value++;
      playSound('clink');
    }
  });
};
</script>

<template>
  <div class="fixed inset-0 h-[100dvh] w-full bg-[#FDF6E3] flex flex-col items-center overflow-hidden overscroll-none touch-none select-none z-[10]">
    
    <header class="w-full max-w-[480px] p-6 flex justify-between items-center z-[20]">
      <div class="bg-white/80 px-4 py-1.5 rounded-full border-2 border-orange-200 shadow-sm flex items-center gap-2">
        <Star class="text-orange-500 fill-orange-500" :size="16" />
        <span class="text-orange-900 font-black uppercase text-xs tracking-tighter">RETO {{ currentLevel }} / {{ totalLevels }}</span>
      </div>
      <button @click="emit('close')" class="bg-red-500 w-10 h-10 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg active:scale-75 transition-all">
        <CloseIcon :size="20" stroke-width="4" />
      </button>
    </header>

    <div class="relative w-full max-w-[480px] flex-1 flex flex-col items-center justify-center px-6 z-[10] -mt-12">
      
      <div :class="[isVictoryLevel ? 'border-green-400 bg-green-50' : 'border-orange-100 bg-white/95']"
           class="mb-4 p-4 rounded-[30px] shadow-lg border-4 text-center w-full max-w-[190px] transition-all duration-300 translate-y-2">
        <div v-if="isVictoryLevel" class="text-green-600 font-black text-[10px] mb-1 animate-pulse uppercase">¡LOGRADO!</div>
        <div v-else class="text-slate-400 font-black text-[9px] mb-1 uppercase tracking-widest">PEDIDO:</div>
        
        <div class="flex flex-col items-center">
          <span class="text-5xl font-black text-orange-600 leading-none">{{ targetNumerator }}</span>
          <div class="w-10 h-1.5 bg-slate-800 my-1 rounded-full"></div>
          <span class="text-5xl font-black text-slate-800 leading-none">{{ targetDenominator }}</span>
        </div>
      </div>

      <div class="relative pizza-container w-64 h-64 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full shadow-inner border-[10px] border-white/80 transition-colors duration-1000"
             :style="{ backgroundColor: plateColors[currentLevel - 1] }"></div>
        
        

        <svg viewBox="0 0 100 100" class="w-56 h-56 drop-shadow-2xl rotate-[-90deg] z-10">
          <circle cx="50" cy="50" r="45" fill="#f3e5ab" stroke="#d4a373" stroke-width="1.5" />
          <path v-for="n in selectedSlices" :key="n"
            :d="`M 50 50 L ${50 + 45 * Math.cos(2 * Math.PI * (n-1) / targetDenominator)} ${50 + 45 * Math.sin(2 * Math.PI * (n-1) / targetDenominator)} A 45 45 0 0 1 ${50 + 45 * Math.cos(2 * Math.PI * n / targetDenominator)} ${50 + 45 * Math.sin(2 * Math.PI * n / targetDenominator)} Z`"
            fill="#e63946" stroke="#b11a21" stroke-width="0.8"
          />
          <line v-for="n in targetDenominator" :key="'g'+n" x1="50" y1="50"
            :x2="50 + 45 * Math.cos(2 * Math.PI * n / targetDenominator)"
            :y2="50 + 45 * Math.sin(2 * Math.PI * n / targetDenominator)"
            stroke="#d4a373" stroke-width="0.5" stroke-dasharray="2"
          />
        </svg>
      </div>
    </div>

    <div class="w-full max-w-[480px] flex justify-center pb-6 px-6 z-[20]">
      <div class="w-full bg-white/90 backdrop-blur-xl p-6 rounded-[45px] border-2 border-white shadow-2xl flex flex-col items-center">
        <div class="flex items-center gap-10">
          <button @click="addSlice($event)" 
            class="w-20 h-20 bg-orange-500 rounded-tr-[80%] rounded-bl-3xl border-4 border-orange-700 shadow-[0_8px_0_rgb(154,52,18)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
            <span class="text-white font-black text-5xl select-none">+</span>
          </button>

          <button @click="selectedSlices = 0" 
                  class="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center shadow-md active:scale-75 transition-all border-2 border-slate-100">
             <Star class="text-slate-300" :size="24" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showFinalCelebration" class="fixed inset-0 z-[100] bg-indigo-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in">
      <div class="bg-white rounded-[60px] p-12 flex flex-col items-center shadow-2xl border-[10px] border-amber-400 text-center max-w-[340px]">
        <div class="bg-amber-100 p-6 rounded-full mb-6 ring-8 ring-amber-50">
            <Trophy class="text-amber-500" :size="80" />
        </div>
        <h2 class="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-4">¡MAESTRO PIZZERO!</h2>
        <p class="text-slate-500 font-bold mb-10 italic text-lg leading-tight px-4">Has completado los 10 pedidos a la perfección.</p>
        <button @click="emit('close')" class="bg-amber-500 text-white px-20 py-5 rounded-[30px] font-black text-2xl uppercase shadow-[0_10px_0_rgb(180,130,0)] active:translate-y-2 active:shadow-none transition-all">FINALIZAR</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
* { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
.animate-in { animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes scaleIn { from { opacity: 0; transform: translateY(50px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>