<template>
  <div class="w-full max-w-[360px] mx-auto mt-auto pb-40 animate-slide-up">
    <div class="bg-white/95 backdrop-blur-xl rounded-[40px] overflow-hidden shadow-2xl border-t-8 border-yellow-400 p-4">
      
      <div class="flex flex-col gap-3">
        <div :class="['w-full py-4 px-10 rounded-[28px] border-[4px] flex items-center justify-center transition-all duration-300 relative overflow-hidden', feedbackClass]">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-energy"></div>
          
          <div class="flex items-center gap-3 relative z-10">
             <span class="text-2xl animate-pulse">{{ currentRewardIcon }}</span>
             <div :key="currentChallenge.text" class="text-4xl font-black text-indigo-700 animate-slot drop-shadow-sm italic tracking-tighter">
               {{ currentChallenge.text }}
             </div>
          </div>
        </div>

        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">¡Encuentra la combinación!</p>

        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="opt in options" :key="opt"
            @click.stop.prevent="handleCheck(opt)"
            :disabled="isLocked"
            :class="[
              'h-14 rounded-2xl text-2xl font-black transition-all border-b-4 active:border-b-0 active:translate-y-1 flex items-center justify-center',
              (opt === currentChallenge.value && showCorrect) ? 'bg-emerald-500 border-emerald-800 text-white' :
              (selected === opt && !isCorrect) ? 'bg-rose-500 border-rose-800 text-white animate-shake' :
              'bg-slate-100 border-slate-300 text-slate-800'
            ]"
          >
            {{ opt }}
          </button>
        </div>

        <button @click="emit('close')" class="text-slate-400 text-[9px] font-bold uppercase mt-1 hover:text-rose-500 transition-colors">
          Abandonar Reto
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue';

const props = defineProps({ missionId: Number });
const emit = defineEmits(['close', 'success']);

const currentChallenge = ref({ text: '', value: 0 });
const options = ref([]);
const selected = ref(null);
const isCorrect = ref(null);
const isLocked = ref(false);
const showCorrect = ref(false);
const lastRewardType = ref('normal'); // Para el icono dinámico

const feedbackClass = computed(() => {
  if (isCorrect.value === true) return 'bg-emerald-100 border-emerald-500';
  if (isCorrect.value === false) return 'bg-rose-100 border-rose-500';
  return 'bg-yellow-100 border-yellow-400';
});

const currentRewardIcon = computed(() => {
  if (isCorrect.value !== true) return '🎰';
  if (lastRewardType.value === 'gold') return '🟡';
  if (lastRewardType.value === 'silver') return '⚪';
  return '🟤';
});

const generateChallenge = async () => {
  selected.value = null;
  isCorrect.value = null;
  showCorrect.value = false;
  isLocked.value = false;
  lastRewardType.value = 'normal';

  await nextTick();

  const types = ['+', '-', 'x', '/'];
  const type = types[Math.floor(Math.random() * types.length)];
  let a, b, text, result;

  if (type === '+') { 
    a = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * 10) + 1; 
    text = `${a}+${b}`; result = a + b; 
  } else if (type === '-') { 
    a = Math.floor(Math.random() * 10) + 10; b = Math.floor(Math.random() * 9) + 1; 
    text = `${a}-${b}`; result = a - b; 
  } else if (type === 'x') { 
    a = Math.floor(Math.random() * 9) + 1; b = Math.floor(Math.random() * 5) + 1; 
    text = `${a}x${b}`; result = a * b; 
  } else { 
    const divB = Math.floor(Math.random() * 8) + 2; result = Math.floor(Math.random() * 9) + 1; 
    const divA = divB * result; text = `${divA}/${divB}`; 
  }

  currentChallenge.value = { text, value: result };
  const opts = [result];
  while (opts.length < 3) {
    const d = result + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    if (!opts.includes(d) && d >= 0) opts.push(d);
  }
  options.value = opts.sort(() => Math.random() - 0.5);
};

const handleCheck = (val) => {
  if (isLocked.value) return; 
  selected.value = val;
  isLocked.value = true; 
  showCorrect.value = true; 
  
  if (val === currentChallenge.value.value) {
    isCorrect.value = true;

    // --- LA BOVEDA - LÓGICA DE RECOMPENSAS ALEATORIAS SEGÚN OPERACIÓN ---
    let rewardType = 'copper';
    let rewardAmount = 0;

    if (currentChallenge.value.text.includes('+')) {
      rewardType = 'copper';
      rewardAmount = Math.floor(Math.random() * 11) + 10; // 10-20
    } else if (currentChallenge.value.text.includes('-')) {
      rewardType = 'silver';
      rewardAmount = Math.floor(Math.random() * 5) + 4;   // 4-8
    } else {
      rewardType = 'gold';
      rewardAmount = Math.floor(Math.random() * 3) + 1;   // 1-3
    }

    lastRewardType.value = rewardType;

    setTimeout(() => { 
      emit('success', { type: rewardType, amount: rewardAmount }); 
    }, 600);

  } else {
    isCorrect.value = false;
    setTimeout(() => { generateChallenge(); }, 1500);
  }
};

watch(() => props.missionId, async () => {
  await generateChallenge();
});

onMounted(generateChallenge);
</script>

<style scoped>
.animate-slot { animation: slot 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
@keyframes slot {
  0% { transform: translateY(-30px); opacity: 0; filter: blur(8px); }
  60% { transform: translateY(10px); filter: blur(2px); }
  100% { transform: translateY(0); opacity: 1; filter: blur(0); }
}
.animate-energy { animation: energy 2s linear infinite; }
@keyframes energy { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
.animate-shake { animation: shake 0.4s ease-in-out; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
.animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>