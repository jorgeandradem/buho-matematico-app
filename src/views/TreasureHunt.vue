<template>
  <div :class="`fixed inset-0 w-full h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b ${currentLevelData.sky} transition-all duration-1000 overscroll-none touch-none`" >
    
    <div :class="`absolute bottom-0 w-full h-[72%] bg-gradient-to-b ${currentLevelData.sea} opacity-95 transition-all duration-1000`" ></div>
    <div :class="`absolute bottom-0 w-full h-1/5 ${currentLevelData.sand} rounded-t-[120px] shadow-2xl transition-all duration-1000`" ></div>

    <div class="absolute top-4 left-4 z-50 animate-slide-down">
      <div class="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex gap-4 shadow-xl scale-90 sm:scale-100">
        <div class="flex items-center gap-1"><span>🟡</span> <b class="text-white text-xs sm:text-sm">{{ store.gold }}</b></div>
        <div class="flex items-center gap-1"><span>⚪</span> <b class="text-white text-xs sm:text-sm">{{ store.silver }}</b></div>
        <div class="flex items-center gap-1"><span>🟤</span> <b class="text-white text-xs sm:text-sm">{{ store.copper }}</b></div>
      </div>
    </div>

    <div class="absolute top-4 right-4 z-50">
      <button @click="emit('close')" class="bg-black/30 p-2 rounded-full text-white active:scale-90 shadow-md backdrop-blur-sm border border-white/10">
        <X :size="24" />
      </button>
    </div>

    <div class="relative z-10 flex flex-col h-full max-w-[480px] w-full p-4 items-center justify-between py-16 mx-auto">
      
      <div class="text-center w-full">
        <h2 class="text-2xl font-black text-white drop-shadow-md uppercase italic inline-block">
          <span class="bg-black/30 px-8 py-2 rounded-full border border-white/10 backdrop-blur-sm">
              Misión {{ store.pirateLevel }}
          </span>
        </h2>
      </div>

      <div 
        :class="[
          'relative flex flex-col items-center transition-all duration-[2500ms] ease-in-out transform',
          isNavigating ? 'translate-x-[600px] opacity-0 rotate-3' : 'translate-x-0'
        ]"
      >
        <div v-if="!isNavigating" class="absolute -top-6 left-1/2 -translate-x-1 flex flex-col items-center">
          <div class="smoke-particle animate-smoke-1"></div>
          <div class="smoke-particle animate-smoke-2"></div>
        </div>

        <div class="text-[120px] drop-shadow-2xl animate-boat-float relative z-20 leading-none">🚢</div>
        
        <div class="absolute -bottom-4 w-40 h-8 flex justify-around items-end opacity-80 z-10">
          <div class="water-splash animate-splash-1"></div>
          <div class="wave-particle animate-wave-1"></div>
          <div class="wave-particle animate-wave-2"></div>
          <div class="water-splash animate-splash-2"></div>
        </div>
      </div>

      <div v-if="showIslandBanner" class="absolute top-1/3 z-50 animate-island-pop">
        <div class="bg-yellow-400 text-indigo-900 px-8 py-3 rounded-2xl font-black text-2xl shadow-2xl border-4 border-white rotate-[-4deg] uppercase">
          ¡Isla Saqueada!
        </div>
      </div>

      <div class="flex flex-row items-center justify-center gap-8 w-full mb-8">
        <div class="w-20 h-20 bg-black rounded-full border-4 border-white shadow-xl flex items-center justify-center text-4xl animate-float">
          🦉
        </div>
        
        <div :class="['treasure-chest-btn relative', isChestOpen ? 'is-open' : 'animate-chest-attention']">
          <div class="chest-top"></div>
          <div class="chest-body">
            <div v-if="!isChestOpen" class="chest-lock"><div class="keyhole"></div></div>
            <div v-else class="absolute inset-0 bg-yellow-400 blur-md opacity-60 animate-pulse"></div>
          </div>
        </div>
      </div>

      <MathLockModal 
        :missionId="store.pirateLevel" 
        @success="handleSuccess"
      />
    </div>

    <div class="absolute bottom-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <CoinRain v-if="showReward" :type="rewardData.type" :count="rewardData.amount" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { pirateLevels } from '../data/pirateLevels';
import { X } from 'lucide-vue-next';
import MathLockModal from '../components/MathLockModal.vue';
import CoinRain from '../components/CoinRain.vue';
import { playCoinSound } from '../utils/sound';

const emit = defineEmits(['close']);
const store = useGamificationStore();

const isChestOpen = ref(false);
const isNavigating = ref(false);
const showReward = ref(false);
const showIslandBanner = ref(false);
const rewardData = ref({ type: 'copper', amount: 0 });

const currentLevelData = computed(() => {
  return pirateLevels.find(l => l.id === store.pirateLevel) || pirateLevels[0];
});

// Bloqueo preventivo de scroll al montar
onMounted(() => {
  document.body.style.overflow = 'hidden';
});

const handleSuccess = async (data) => {
  rewardData.value = data;
  isChestOpen.value = true;
  showReward.value = true;
  showIslandBanner.value = true;
  playCoinSound();

  // TRIPLE EVENTO DE ÉXITO (v2.8.6)
  if (window.navigator.vibrate) window.navigator.vibrate(50);

  setTimeout(async () => {
    isNavigating.value = true;
    store.completePirateMission(store.pirateLevel, data.type, data.amount);
    
    await nextTick();

    setTimeout(() => {
      isChestOpen.value = false;
      showReward.value = false;
      showIslandBanner.value = false;
      isNavigating.value = false;
    }, 2500);
  }, 1500);
};
</script>

<style scoped>
/* 💨 HUMO MEJORADO */
.smoke-particle { @apply absolute w-5 h-5 bg-white/40 rounded-full blur-sm; }
.animate-smoke-1 { animation: smoke 2.5s infinite; }
.animate-smoke-2 { animation: smoke 2.5s infinite 1.2s; }
@keyframes smoke {
  0% { transform: translateY(0) scale(0.4); opacity: 0; }
  30% { opacity: 0.7; }
  100% { transform: translateY(-50px) scale(2.5); opacity: 0; }
}

/* 🌊 OLEAJE */
.wave-particle { @apply w-10 h-2 bg-white/60 rounded-full blur-[1px]; }
.water-splash { @apply w-4 h-4 bg-white/40 rounded-full blur-md absolute; }
.animate-splash-1 { animation: splash 1.2s infinite; left: 10%; }
.animate-splash-2 { animation: splash 1.2s infinite 0.6s; right: 10%; }
.animate-wave-1 { animation: wave 1.8s infinite ease-in-out; }
.animate-wave-2 { animation: wave 1.8s infinite ease-in-out 0.9s; }

@keyframes splash {
  0%, 100% { transform: scale(1) translateY(0); opacity: 0.5; }
  50% { transform: scale(1.8) translateY(-5px); opacity: 0.2; }
}

@keyframes wave {
  0%, 100% { transform: translateX(-10px) scaleX(1); opacity: 0.4; }
  50% { transform: translateX(10px) scaleX(1.3); opacity: 0.8; }
}

/* 🚢 BARCO */
.animate-boat-float { animation: boat-float 3.5s ease-in-out infinite; }
@keyframes boat-float {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}

/* 📦 COFRE */
.treasure-chest-btn { @apply w-28 h-20 flex flex-col items-center justify-end z-20; perspective: 1000px; }
.chest-top { @apply w-24 h-8 bg-amber-900 rounded-t-full border-x-4 border-t-4 border-orange-950 relative shadow-inner z-10 transition-transform duration-700 origin-bottom; }
.is-open .chest-top { transform: rotateX(-110deg) translateY(-5px); }
.chest-body { @apply w-28 h-12 bg-amber-800 rounded-b-lg border-4 border-orange-950 relative shadow-2xl flex justify-center overflow-hidden; }
.chest-lock { @apply absolute -top-3 w-8 h-10 bg-yellow-500 border-2 border-yellow-700 rounded-md shadow-md flex items-center justify-center z-30; }
.keyhole { @apply w-1.5 h-3 bg-black rounded-full relative; }

.animate-island-pop { animation: island-pop 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes island-pop {
  from { transform: scale(0) rotate(-20deg); opacity: 0; }
  to { transform: scale(1) rotate(-4deg); opacity: 1; }
}

.animate-chest-attention { animation: chest-attention 4s ease-in-out infinite; }
@keyframes chest-attention { 0%, 85%, 100% { transform: scale(1) rotate(0deg); } 90% { transform: scale(1.1) rotate(3deg); } 92% { transform: scale(1.1) rotate(-3deg); } }
.animate-float { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.animate-slide-down { animation: slideDown 0.5s ease-out; }
@keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

* { -webkit-tap-highlight-color: transparent; }
</style>