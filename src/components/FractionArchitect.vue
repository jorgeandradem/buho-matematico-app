<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { X as CloseIcon, Trophy, Star, Coins } from 'lucide-vue-next';
import { gsap } from 'gsap'; 
// CORRECCIÓN: Importación del Banco Central usando el alias y nombre exacto
import { useGamificationStore } from '@/stores/useGamificationStore';

const emit = defineEmits(['close']);
const gamificationStore = useGamificationStore(); // Instancia del store

// --- ESTADO ---
const currentLevel = ref(1);
const totalLevels = 10;
const isVictoryLevel = ref(false); 
const showFinalCelebration = ref(false); 
const targetNumerator = ref(1);
const targetDenominator = ref(2);
const selectedSlices = ref(0); 
const usedExercises = ref([]);

const reward = { amount: 10, name: 'COBRE', color: 'text-orange-800', icon: '🥉' };

// --- LÓGICA DE NOMBRES DE FRACCIONES ---
const fractionName = computed(() => {
  const numeradores = ["", "Un", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez", "Once", "Doce"];
  const denominadores = {
    2: "medio", 3: "tercio", 4: "cuarto", 5: "quinto", 
    6: "sexto", 8: "octavo", 10: "décimo", 12: "doceavo"
  };

  const num = numeradores[targetNumerator.value] || targetNumerator.value;
  let den = denominadores[targetDenominator.value];
  
  if (targetNumerator.value > 1) {
    den = den === "tercio" ? "tercios" : den + "s";
  }
  
  return `${num} ${den}`;
});

// --- VARIEDADES CON BASE DE MOZZARELLA ---
const pizzaStyles = [
  { name: 'Margarita', cheese: '#FFFAED', sauce: '#E63946' }, 
  { name: 'Albahaca', cheese: '#FFFDF0', sauce: '#2D6A4F' },  
  { name: 'Champiñón', cheese: '#F8F4E3', sauce: '#6D4C41' },  
  { name: 'Hawaiana', cheese: '#FFF9E6', sauce: '#FFB703' },  
  { name: 'Aceituna', cheese: '#FDFCF0', sauce: '#37474F' },  
  { name: 'Pepperoni', cheese: '#FFF8E1', sauce: '#B71C1C' }  
];

const currentPizzaStyle = computed(() => pizzaStyles[(currentLevel.value - 1) % 6]);

const playSound = (name) => {
  const audio = new Audio(`/audios/${name}.mp3`);
  audio.play().catch(() => {});
};

const generateNewOrder = () => {
  const denoms = [2, 3, 4, 5, 6, 8, 10, 12];
  let newNum, newDen;
  let isUnique = false;

  while (!isUnique) {
    newDen = denoms[Math.floor(Math.random() * denoms.length)];
    newNum = Math.floor(Math.random() * (newDen - 1)) + 1;
    const key = `${newNum}/${newDen}`;
    if (!usedExercises.value.includes(key)) {
      usedExercises.value.push(key);
      isUnique = true;
      targetNumerator.value = newNum;
      targetDenominator.value = newDen;
    }
    if (usedExercises.value.length > 20) usedExercises.value = [];
  }
};

const resetGame = () => {
  currentLevel.value = 1;
  usedExercises.value = [];
  generateNewOrder();
  selectedSlices.value = 0;
  isVictoryLevel.value = false;
  showFinalCelebration.value = false;
};

onMounted(() => generateNewOrder());

watch(selectedSlices, (newVal) => {
  if (newVal === targetNumerator.value && !isVictoryLevel.value) {
    isVictoryLevel.value = true;
    playSound('wrong1'); 
    setTimeout(() => {
      if (currentLevel.value < totalLevels) autoNextLevel();
      else triggerFinalCelebration();
    }, 1500); 
  }
});

const autoNextLevel = () => {
  currentLevel.value++;
  generateNewOrder();
  selectedSlices.value = 0;
  isVictoryLevel.value = false;
};

const triggerFinalCelebration = () => {
  showFinalCelebration.value = true;
  
  // --- INTEGRACIÓN CON BANCO CENTRAL ---
  gamificationStore.addCoins('copper', reward.amount); 
  gamificationStore.updateMissionProgress('complete_challenge', 1);
  gamificationStore.bubbleMessage = "¡Mmm, qué delicia! Tus monedas por las pizzas han sido depositadas. 🦉🍕";

  playSound('finish1'); 
  playSound('coins');   
  const container = document.querySelector('.game-viewport');
  if (!container) return;
  for (let i = 0; i < 50; i++) {
    const coin = document.createElement('div');
    coin.innerHTML = '🪙';
    coin.className = 'absolute text-3xl z-[2000] pointer-events-none drop-shadow-lg';
    coin.style.left = Math.random() * 90 + 5 + '%';
    coin.style.top = '-50px';
    container.appendChild(coin);
    gsap.to(coin, {
      y: container.offsetHeight + 100,
      x: (Math.random() - 0.5) * 300,
      rotation: Math.random() * 1080,
      duration: Math.random() * 2 + 1.5,
      ease: "power2.in",
      onComplete: () => coin.remove()
    });
  }
};

const addSlice = (event) => {
  if (isVictoryLevel.value || showFinalCelebration.value || selectedSlices.value >= targetDenominator.value) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const flyer = document.createElement('div');
  flyer.className = "fixed w-10 h-10 rounded-tr-full z-[1000] pointer-events-none border-2 shadow-sm";
  flyer.style.backgroundColor = currentPizzaStyle.value.sauce;
  flyer.style.borderColor = 'rgba(0,0,0,0.2)';
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
      playSound('correct1'); 
    }
  });
};
</script>

<template>
  <div class="fixed inset-0 h-[100dvh] w-full bg-[#FDF6E3] flex flex-col items-center overflow-hidden z-[10] game-viewport">
    
    <header class="w-full max-w-[480px] p-6 flex justify-between items-center z-[20]">
      <div class="bg-white/80 px-4 py-1.5 rounded-full border-2 border-orange-200 shadow-sm flex items-center gap-2">
        <Star class="text-orange-500 fill-orange-500" :size="16" />
        <span class="text-orange-900 font-black uppercase text-xs tracking-tighter">RETO {{ currentLevel }} / {{ totalLevels }}</span>
      </div>
      <button @click="emit('close')" class="bg-red-500 w-10 h-10 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg active:scale-75 transition-all">
        <CloseIcon :size="20" stroke-width="4" />
      </button>
    </header>

    <div class="relative w-full max-w-[480px] flex-1 flex flex-col items-center justify-center px-4 z-[10] -mt-12">
      
      <div class="flex items-center gap-3 mb-8 w-full justify-center">
        <div :class="[isVictoryLevel ? 'border-green-400 bg-green-50' : 'border-orange-100 bg-white/95']"
             class="p-4 rounded-[25px] shadow-lg border-4 text-center min-w-[110px] transition-all duration-300">
          <div class="flex flex-col items-center">
            <span class="text-4xl font-black text-orange-600 leading-none">{{ targetNumerator }}</span>
            <div class="w-8 h-1 bg-slate-800 my-1 rounded-full"></div>
            <span class="text-4xl font-black text-slate-800 leading-none">{{ targetDenominator }}</span>
          </div>
        </div>

        <div class="bg-white/95 border-4 border-orange-100 p-4 rounded-[25px] shadow-lg flex-1 max-w-[200px] min-h-[95px] flex items-center justify-center">
          <p class="text-orange-900 font-black text-xl leading-tight text-center uppercase italic">
            {{ fractionName }}
          </p>
        </div>
      </div>

      <div class="relative pizza-container w-72 h-72 flex items-center justify-center">
        <div class="absolute inset-0 rounded-full shadow-xl border-[12px] border-[#C08240] bg-[#F3E5AB]"></div>
        
        <svg viewBox="0 0 100 100" class="w-64 h-64 drop-shadow-lg rotate-[-90deg] z-10">
          <circle cx="50" cy="50" r="45" :fill="currentPizzaStyle.cheese" />
          
          <g v-for="n in selectedSlices" :key="n">
            <path 
              :d="`M 50 50 L ${50 + 45 * Math.cos(2 * Math.PI * (n-1) / targetDenominator)} ${50 + 45 * Math.sin(2 * Math.PI * (n-1) / targetDenominator)} A 45 45 0 0 1 ${50 + 45 * Math.cos(2 * Math.PI * n / targetDenominator)} ${50 + 45 * Math.sin(2 * Math.PI * n / targetDenominator)} Z`"
              :fill="currentPizzaStyle.sauce" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"
            />
            <circle :cx="50 + 25 * Math.cos(2 * Math.PI * (n-0.5) / targetDenominator)" :cy="50 + 25 * Math.sin(2 * Math.PI * (n-0.5) / targetDenominator)" r="2.5" :fill="currentPizzaStyle.cheese" opacity="0.8" />
            <circle :cx="50 + 35 * Math.cos(2 * Math.PI * (n-0.7) / targetDenominator)" :cy="50 + 35 * Math.sin(2 * Math.PI * (n-0.7) / targetDenominator)" r="1.5" :fill="currentPizzaStyle.cheese" opacity="0.6" />
            <circle :cx="50 + 15 * Math.cos(2 * Math.PI * (n-0.3) / targetDenominator)" :cy="50 + 15 * Math.sin(2 * Math.PI * (n-0.3) / targetDenominator)" r="2" :fill="currentPizzaStyle.cheese" opacity="0.7" />
          </g>

          <line v-for="n in targetDenominator" :key="'g'+n" x1="50" y1="50"
            :x2="50 + 45 * Math.cos(2 * Math.PI * n / targetDenominator)"
            :y2="50 + 45 * Math.sin(2 * Math.PI * n / targetDenominator)"
            stroke="rgba(192, 130, 64, 0.4)" stroke-width="0.6" stroke-dasharray="1.5"
          />
        </svg>
      </div>
    </div>

    <div class="w-full max-w-[480px] flex justify-center pb-8 px-6 z-[20]">
      <div class="w-full bg-white/90 backdrop-blur-xl p-6 rounded-[45px] border-2 border-white shadow-2xl flex flex-col items-center">
        <div class="flex items-center gap-12">
          <button @click="addSlice($event)" 
            class="w-20 h-20 bg-orange-500 rounded-tr-[80%] rounded-bl-3xl border-4 border-orange-700 shadow-[0_8px_0_rgb(154,52,18)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
            <span class="text-white font-black text-5xl">+</span>
          </button>
          <button @click="selectedSlices = 0" 
                  class="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center shadow-md active:scale-75 transition-all border-2 border-slate-100">
             <Star class="text-slate-300" :size="24" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showFinalCelebration" class="fixed inset-0 z-[1100] bg-indigo-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in">
      <button @click="resetGame" class="absolute top-8 right-8 bg-red-500 w-12 h-12 rounded-full flex items-center justify-center text-white border-4 border-white z-[1200] shadow-xl transition-all active:scale-90">
        <CloseIcon :size="28" stroke-width="4" />
      </button>

      <div class="bg-white rounded-[60px] p-10 flex flex-col items-center shadow-2xl border-[10px] border-amber-400 text-center max-w-[360px] relative">
        <div class="bg-amber-100 p-6 rounded-full mb-4 ring-8 ring-amber-50">
            <Trophy class="text-amber-500" :size="70" />
        </div>
        <h2 class="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">¡MAESTRO PIZZERO!</h2>
        <div class="bg-slate-50 rounded-3xl p-4 mb-6 w-full border-2 border-slate-100 text-center">
          <p class="text-slate-500 font-bold text-sm uppercase tracking-widest mb-1">Recompensa Ganada</p>
          <div class="text-5xl font-black text-indigo-600 mb-2">{{ reward.amount }} Monedas</div>
          <div class="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-white shadow-sm border border-slate-100">
            <span class="text-2xl">{{ reward.icon }}</span>
            <span :class="reward.color" class="font-black text-lg">CALIDAD: {{ reward.name }}</span>
          </div>
        </div>
        <button @click="emit('close')" class="bg-amber-500 text-white px-16 py-4 rounded-[30px] font-black text-xl uppercase shadow-[0_8px_0_rgb(180,130,0)] active:translate-y-2 active:shadow-none transition-all">FINALIZAR</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
* { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
.animate-in { animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes scaleIn { from { opacity: 0; transform: translateY(50px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>