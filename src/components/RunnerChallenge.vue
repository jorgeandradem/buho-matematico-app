<script setup>
/** * ARCHIVO: RunnerChallenge.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.2 + BOTÓN 3D AZUL + ICONO QUIRÚRGICO
 * LOGICA: Runner Matemático (Física de Gravedad) + Navegación Blindada
 */
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { X as CloseIcon, Zap, Heart, Trophy, Cloud, AlertCircle, MousePointer2, PlayCircle, ChevronRight } from 'lucide-vue-next';
import SimpleConfetti from './SimpleConfetti.vue';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import * as SoundUtils from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- 1. ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const QUESTIONS_COUNT = 10;
const colorPalette = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#f97316', '#06b6d4', '#8b5cf6', '#10b981'];

const score = ref(0);
const lives = ref(3);
const totalErrors = ref(0); 
const owlY = ref(50); 
const velocity = ref(0);
const gravity = 0.18; 
const lift = -5.2; 

// --- SISTEMA DE RECOMPENSAS EN TIEMPO REAL ---
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

const currentOperation = ref({ text: '', res: 0, opType: '', color: '#4f46e5' });
const portals = ref([]); 
const resolvedOps = ref(new Set()); 
const showCoinRain = ref(false);
let lastOpId = 0;
let gameLoopId = null;
const isAudioUnlocked = ref(false);

const safePlay = (soundFunc) => {
    if (SoundUtils[soundFunc]) SoundUtils[soundFunc]();
};

const speakLoud = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0;
    utterance.rate = 1.2;
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
};

const unlockAudio = () => {
    if (isAudioUnlocked.value) return;
    speakLoud(""); 
    isAudioUnlocked.value = true;
};

// --- 2. LÓGICA DE NAVEGACIÓN QUIRÚRGICA ---
const startGame = () => {
    gameState.value = 'playing';
    initGame();
};

const closeRunner = () => {
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    if (gameState.value === 'rules') {
        emit('close');
    } else {
        gameState.value = 'rules';
    }
};

// --- 3. MOTOR DE FÍSICA Y JUEGO ---
const generateOperation = (startX = 135) => {
    lastOpId++;
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    let res = op === '+' ? a + b : (op === '-' ? (a + 10) - b : a * b);
    const activeColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    currentOperation.value = { 
        text: `${op === '-' ? a + 10 : a} ${op} ${b}`, 
        res: res, opType: op, color: activeColor 
    };

    const wrongRes = res + (Math.random() > 0.5 ? 2 : -2);
    const firstIsCorrect = Math.random() > 0.5;
    const y1 = Math.random() > 0.5 ? 35 : 65;
    const y2 = y1 === 35 ? 65 : 35;

    portals.value.push({
        opId: lastOpId, x: startX, val: firstIsCorrect ? res : (wrongRes === res ? res + 1 : wrongRes),
        y: y1, isCorrect: firstIsCorrect, passed: false, state: 'normal', color: activeColor, opType: op
    });

    portals.value.push({
        opId: lastOpId, x: startX + 75,
        val: !firstIsCorrect ? res : (wrongRes === res ? res + 1 : wrongRes),
        y: y2, isCorrect: !firstIsCorrect, passed: false, state: 'normal', color: activeColor, opType: op
    });
};

const jump = () => { 
    unlockAudio();
    if (gameState.value === 'playing') velocity.value = lift; 
};

const gameLoop = () => {
    if (gameState.value !== 'playing') return;

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
            const distance = Math.sqrt(Math.pow(15 - p.x, 2) + Math.pow(owlY.value - p.y, 2));

            if (distance < 12) {
                resolvedOps.value.add(p.opId); 
                portals.value.forEach(sibling => {
                    if (sibling.opId === p.opId && sibling !== p) sibling.state = 'disabled';
                });

                if (p.isCorrect) {
                    p.state = 'exploding'; 
                    score.value++;
                    if (p.opType === '+') sessionCoins.value.copper++;
                    else if (p.opType === '-') sessionCoins.value.silver++;
                    else sessionCoins.value.gold++;
                    speakLoud("¡Bien!");
                    safePlay('playCoinSound');
                    setTimeout(() => { p.passed = true; if (score.value >= QUESTIONS_COUNT) triggerWin(); }, 650);
                } else {
                    p.state = 'shattered'; 
                    lives.value--;
                    totalErrors.value++;
                    speakLoud("¡Ups!");
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
    score.value = 0;
    lives.value = 3;
    totalErrors.value = 0;
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    owlY.value = 50;
    velocity.value = 0;
    portals.value = [];
    resolvedOps.value.clear();
    generateOperation(120);
    gameLoop();
};

const triggerWin = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    safePlay('playOwlHoot');

    if (totalErrors.value > 6) {
        sessionCoins.value.gold = Math.min(sessionCoins.value.gold, 5);
        sessionCoins.value.silver = Math.min(sessionCoins.value.silver, 5);
        sessionCoins.value.copper = Math.min(sessionCoins.value.copper, 5);
    }

    if (sessionCoins.value.gold > 0) await store.addCoins('gold', sessionCoins.value.gold);
    if (sessionCoins.value.silver > 0) await store.addCoins('silver', sessionCoins.value.silver);
    if (sessionCoins.value.copper > 0) await store.addCoins('copper', sessionCoins.value.copper);
    
    emit('win', { ...sessionCoins.value });
};

onMounted(() => { document.body.style.overflow = 'hidden'; });
onUnmounted(() => { if (gameLoopId) cancelAnimationFrame(gameLoopId); });
</script>

<template>
  <div class="master-container font-inter" @touchstart="jump" @mousedown="jump">
    <main class="app-canvas !bg-sky-400 shadow-smartphone">
        
        <CoinRain v-if="showCoinRain" type="gold" :count="40" class="z-[400]" />

        <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute top-16 left-[5%] opacity-90"><Cloud class="text-white fill-current" size="72" /></div>
            <div class="absolute top-36 right-[10%] opacity-90"><Cloud class="text-white fill-current" size="56" /></div>
            <div class="absolute -bottom-[15%] w-[140%] -left-[20%] h-[45%] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-[100%] shadow-2xl"></div>
        </div>

        <header v-if="gameState === 'playing'" class="header-runner shrink-0">
            <div class="flex items-center gap-2">
                <div class="status-pill bg-black/30 text-white border border-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Heart size="18" class="text-red-500 fill-current animate-pulse" />
                    <span class="font-black text-xl ml-1">{{ lives }}</span>
                </div>
                <div class="trophy-counter-runner bg-white/90 backdrop-blur-sm border-2 border-yellow-400 px-3 py-1 rounded-full flex items-center gap-2">
                    <Trophy size="20" class="text-yellow-500" />
                    <span class="font-black text-xl text-indigo-900">{{ score }}/{{ QUESTIONS_COUNT }}</span>
                </div>
            </div>

            <div class="session-loot-capsule">
                <div class="loot-indicator"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-indicator border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-indicator"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>

            <button @click="closeRunner" class="btn-close-runner"><CloseIcon :size="20" /></button>
        </header>

        <div class="game-content flex-1 flex flex-col relative overflow-hidden">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in z-50">
                <button @click="closeRunner" class="absolute top-4 right-4 bg-white/30 w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-75 transition-all">
                    <CloseIcon size="24" stroke-width="3" />
                </button>

                <div class="flex flex-col items-center mt-6 text-center">
                    <div class="text-7xl mb-2 drop-shadow-xl animate-float">🦉</div>
                    <h1 class="game-title text-4xl text-white drop-shadow-lg font-black italic uppercase">Vuelo Matemático</h1>
                </div>

                <div class="rules-panel-runner shadow-2xl w-full">
                    <div class="rules-badge-runner uppercase font-black tracking-widest">Manual de Vuelo</div>
                    <div class="flex flex-col gap-5 p-2">
                        <div class="flex gap-4 items-start">
                            <div class="bg-blue-100 p-2.5 rounded-xl"><MousePointer2 class="text-blue-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-700 leading-tight">Toca la pantalla para que el búho **salte** y no caiga.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-green-100 p-2.5 rounded-xl"><Zap class="text-green-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-700 leading-tight">Atraviesa el portal que tenga el **resultado correcto**.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-red-100 p-2.5 rounded-xl"><Heart class="text-red-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-700 leading-tight">Tienes **3 vidas**. ¡Evita los portales falsos!</p>
                        </div>
                    </div>
                </div>

                <button @click="startGame" 
                        class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                               text-white font-black italic text-xl uppercase rounded-[2rem] 
                               border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                               active:translate-y-[4px] active:border-b-[4px] transition-all 
                               flex items-center justify-center py-4 group">
                    ¡INICIAR VUELO! 
                    <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                        <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
                    </div>
                </button>
            </div>

            <template v-else-if="gameState === 'playing'">
                <div class="absolute top-8 left-1/2 -translate-x-1/2 z-50 w-full text-center px-6">
                    <div class="op-panel-runner backdrop-blur-md" :style="{ borderColor: currentOperation.color, backgroundColor: `${currentOperation.color}33` }">
                        <p class="text-white text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Calcula:</p>
                        <h3 class="text-white text-5xl font-black italic tracking-tighter">{{ currentOperation.text }}</h3>
                    </div>
                </div>

                <div class="absolute left-[15%] transition-transform duration-75 z-40" 
                      :style="{ top: owlY + '%', transform: `rotate(${velocity * 4}deg)` }">
                    <div class="text-7xl drop-shadow-[0_15px_25px_rgba(0,0,0,0.4)]">🦉</div>
                </div>

                <div v-for="(p, i) in portals" :key="i" 
                      class="absolute w-28 h-28 flex items-center justify-center transition-opacity duration-300 z-30"
                      :style="{ left: p.x + '%', top: (p.y - 5) + '%', opacity: p.passed ? '0' : '1' }">
                    
                    <div :class="[
                        'portal-circle shadow-2xl backdrop-blur-md transition-all duration-300',
                        p.state === 'exploding' ? 'animate-bubble-pop border-white bg-white/70' : '',
                        p.state === 'shattered' ? 'animate-shatter bg-red-600 border-red-900' : '',
                        p.state === 'disabled' ? 'grayscale opacity-40 scale-90' : ''
                    ]"
                    :style="p.state === 'normal' ? { borderColor: p.color, backgroundColor: `${p.color}44`, boxShadow: `0 0 30px ${p.color}88` } : {}">
                        <span class="text-white text-5xl font-black italic drop-shadow-md">{{ p.val }}</span>
                    </div>
                </div>
            </template>

            <Transition name="pop">
              <div v-if="gameState === 'finished'" class="victory-overlay animate-fade-in uppercase">
                <SimpleConfetti />
                <Trophy class="w-20 h-20 text-amber-500 mb-4 drop-shadow-2xl animate-bounce" />
                <h2 class="victory-title text-indigo-950 font-black italic">¡Vuelo Legendario!</h2>
                
                <div class="prize-card border-b-[10px] border-indigo-100 bg-white">
                   <div class="flex justify-around items-center w-full">
                      <div class="prize-item" :class="sessionCoins.gold > 0 ? 'opacity-100' : 'opacity-20'"><img src="/images/coin-gold.png" /><span>+{{ sessionCoins.gold }}</span></div>
                      <div class="prize-item" :class="sessionCoins.silver > 0 ? 'opacity-100' : 'opacity-20'"><img src="/images/coin-silver.png" /><span>+{{ sessionCoins.silver }}</span></div>
                      <div class="prize-item" :class="sessionCoins.copper > 0 ? 'opacity-100' : 'opacity-20'"><img src="/images/coin-copper.png" /><span>+{{ sessionCoins.copper }}</span></div>
                   </div>
                </div>

                <div class="flex flex-col gap-4 w-full max-w-[280px]">
                    <button @click="startGame" 
                            class="w-full bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                                   text-white py-4 rounded-[1.5rem] font-black italic uppercase 
                                   border-b-[6px] border-[#1E3A8A] shadow-lg active:translate-y-[2px] active:border-b-[2px] transition-all">
                        OTRA CARRERA
                    </button>
                    <button @click="closeRunner" class="text-slate-400 py-2 font-bold text-xs tracking-widest hover:text-indigo-600">SALIR AL PORTAL</button>
                </div>
              </div>
            </Transition>
        </div>
    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; touch-action: none !important; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: all 0.4s; user-select: none; touch-action: none !important; width: 100vw; height: 100dvh; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.3); } }

.header-runner { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 100; }
.trophy-counter-runner { display: flex; align-items: center; gap: 0.5rem; }

.session-loot-capsule {
    display: flex; align-items: center; background: white; padding: 6px 16px;
    border-radius: 9999px; border: 2px solid #f1f5f9;
}

.loot-indicator { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.loot-indicator img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.loot-indicator span { font-weight: 900; color: #1e293b; }

.btn-close-runner { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

.op-panel-runner { border-width: 4px; padding: 1rem 2rem; border-radius: 2.5rem; display: inline-block; min-width: 240px; }
.portal-circle { width: 100%; height: 100%; border-radius: 9999px; border-width: 7px; display: flex; align-items: center; justify-content: center; }

.rules-panel-runner { width: 92%; max-width: 400px; background: white; padding: 1.5rem; border-radius: 2.5rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge-runner { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

.victory-overlay { position: absolute; inset: 0; z-index: 300; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; }
.victory-title { font-size: 2.5rem; line-height: 1; margin-bottom: 2rem; }
.prize-card { background: #f5f3ff; border: 4px solid #ede9fe; border-radius: 2.5rem; padding: 1.5rem; width: 100%; max-width: 280px; margin-bottom: 2rem; }
.prize-item { display: flex; flex-direction: column; align-items: center; }
.prize-item img { width: 2.5rem; height: 2.5rem; }
.prize-item span { font-size: 1.5rem; font-weight: 900; color: #4338ca; }

.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-float { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }

.animate-bubble-pop { animation: bubblePop 0.65s ease-out forwards; }
@keyframes bubblePop { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }
.animate-shatter { animation: violentShake 0.85s linear forwards; }
@keyframes violentShake { 10%, 30%, 50%, 70%, 90% { transform: translate(-8px, 4px); } 20%, 40%, 60%, 80% { transform: translate(8px, -4px); } 100% { opacity: 0; } }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>