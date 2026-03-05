<template>
  <div class="fixed inset-0 h-[100dvh] w-full bg-[#FDF6E3] flex flex-col items-center overflow-hidden z-[10] game-viewport">
    
    <header class="w-full max-w-[480px] p-4 pb-2 flex justify-between items-center z-[20]">
      
      <div class="bg-white/80 px-3 py-1.5 rounded-full border-2 border-orange-200 shadow-sm flex items-center gap-1 shrink-0">
        <Star class="text-orange-500 fill-orange-500" :size="14" />
        <span class="text-orange-900 font-black uppercase text-xs tracking-tighter">{{ currentLevel }}/{{ totalLevels }}</span>
      </div>

      <div class="flex items-center gap-3 bg-white/90 px-4 py-1.5 rounded-full shadow-sm border border-slate-200">
        <div class="flex items-center gap-1">
          <img src="/images/coin-gold.png" alt="oro" class="w-4 h-4 object-contain" />
          <span class="font-black text-slate-800 text-xs">{{ goldSession }}</span>
        </div>
        <div class="flex items-center gap-1">
          <img src="/images/coin-silver.png" alt="plata" class="w-4 h-4 object-contain" />
          <span class="font-black text-slate-800 text-xs">{{ silverSession }}</span>
        </div>
        <div class="flex items-center gap-1">
          <img src="/images/coin-copper.png" alt="cobre" class="w-4 h-4 object-contain" />
          <span class="font-black text-slate-800 text-xs">{{ bronzeSession }}</span>
        </div>
      </div>

      <button @click.prevent.stop="emit('close')" class="bg-red-500 w-10 h-10 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg active:scale-75 transition-all shrink-0">
        <CloseIcon :size="20" stroke-width="4" />
      </button>
    </header>

    <div class="w-full flex justify-center z-[20] relative mb-2">
      <div class="px-5 py-1.5 rounded-full text-sm font-semibold shadow-sm border border-white/60 tracking-wide" :class="levelBadgeColor">
        {{ levelTitle }}
      </div>
    </div>

    <div class="relative w-full max-w-[480px] flex-1 flex flex-col items-center justify-center px-4 z-[10] gap-4 pb-2">
      
      <div class="flex flex-col items-center gap-3 w-full justify-center">
        
        <Transition name="fade-bounce">
          <div v-if="gamePhase > 1" class="flex items-center gap-3 bg-indigo-50 border-2 border-indigo-200 px-4 py-2 rounded-2xl shadow-sm max-w-[90%]">
            <span class="text-3xl drop-shadow-md">🦉</span>
            <p class="text-indigo-800 font-semibold text-xs leading-tight">
              <span class="font-black block text-[10px] text-indigo-500 uppercase tracking-wider mb-0.5">Prof. Búho:</span>
              {{ instructionText }}
            </p>
          </div>
        </Transition>

        <div class="flex items-center gap-3 w-full justify-center">
          <div :class="[isVictoryLevel ? 'border-green-400 bg-green-50' : 'border-orange-100 bg-white/95']"
               class="p-3 rounded-[25px] shadow-lg border-4 text-center min-w-[100px] transition-all duration-300">
            <div class="flex flex-col items-center">
              <span class="text-4xl font-black text-orange-600 leading-none">{{ targetNumerator }}</span>
              <div class="w-8 h-1 bg-slate-800 my-1 rounded-full"></div>
              <span class="text-4xl font-black text-slate-800 leading-none">{{ targetDenominator }}</span>
            </div>
          </div>

          <div class="bg-white/95 border-4 border-orange-100 p-3 rounded-[25px] shadow-lg flex-1 max-w-[200px] min-h-[90px] flex items-center justify-center">
            <p class="text-orange-900 font-black text-lg leading-tight text-center uppercase italic">
              {{ fractionName }}
            </p>
          </div>
        </div>
      </div>

      <div :class="[gamePhase > 1 ? 'w-56 h-56' : 'w-72 h-72']" class="relative pizza-container flex items-center justify-center transition-all duration-500">
        <div class="absolute inset-0 rounded-full shadow-xl border-[10px] border-[#C08240] bg-[#F3E5AB] transition-all duration-500"></div>
        
        <svg viewBox="0 0 100 100" :class="[gamePhase > 1 ? 'w-48 h-48' : 'w-64 h-64']" class="drop-shadow-lg rotate-[-90deg] z-10 transition-all duration-500">
          <circle cx="50" cy="50" r="45" :fill="currentPizzaStyle.cheese" />
          
          <g v-for="n in selectedSlices" :key="n">
            <path 
              :d="`M 50 50 L ${50 + 45 * Math.cos(2 * Math.PI * (n-1) / activeCuts)} ${50 + 45 * Math.sin(2 * Math.PI * (n-1) / activeCuts)} A 45 45 0 0 1 ${50 + 45 * Math.cos(2 * Math.PI * n / activeCuts)} ${50 + 45 * Math.sin(2 * Math.PI * n / activeCuts)} Z`"
              :fill="currentPizzaStyle.sauce" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"
            />
            <circle :cx="50 + 25 * Math.cos(2 * Math.PI * (n-0.5) / activeCuts)" :cy="50 + 25 * Math.sin(2 * Math.PI * (n-0.5) / activeCuts)" r="2.5" :fill="currentPizzaStyle.cheese" opacity="0.8" />
            <circle :cx="50 + 35 * Math.cos(2 * Math.PI * (n-0.7) / activeCuts)" :cy="50 + 35 * Math.sin(2 * Math.PI * (n-0.7) / activeCuts)" r="1.5" :fill="currentPizzaStyle.cheese" opacity="0.6" />
            <circle :cx="50 + 15 * Math.cos(2 * Math.PI * (n-0.3) / activeCuts)" :cy="50 + 15 * Math.sin(2 * Math.PI * (n-0.3) / activeCuts)" r="2" :fill="currentPizzaStyle.cheese" opacity="0.7" />
          </g>

          <line v-for="n in activeCuts" :key="'g'+n" x1="50" y1="50"
            :x2="50 + 45 * Math.cos(2 * Math.PI * n / activeCuts)"
            :y2="50 + 45 * Math.sin(2 * Math.PI * n / activeCuts)"
            stroke="rgba(192, 130, 64, 0.4)" stroke-width="0.6" stroke-dasharray="1.5"
          />
        </svg>
      </div>
    </div>

    <div class="w-full max-w-[480px] flex justify-center pb-6 px-6 z-[20]">
      <div class="w-full bg-white/90 backdrop-blur-xl p-4 rounded-[35px] border-2 border-white shadow-2xl flex flex-col items-center">
        <div class="flex items-center gap-8">
          
          <button @click="removeSlice" 
                  class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shadow-md active:scale-75 transition-all border-2 border-red-200 disabled:opacity-50"
                  :disabled="selectedSlices === 0 || isVictoryLevel">
             <span class="text-red-500 font-black text-3xl leading-none pb-1">-</span>
          </button>

          <button @click="addSlice($event)" 
            class="w-16 h-16 bg-orange-500 rounded-tr-[80%] rounded-bl-3xl border-4 border-orange-700 shadow-[0_6px_0_rgb(154,52,18)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
            <span class="text-white font-black text-4xl leading-none pb-1">+</span>
          </button>

          <button @click="selectedSlices = 0" 
                  class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center shadow-md active:scale-75 transition-all border-2 border-slate-100">
             <Star class="text-slate-300" :size="20" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showFinalCelebration" class="fixed inset-0 z-[1100] bg-[#1e293b] flex flex-col items-center justify-center p-6 animate-in">
      
      <div class="w-full max-w-[480px] flex flex-col items-center text-center">
        
        <Trophy class="text-amber-400 mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" :size="110" stroke-width="1.5" />
        
        <h1 class="text-4xl font-black text-white mb-2 uppercase tracking-tight">¡MISIÓN CUMPLIDA!</h1>
        <p class="text-slate-300 font-bold mb-10 text-lg">Premios obtenidos en esta racha:</p>
        
        <div class="flex justify-center gap-8 mb-12 bg-slate-800/80 p-6 rounded-3xl w-full border border-slate-700 shadow-inner">
          <div class="flex flex-col items-center gap-3">
            <img src="/images/coin-gold.png" class="w-14 h-14 drop-shadow-md" />
            <span class="text-3xl font-black text-white">{{ goldSession }}</span>
          </div>
          <div class="flex flex-col items-center gap-3">
            <img src="/images/coin-silver.png" class="w-14 h-14 drop-shadow-md" />
            <span class="text-3xl font-black text-white">{{ silverSession }}</span>
          </div>
          <div class="flex flex-col items-center gap-3">
            <img src="/images/coin-copper.png" class="w-14 h-14 drop-shadow-md" />
            <span class="text-3xl font-black text-white">{{ bronzeSession }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-4 w-full px-4">
          <button @click.prevent.stop="resetGame" 
                  class="w-full bg-amber-500 text-slate-900 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(180,130,0)] active:translate-y-1 active:shadow-none transition-all uppercase">
            Volver a Jugar
          </button>
          
          <button @click.prevent.stop="emit('close')" 
                  class="w-full bg-slate-700 text-white py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(51,65,85)] active:translate-y-1 active:shadow-none transition-all uppercase border border-slate-600">
            Portal de Desafíos
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { X as CloseIcon, Trophy, Star } from 'lucide-vue-next';
import { gsap } from 'gsap'; 
import { useGamificationStore } from '@/stores/useGamificationStore';

const emit = defineEmits(['close']);
const gamificationStore = useGamificationStore(); 

// --- ESTADO Y FASES ---
const currentLevel = ref(1);
const totalLevels = 10;
const isVictoryLevel = ref(false); 
const showFinalCelebration = ref(false); 

// MONEDAS DE SESIÓN
const goldSession = ref(0);
const silverSession = ref(0);
const bronzeSession = ref(0);

// Fase 1: Básica (Retos 1-4)
// Fase 2: Equivalencias (Retos 5-7)
// Fase 3: Sumas básicas encubiertas (Retos 8-10)
const gamePhase = computed(() => {
  if (currentLevel.value <= 4) return 1;
  if (currentLevel.value <= 7) return 2;
  return 3;
});

// HUD Lógica
const levelTitle = computed(() => {
  if (gamePhase.value === 1) return 'NIVEL 1: APRENDIZ';
  if (gamePhase.value === 2) return 'NIVEL 2: CHEF (Equivalencias)';
  return 'NIVEL 3: MAESTRO (Sumas)';
});

const levelBadgeColor = computed(() => {
  if (gamePhase.value === 1) return 'text-orange-700 bg-orange-100';
  if (gamePhase.value === 2) return 'text-blue-700 bg-blue-100';
  return 'text-purple-700 bg-purple-100';
});

// Pedido
const targetNumerator = ref(1);
const targetDenominator = ref(2);
const activeCuts = ref(2); 
const requiredSlicesToWin = ref(1); 

const selectedSlices = ref(0); 
const usedExercises = ref([]);

// Recompensas dinámicas según fase
const finalRewardAmount = computed(() => {
  return 10 * gamePhase.value; 
});
const rewardTypeDisplay = computed(() => {
  if (gamePhase.value === 1) return 'COBRE';
  if (gamePhase.value === 2) return 'PLATA';
  return 'ORO';
});
const reward = computed(() => {
  if (gamePhase.value === 1) return { color: 'text-orange-800', icon: '🥉', type: 'copper' };
  if (gamePhase.value === 2) return { color: 'text-slate-600', icon: '🥈', type: 'silver' };
  return { color: 'text-yellow-600', icon: '🥇', type: 'gold' };
});

// PROFESOR BÚHO - SOLUCIÓN EXPLÍCITA
const instructionText = computed(() => {
  if (gamePhase.value === 2) {
    return `¡Equivalencias! Para formar ${targetNumerator.value}/${targetDenominator.value} en esta pizza cortada en ${activeCuts.value}, la solución exacta es colocar ${requiredSlicesToWin.value} porciones.`;
  }
  if (gamePhase.value === 3) {
    return `¡Suma de fracciones! El resultado total equivale a ${requiredSlicesToWin.value}/${activeCuts.value}. Por lo tanto, la solución exacta es colocar ${requiredSlicesToWin.value} porciones.`;
  }
  return '';
});

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
  
  if (gamePhase.value === 3) {
      if (targetNumerator.value === 1 && targetDenominator.value === 2) return "1/4 + 1/4";
      if (targetNumerator.value === 3 && targetDenominator.value === 4) return "1/2 + 1/4";
      if (targetNumerator.value === 1 && targetDenominator.value === 1) return "1/2 + 1/2";
      if (targetNumerator.value === 3 && targetDenominator.value === 8) return "1/4 + 1/8";
      if (targetNumerator.value === 5 && targetDenominator.value === 8) return "1/2 + 1/8";
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

// --- MOTOR DE GENERACIÓN POR FASES (CON PREVENCIÓN DE BUCLES INFINITOS) ---
const generateNewOrder = () => {
  let isUnique = false;

  while (!isUnique) {
    if (gamePhase.value === 1) {
      const denoms = [2, 3, 4, 5, 6, 8];
      targetDenominator.value = denoms[Math.floor(Math.random() * denoms.length)];
      targetNumerator.value = Math.floor(Math.random() * (targetDenominator.value - 1)) + 1;
      activeCuts.value = targetDenominator.value;
      requiredSlicesToWin.value = targetNumerator.value;

    } else if (gamePhase.value === 2) {
      const equivalents = [
        { num: 1, den: 2, cuts: 4, req: 2 },
        { num: 1, den: 2, cuts: 6, req: 3 },
        { num: 1, den: 2, cuts: 8, req: 4 },
        { num: 1, den: 3, cuts: 6, req: 2 },
        { num: 2, den: 3, cuts: 6, req: 4 },
        { num: 1, den: 4, cuts: 8, req: 2 },
        { num: 3, den: 4, cuts: 8, req: 6 }
      ];
      const eq = equivalents[Math.floor(Math.random() * equivalents.length)];
      targetNumerator.value = eq.num;
      targetDenominator.value = eq.den;
      activeCuts.value = eq.cuts;
      requiredSlicesToWin.value = eq.req;

    } else {
      const sums = [
        { num: 1, den: 2, cuts: 8, req: 4 }, 
        { num: 3, den: 4, cuts: 8, req: 6 }, 
        { num: 1, den: 1, cuts: 8, req: 8 },
        { num: 3, den: 8, cuts: 8, req: 3 }, 
        { num: 5, den: 8, cuts: 8, req: 5 }  
      ];
      const sum = sums[Math.floor(Math.random() * sums.length)];
      targetNumerator.value = sum.num;
      targetDenominator.value = sum.den;
      activeCuts.value = sum.cuts;
      requiredSlicesToWin.value = sum.req;
    }

    // CIRUGÍA: Añadido el gamePhase a la llave para que el nivel 2 y 3 no compartan historial
    // Esto evita el Bucle Infinito (Freeze de Pantalla).
    const key = `F${gamePhase.value}-${targetNumerator.value}/${targetDenominator.value}-${activeCuts.value}`;
    
    if (!usedExercises.value.includes(key)) {
      usedExercises.value.push(key);
      isUnique = true;
    }
    
    if (usedExercises.value.length > 15) usedExercises.value = [];
  }
};

onMounted(() => generateNewOrder());

// LÓGICA DE ACIERTO Y RECOMPENSAS
watch(selectedSlices, (newVal) => {
  if (newVal === requiredSlicesToWin.value && !isVictoryLevel.value) {
    isVictoryLevel.value = true;
    playSound('correct1'); 

    if (gamePhase.value === 1) {
      bronzeSession.value += 5; 
    } else if (gamePhase.value === 2) {
      silverSession.value += 1; 
    } else if (gamePhase.value === 3) {
      goldSession.value += 1;   
    }

    setTimeout(() => {
      if (currentLevel.value < totalLevels) autoNextLevel();
      else triggerFinalCelebration();
    }, 1200); 
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
  
  gamificationStore.addMultipleCoins({
    copper: bronzeSession.value,
    silver: silverSession.value,
    gold: goldSession.value
  });
  
  gamificationStore.updateMissionProgress('complete_challenge', 1);
  gamificationStore.bubbleMessage = `¡Excelente trabajo de Chef! Tus recompensas están en la bóveda. 🦉🍕`;

  playSound('finish1'); 
  playSound('coins');   
  
  const container = document.querySelector('.game-viewport');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const coin = document.createElement('div');
    const iconType = Math.random() > 0.6 ? '🥇' : (Math.random() > 0.3 ? '🥈' : '🥉');
    coin.innerHTML = iconType;
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
  if (isVictoryLevel.value || showFinalCelebration.value || selectedSlices.value >= activeCuts.value) return;
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
      playSound('pop'); 
    }
  });
};

const removeSlice = () => {
  if (selectedSlices.value > 0 && !isVictoryLevel.value) {
    selectedSlices.value--;
    playSound('pop'); 
  }
};

const resetGame = () => {
  currentLevel.value = 1;
  goldSession.value = 0;
  silverSession.value = 0;
  bronzeSession.value = 0;
  usedExercises.value = [];
  generateNewOrder();
  selectedSlices.value = 0;
  isVictoryLevel.value = false;
  showFinalCelebration.value = false;
};
</script>

<style scoped>
* { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
.animate-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.fade-bounce-enter-active {
  animation: fadeBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-bounce-leave-active {
  transition: opacity 0.3s ease;
}
.fade-bounce-enter-from, .fade-bounce-leave-to {
  opacity: 0;
}
@keyframes fadeBounce {
  0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
</style>