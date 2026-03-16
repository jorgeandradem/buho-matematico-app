<script setup>
/** * ARCHIVO: MechanicalVault.vue
 * NOTA INTERNA: v3.3.0 - SONIDOS MECÁNICOS REALISTAS + MISSION SYNC
 * LOGICA: Registro de 'vault_solve' + Desplazamiento vertical.
 * DISEÑO: Intro/Fin en Beige, Acción en Slate. Números XL con sombra cilíndrica.
 */
import { ref, computed } from 'vue';
import { 
  X, Lock, Unlock, PlayCircle, Trophy,
  RotateCw, Medal, Star, ShieldCheck
} from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

// --- IMPORTACIÓN DE SONIDOS MECÁNICOS ---
import dialTickSound from '@/assets/sounds/boveda/dial-tick.mp3';
import vaultOpenSound from '@/assets/sounds/boveda/vault-open.mp3';

const emit = defineEmits(['close']);
const store = useGamificationStore();

// --- ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const currentLevel = ref(0); 
const totalErrors = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const showCoinRain = ref(false);

const targetCode = ref([0, 0, 0, 0]);
const userDigits = ref([0, 0, 0, 0]);
const targetDecomposition = ref("");

const isDragging = ref(null); 
const startY = ref(0);
const startDigitValue = ref(0);

// ✅ MOTOR DE AUDIO MECÁNICO
const playTick = () => {
    const snd = new Audio(dialTickSound);
    snd.volume = 1.0;
    snd.play().catch(() => {});
};

const generateLock = () => {
    const um = Math.floor(Math.random() * 9) + 1;
    const c = Math.floor(Math.random() * 10);
    const d = Math.floor(Math.random() * 10);
    const u = Math.floor(Math.random() * 10);
    
    targetCode.value = [um, c, d, u];
    userDigits.value = [0, 0, 0, 0];
    
    const parts = [];
    if (um > 0) parts.push(`${um} UM`);
    if (c > 0) parts.push(`${c} C`);
    if (d > 0) parts.push(`${d} D`);
    if (u > 0) parts.push(`${u} U`);
    targetDecomposition.value = parts.join(' + ');
};

// --- ⚙️ MOTOR VERTICAL ---
const handleStart = (e, index) => {
    isDragging.value = index;
    startY.value = e.touches ? e.touches[0].clientY : e.clientY;
    startDigitValue.value = userDigits.value[index];
    
    // Desbloqueo silencioso de audio para iOS
    const unlock = new Audio(dialTickSound);
    unlock.volume = 0;
    unlock.play().catch(() => {});
};

const handleMove = (e) => {
    if (isDragging.value === null) return;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = startY.value - currentY;
    
    const digitChange = Math.round(diff / 45); 
    let nextDigit = (startDigitValue.value + digitChange) % 10;
    if (nextDigit < 0) nextDigit += 10;
    
    if (userDigits.value[isDragging.value] !== nextDigit) {
        userDigits.value[isDragging.value] = nextDigit;
        playTick(); // ✅ Sonido de engranaje metálico
        if (navigator.vibrate) navigator.vibrate(10);
    }
};

const handleEnd = () => { isDragging.value = null; };

const dialOffset = (index) => ({
    transform: `translateY(${userDigits.value[index] * -50}px)`,
    transition: isDragging.value === index ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
});

const gemStyles = [
    { short: 'UM', color: 'from-red-500 to-red-800', shadow: 'shadow-red-500/40' },
    { short: 'C', color: 'from-emerald-500 to-emerald-800', shadow: 'shadow-emerald-500/40' },
    { short: 'D', color: 'from-blue-500 to-blue-800', shadow: 'shadow-blue-500/40' },
    { short: 'U', color: 'from-amber-500 to-amber-800', shadow: 'shadow-amber-500/40' }
];

const checkCombination = () => {
    const isCorrect = userDigits.value.every((v, i) => v === targetCode.value[i]);
    if (isCorrect) {
        // ✅ SONIDO DE APERTURA PESADA
        new Audio(vaultOpenSound).play().catch(() => {});
        
        gameState.value = 'opening';
        speak("¡Acceso concedido!");

        store.updateMissionProgress('vault_solve', 1);

        setTimeout(() => {
            sessionCoins.value.gold += 1;
            if (currentLevel.value < 9) {
                currentLevel.value++;
                gameState.value = 'playing';
                generateLock();
            } else { endGame(); }
        }, 1800);
    } else {
        new Audio('/audios/wrong.mp3').play().catch(() => {});
        totalErrors.value++;
        speak("Combinación incorrecta.");
    }
};

const startGame = () => {
    gameState.value = 'playing';
    currentLevel.value = 0;
    sessionCoins.value.gold = 0;
    totalErrors.value = 0;
    showCoinRain.value = false;
    generateLock();
};

const endGame = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    new Audio('/audios/finish.mp3').play().catch(() => {});
    await store.processEndGameRewards({ gold: sessionCoins.value.gold }, totalErrors.value);
};
</script>

<template>
  <div class="master-container" @mousemove="handleMove" @touchmove="handleMove" @mouseup="handleEnd" @touchend="handleEnd">
    
    <main class="app-canvas shadow-2xl transition-all duration-700" 
          :class="{ 'bg-beige': gameState === 'rules' || gameState === 'finished', 'bg-slate-900': gameState === 'playing' || gameState === 'opening' }">
        
        <div v-if="showCoinRain" class="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
            <CoinRain type="gold" :count="40" />
        </div>

        <header v-if="gameState !== 'rules'" class="header-standard shrink-0 border-b-2 border-slate-300/50 bg-white/80 backdrop-blur-sm">
            <div class="flex items-center gap-3">
                <div class="bg-amber-100 p-1.5 rounded-lg border border-amber-200">
                    <Trophy size="20" class="text-amber-600" />
                </div>
                <span class="text-xl font-black text-slate-700">{{ currentLevel + 1 }}/10</span>
            </div>

            <div class="session-loot-capsule bg-slate-100/50 border-slate-300">
                <div class="loot-item"><img src="/images/coin-gold.png" class="w-5 h-5" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x border-slate-200"><img src="/images/coin-silver.png" class="w-5 h-5" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" class="w-5 h-5" /><span>{{ sessionCoins.copper }}</span></div>
            </div>

            <button @click="gameState = 'rules'" class="btn-close-circle bg-white shadow-sm text-blue-900 border border-slate-200">
                <X size="22" stroke-width="3" />
            </button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-between py-6 relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-around animate-fade-in w-full max-w-[420px] -translate-y-4">
                <button @click="emit('close')" class="absolute top-2 right-4 bg-white rounded-full p-2.5 text-blue-950 shadow-md active:scale-90 z-10">
                    <X size="28"/>
                </button>

                <div class="flex flex-col items-center">
                    <div class="vault-door-3d bg-slate-800 p-8 rounded-[3rem] border-8 border-slate-700 shadow-2xl mb-4 relative overflow-hidden">
                        <div class="rotating-gear-bg"></div>
                        <Lock size="70" class="text-amber-500 relative z-10" />
                    </div>
                    <h1 class="game-title text-4xl uppercase font-black text-amber-900 tracking-tighter italic">La Bóveda</h1>
                </div>

                <div class="rules-panel shadow-xl border-4 border-amber-200">
                    <div class="rules-badge">INSTRUCCIONES</div>
                    <div class="text-slate-700 font-bold text-center text-sm leading-relaxed mb-4">
                        <p class="mb-2">Este reto corresponde a <span class="text-indigo-700 font-black">LA BÓVEDA</span>.</p>
                        <p class="text-xs text-slate-500 mb-3 uppercase tracking-tighter">Asocia cada dial con su valor posicional:</p>
                        
                        <div class="flex flex-col gap-1 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div class="flex justify-between px-2">
                                <span><span class="text-red-600 font-black">UM</span> = Unidad de Mil</span>
                                <span><span class="text-emerald-600 font-black">C</span> = Centena</span>
                            </div>
                            <div class="flex justify-between px-2">
                                <span><span class="text-blue-600 font-black">D</span> = Decena</span>
                                <span><span class="text-amber-600 font-black">U</span> = Unidad</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-2">
                        <div v-for="g in gemStyles" :key="g.short" class="flex flex-col items-center">
                            <div :class="['w-14 h-9 rounded-lg bg-gradient-to-br border-2 border-white/40 shadow-lg flex items-center justify-center font-black text-white text-xs', g.color, g.shadow]">
                                {{ g.short }}
                            </div>
                        </div>
                    </div>
                </div>

                <button @click="startGame" class="btn-primary-vault">ABRIR CONSOLA <PlayCircle class="ml-2"/></button>
            </div>

            <div v-else-if="gameState === 'playing' || gameState === 'opening'" class="w-full flex flex-col items-center justify-around flex-1 animate-fade-in">
                
                <div class="plasma-terminal-light shadow-lg">
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Algoritmo Secreto</p>
                    <h2 class="text-3xl font-black text-indigo-900 tracking-tighter drop-shadow-sm">{{ targetDecomposition }}</h2>
                </div>

                <div class="mechanical-console p-10 rounded-[4rem] bg-slate-800 border-t-8 border-slate-700 shadow-2xl flex gap-2.5 sm:gap-6 justify-center items-center relative">
                    <div v-for="(dial, idx) in 4" :key="idx" class="flex flex-col items-center">
                        <div :class="['w-12 h-6 rounded-md bg-gradient-to-br shadow-lg border border-white/20 mb-4 flex items-center justify-center font-black text-white text-[9px] uppercase tracking-tighter', gemStyles[idx].color]">
                            {{ gemStyles[idx].short }}
                        </div>
                        
                        <div class="drum-well relative w-16 h-48 sm:w-20 sm:h-52 bg-black rounded-2xl border-4 border-slate-900 overflow-hidden shadow-inner cursor-ns-resize"
                             @mousedown="e => handleStart(e, idx)" @touchstart="e => handleStart(e, idx)">
                            
                            <div class="absolute top-1/2 -translate-y-1/2 w-full h-[52px] bg-white/10 border-y border-white/20 z-20 pointer-events-none"></div>
                            
                            <div class="absolute w-full flex flex-col items-center pt-[66px] sm:pt-[76px]" :style="dialOffset(idx)">
                                <div v-for="num in 10" :key="num" 
                                     class="h-[50px] w-full flex items-center justify-center font-black transition-all duration-300"
                                     :class="[
                                         userDigits[idx] === (num-1) ? 'text-white scale-125 text-4xl sm:text-5xl z-30' : 
                                         Math.abs(userDigits[idx] - (num-1)) === 1 || Math.abs(userDigits[idx] - (num-1)) === 9 ? 'text-white/40 scale-90 text-3xl' : 'text-white/10 scale-75 text-2xl'
                                     ]">
                                    {{ num - 1 }}
                                </div>
                            </div>

                            <div class="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_25px_35px_rgba(0,0,0,0.9),inset_0_-25px_35px_rgba(0,0,0,0.9)]"></div>
                        </div>
                    </div>
                </div>

                <button @click="checkCombination" class="btn-unlock-light group" :disabled="gameState === 'opening'">
                    <span v-if="gameState === 'playing'">CRACKEAR CAJA FUERTE</span>
                    <span v-else class="animate-pulse">ABRIENDO...</span>
                    <RotateCw v-if="gameState === 'opening'" class="ml-2 animate-spin text-white" />
                    <Unlock v-else class="ml-2 group-active:translate-y-1" />
                </button>
            </div>

            <div v-else class="flex flex-col items-center justify-around flex-1 animate-fade-in text-center py-8">
                <Medal size="100" class="text-yellow-500 mb-2 drop-shadow-xl animate-bounce" />
                <h2 class="game-title text-4xl text-amber-950 italic">¡Bóveda Vaciada!</h2>
                
                <div class="rules-panel bg-white p-8 shadow-2xl rounded-3xl border-4 border-amber-100">
                    <p class="text-slate-400 font-black uppercase text-xs mb-4 tracking-[0.3em]">Tesoro en Oro</p>
                    <div class="flex items-center justify-center gap-4">
                        <img src="/images/coin-gold.png" class="w-16 h-16" />
                        <span class="text-7xl font-black text-slate-800 leading-none">{{ sessionCoins.gold }}</span>
                    </div>
                </div>
                
                <button @click="startGame" class="btn-primary-vault w-full max-w-[320px]">INICIAR NUEVO HACKEO</button>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
/* ESTRUCTURA MAESTRA */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; }
.app-canvas { width: 100vw; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; position: relative; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 8px solid white; } }

.bg-beige { background-color: #f5f5dc !important; }
.bg-slate-900 { background-color: #0f172a !important; }

/* HEADER */
.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; }
.session-loot-capsule { display: flex; align-items: center; padding: 4px 16px; border-radius: 9999px; border: 2px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; color: #334155; }
.btn-close-circle { border-radius: 9999px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; }

/* ELEMENTOS VISUALES */
.game-title { font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; }
.rules-panel { width: 92%; background: white; padding: 1.5rem; border-radius: 2rem; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 3px 12px; border-radius: 9999px; }

.plasma-terminal-light { background: white; padding: 1.2rem 2.5rem; border-radius: 2rem; border-bottom: 6px solid #94a3b8; text-align: center; }
.mechanical-console { border-bottom: 12px solid #1e293b; }

.btn-primary-vault { background: linear-gradient(to bottom, #f59e0b, #b45309); color: white; padding: 1.25rem 2.5rem; border-radius: 1.5rem; border-bottom: 6px solid #78350f; font-weight: 900; text-transform: uppercase; display: flex; align-items: center; }
.btn-unlock-light { background: linear-gradient(to bottom, #10b981, #065f46); color: white; padding: 1.2rem 2.5rem; border-radius: 1.5rem; border-bottom: 6px solid #064e3b; font-weight: 900; text-transform: uppercase; display: flex; align-items: center; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3); }

.rotating-gear-bg { position: absolute; inset: -20px; border: 8px dotted rgba(245, 158, 11, 0.1); border-radius: 50%; animation: spin 15s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>