<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ArrowLeft, Zap, Heart, Trophy, Cloud } from 'lucide-vue-next';
import SimpleConfetti from './SimpleConfetti.vue';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import * as SoundUtils from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- PALETA DE 10 COLORES ASOCIATIVOS ---
const colorPalette = [
    '#3b82f6', // Azul
    '#22c55e', // Verde
    '#eab308', // Amarillo
    '#ef4444', // Rojo
    '#a855f7', // Lila
    '#ec4899', // Rosa
    '#f97316', // Naranja
    '#06b6d4', // Cian
    '#8b5cf6', // Violeta
    '#10b981'  // Esmeralda
];

// --- MOTOR DE JUEGO ---
const isPlaying = ref(false);
const gameFinished = ref(false);
const score = ref(0);
const lives = ref(3);
const owlY = ref(50); 
const velocity = ref(0);
const gravity = 0.18; 
const lift = -5.2; 

const currentOperation = ref({ text: '', res: 0 });
const portals = ref([]); 
const resolvedOps = ref(new Set()); 
const showCoinRain = ref(false);
let lastOpId = 0;
let gameLoopId = null;

const safePlay = (soundFunc) => {
    if (SoundUtils[soundFunc]) SoundUtils[soundFunc]();
};

const generateOperation = (startX = 135) => {
    lastOpId++;
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    let res = op === '+' ? a + b : (op === '-' ? (a + 10) - b : a * b);
    
    currentOperation.value = { text: `${op === '-' ? a + 10 : a} ${op} ${b}`, res: res };

    const wrongRes = res + (Math.random() > 0.5 ? 2 : -2);
    const firstIsCorrect = Math.random() > 0.5;
    const y1 = Math.random() > 0.5 ? 35 : 65;
    const y2 = y1 === 35 ? 65 : 35;

    const rachaColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    portals.value.push({
        opId: lastOpId, x: startX, val: firstIsCorrect ? res : (wrongRes === res ? res + 1 : wrongRes),
        y: y1, isCorrect: firstIsCorrect, passed: false, state: 'normal', color: rachaColor
    });

    portals.value.push({
        opId: lastOpId, x: startX + 75,
        val: !firstIsCorrect ? res : (wrongRes === res ? res + 1 : wrongRes),
        y: y2, isCorrect: !firstIsCorrect, passed: false, state: 'normal', color: rachaColor
    });
};

const jump = () => { if (isPlaying.value) velocity.value = lift; };

const gameLoop = () => {
    if (!isPlaying.value) return;

    velocity.value += gravity;
    owlY.value += velocity.value;

    if (owlY.value > 88) { owlY.value = 88; velocity.value = 0; }
    if (owlY.value < 12) { owlY.value = 12; velocity.value = 0; }

    if (portals.value.length === 0 || portals.value[portals.value.length - 1].x < 60) {
        generateOperation();
    }

    portals.value.forEach(p => {
        p.x -= 0.35; 

        if (!p.passed && p.state === 'normal' && !resolvedOps.value.has(p.opId) && p.x < 25 && p.x > 8) {
            const dx = 15 - p.x;
            const dy = owlY.value - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 12) {
                resolvedOps.value.add(p.opId); 

                portals.value.forEach(sibling => {
                    if (sibling.opId === p.opId && sibling !== p) sibling.state = 'disabled';
                });

                if (p.isCorrect) {
                    p.state = 'exploding'; 
                    score.value++;
                    safePlay('playCoinSound');
                    setTimeout(() => { p.passed = true; if (score.value >= 10) triggerWin(); }, 650);
                } else {
                    p.state = 'shattered'; 
                    lives.value--;
                    safePlay('playErrorSound');
                    setTimeout(() => { p.passed = true; if (lives.value <= 0) initGame(); }, 850);
                }
            }
        }
    });

    if (portals.value[0]?.x < -40) portals.value.shift();
    gameLoopId = requestAnimationFrame(gameLoop);
};

const initGame = () => {
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    isPlaying.value = true;
    gameFinished.value = false;
    score.value = 0;
    lives.value = 3;
    owlY.value = 50;
    velocity.value = 0;
    portals.value = [];
    resolvedOps.value.clear();
    generateOperation(120);
    gameLoop();
};

const triggerWin = async () => {
    isPlaying.value = false;
    gameFinished.value = true;
    showCoinRain.value = true;
    safePlay('playOwlHoot');
    await store.addCoins('gold', 10);
    emit('win', { type: 'gold', count: 10 });
};

onMounted(() => initGame());
onUnmounted(() => { if (gameLoopId) cancelAnimationFrame(gameLoopId); });
</script>

<template>
  <div class="fixed inset-0 z-[200] bg-white flex justify-center items-center overflow-hidden select-none normal-case font-sans" @touchstart="jump" @mousedown="jump">
    
    <div class="w-full max-w-xl h-full flex flex-col items-center relative overflow-hidden shadow-2xl border-x border-slate-100">
        
        <CoinRain v-if="showCoinRain" type="gold" :count="50" class="z-[400]" />

        <div class="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-blue-200">
            
            <div class="absolute -bottom-[40%] -right-[50%] w-[180%] h-[180%] rounded-full border-[60px] border-transparent transform -rotate-12 opacity-90 mix-blend-overlay"
                 style="background: radial-gradient(circle at center, transparent 60%, #8b5cf6 62%, #3b82f6 65%, #22c55e 68%, #eab308 71%, #f97316 74%, #ef4444 77%);">
            </div>

            <div class="absolute top-16 left-[5%] animate-cloud-slow opacity-95"><Cloud class="text-white fill-current drop-shadow-lg" size="72" /></div>
            <div class="absolute top-36 right-[10%] animate-cloud-fast opacity-90"><Cloud class="text-white fill-current drop-shadow-md" size="56" /></div>
            <div class="absolute top-24 left-[60%] animate-cloud-slow delay-700 opacity-90"><Cloud class="text-white fill-current drop-shadow-lg" size="64" /></div>

            <div class="absolute -bottom-[15%] w-[140%] -left-[20%] h-[45%] bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-[100%] shadow-2xl"></div>
            
            <div class="absolute bottom-[28%] w-full flex justify-around px-6 z-0">
                <span class="text-5xl animate-bounce drop-shadow-md">🌻</span>
                <span class="text-4xl animate-bounce delay-100 drop-shadow-md">🌸</span>
                <span class="text-6xl animate-bounce drop-shadow-xl">🌻</span>
                <span class="text-4xl animate-bounce delay-200 drop-shadow-md">🌼</span>
                <span class="text-5xl animate-bounce delay-75 drop-shadow-md">🌻</span>
            </div>
        </div>

        <div class="w-full flex justify-between items-center p-6 z-50 absolute top-0 uppercase">
          <button @click="$emit('close')" class="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-lg border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all font-black text-xs">
              <ArrowLeft size="18" />
              REGRESAR
          </button>
          
          <div class="flex gap-4">
              <div class="bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 flex items-center gap-2 shadow-lg">
                <Heart size="18" class="text-red-500 fill-current animate-pulse" />
                <span class="text-white font-black text-xl">{{ lives }}</span>
              </div>
              <div class="bg-amber-500 px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 border-2 border-amber-300">
                <Trophy size="18" class="text-amber-900" />
                <span class="text-amber-900 font-black text-xl">{{ score }}/10</span>
              </div>
          </div>
        </div>

        <div class="absolute top-28 left-1/2 -translate-x-1/2 z-50 w-full text-center px-6 uppercase">
            <div class="bg-indigo-900/70 backdrop-blur-md border-2 border-indigo-300/50 py-3 px-10 rounded-[2.5rem] shadow-2xl inline-block min-w-[240px]">
                <p class="text-indigo-200 text-[10px] font-bold tracking-widest mb-1">Calcula:</p>
                <h3 class="text-white text-5xl font-black italic tracking-tighter drop-shadow-lg">{{ currentOperation.text }}</h3>
            </div>
        </div>

        <div class="flex-1 w-full relative z-10">
            <div class="absolute left-[15%] transition-transform duration-75 z-40" 
                 :style="{ top: owlY + '%', transform: `rotate(${velocity * 4}deg)` }">
                <div class="text-7xl drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]">🦉</div>
            </div>

            <div v-for="(p, i) in portals" :key="i" 
                 class="absolute w-28 h-28 flex items-center justify-center transition-opacity duration-300 z-30"
                 :style="{ left: p.x + '%', top: (p.y - 5) + '%', opacity: p.passed ? '0' : '1' }">
                
                <div :class="[
                    'w-full h-full rounded-full border-[6px] flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-300',
                    p.state === 'exploding' ? 'animate-bubble-pop border-white bg-white/70' : '',
                    p.state === 'shattered' ? 'animate-shatter bg-red-600 border-red-900 shadow-[0_0_50px_#ff0000]' : '',
                    p.state === 'disabled' ? 'border-slate-400/40 bg-slate-500/10 grayscale opacity-40 scale-90' : ''
                ]"
                :style="p.state === 'normal' ? { borderColor: p.color, backgroundColor: `${p.color}44`, boxShadow: `0 0 25px ${p.color}66` } : {}">
                    <span class="text-white text-5xl font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{{ p.val }}</span>
                </div>
            </div>
        </div>

        <div class="w-full bg-white p-6 rounded-t-[3rem] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-50 flex items-center justify-center gap-3">
            <Zap size="20" class="text-amber-500 fill-current" />
            <p class="text-slate-600 text-sm font-medium italic">¡Mismo color = Misma racha!</p>
        </div>

        <Transition name="pop">
          <div v-if="gameFinished" class="absolute inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in uppercase">
            <SimpleConfetti />
            <Trophy class="w-24 h-24 text-amber-500 mb-6 drop-shadow-2xl" />
            <h2 class="text-3xl font-black text-indigo-900 mb-8 leading-tight italic">¡Vuelo Legendario!</h2>
            <div class="bg-amber-50 border-4 border-amber-100 rounded-[3rem] p-10 mb-8 shadow-inner w-full max-w-[280px]">
               <div class="flex items-center justify-center gap-4">
                  <img src="/images/coin-gold.png" class="w-14 h-14" />
                  <span class="text-6xl font-black text-amber-600 italic">+10</span>
               </div>
            </div>
            <button @click="initGame" class="w-full max-w-[260px] bg-amber-500 text-white font-black py-5 rounded-[2rem] shadow-lg mb-4 text-sm tracking-widest uppercase">OTRA CARRERA</button>
            <button @click="$emit('close')" class="text-slate-400 font-black text-[10px] tracking-widest py-2">VOLVER AL INICIO</button>
          </div>
        </Transition>
    </div>
  </div>
</template>

<style scoped>
.animate-cloud-slow { animation: floating 8s infinite ease-in-out alternate; }
.animate-cloud-fast { animation: floating 5s infinite ease-in-out alternate-reverse; }
@keyframes floating {
    from { transform: translateX(-20px); }
    to { transform: translateX(20px); }
}
.animate-bubble-pop { animation: bubblePop 0.65s ease-out forwards; }
@keyframes bubblePop {
    0% { transform: scale(1); opacity: 1; filter: blur(0px); }
    100% { transform: scale(3); opacity: 0; filter: blur(15px); }
}
.animate-shatter { animation: violentShake 0.85s linear forwards; }
@keyframes violentShake {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
    10%, 30%, 50%, 70%, 90% { transform: translate(-10px, 6px); background-color: #ff0000; }
    20%, 40%, 60%, 80% { transform: translate(10px, -6px); }
    95% { transform: scale(0.4); opacity: 0; }
}
.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>