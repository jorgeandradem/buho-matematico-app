<script setup>
/** * ARCHIVO: NumberSearch.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.3 + BLINDAJE DVH + REPORTE DE MISIONES
 * LOGICA: Sopa de números (Resultados algebraicos) + Comunicación viva con el Store.
 */
import { ref, onMounted } from 'vue';
import { X as CloseIcon, Trophy, AlertCircle, Sparkles, Search, PlayCircle, BookOpen, ChevronRight } from 'lucide-vue-next';
import SimpleConfetti from './SimpleConfetti.vue';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const grid = ref([]);
const challenges = ref([]);
const currentSelection = ref([]);
const showCoinRain = ref(false);
const perfectGame = ref(true);
const confirmedCells = ref(new Set());
const isAudioUnlocked = ref(false);

const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

// --- MOTOR DE AUDIO ---
const playCorrectSound = () => {
    const audio = new Audio('/audios/correct1.mp3');
    audio.volume = 1.0;
    audio.play().catch(e => console.warn("Audio bloqueado:", e));
};

const speakLoud = (text, isExclamation = false) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0;
    utterance.lang = 'es-ES';
    if (isExclamation) { utterance.rate = 1.4; utterance.pitch = 1.5; }
    else { utterance.rate = 1.1; utterance.pitch = 1.0; }
    window.speechSynthesis.speak(utterance);
};

const unlockAudio = () => {
    if (isAudioUnlocked.value) return;
    speakLoud(""); 
    isAudioUnlocked.value = true;
};

// --- NAVEGACIÓN ---
const startGame = () => {
    gameState.value = 'playing';
    initGame();
};

const returnToRules = () => {
    gameState.value = 'rules';
    currentSelection.value = [];
};

const exitToPortal = () => {
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    emit('close');
};

const initGame = () => {
    showCoinRain.value = false;
    currentSelection.value = [];
    perfectGame.value = true;
    confirmedCells.value.clear();
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    
    const newChallenges = [];
    const ops = ['+', '-', '×']; 
    while(newChallenges.length < 12) {
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        let res = op === '+' ? a + b : (op === '-' ? (a+10) - b : a * b);
        const text = `${op === '-' ? a+10 : a}${op}${b}`;
        if (!newChallenges.find(c => c.text === text)) {
            newChallenges.push({ text, result: res.toString(), found: false, opType: op });
        }
    }
    challenges.value = newChallenges;

    let gridReady = false;
    while (!gridReady) {
        const tempGrid = Array.from({ length: 36 }, (_, i) => ({ id: i, val: '', status: 'neutral', isOverlapping: false }));
        const usageCount = new Array(36).fill(0);
        let placedAll = true;

        for (const ch of challenges.value) {
            let placed = false;
            let pAttempts = 0;
            const digits = ch.result.split('');

            while (!placed && pAttempts < 250) {
                const isHorizontal = Math.random() > 0.5;
                const startIdx = Math.floor(Math.random() * 36);
                const canPlace = digits.every((d, i) => {
                    const pos = isHorizontal ? startIdx + i : startIdx + (i * 6);
                    return pos < 36 && (isHorizontal ? Math.floor(pos/6) === Math.floor(startIdx/6) : true) && (tempGrid[pos].val === '' || tempGrid[pos].val === d);
                });

                if (canPlace) {
                    digits.forEach((d, i) => { 
                        const pos = isHorizontal ? startIdx + i : startIdx + (i * 6); 
                        tempGrid[pos].val = d; 
                        usageCount[pos]++; 
                    });
                    placed = true;
                }
                pAttempts++;
            }
            if (!placed) { placedAll = false; break; }
        }

        if (placedAll) {
            grid.value = tempGrid.map((cell, idx) => {
                if (cell.val === '') cell.val = Math.floor(Math.random() * 10).toString();
                cell.isOverlapping = usageCount[idx] > 1; 
                return cell;
            });
            gridReady = true;
        }
    }
    speakLoud("¡Sopa de números activada!");
};

const handleCellClick = (cell) => {
    if (gameState.value !== 'playing' || currentSelection.value.includes(cell)) return;
    unlockAudio();
    
    cell.status = 'selected';
    currentSelection.value.push(cell);
    const typedValue = currentSelection.value.map(c => c.val).join('');
    const match = challenges.value.find(ch => ch.result === typedValue && !ch.found);

    if (match) {
        match.found = true;
        currentSelection.value.forEach(c => {
            c.status = 'correct';
            confirmedCells.value.add(c.id);
        });
        playCorrectSound();

        // 🛡️ REPORTE QUIRÚRGICO A MISIONES: Notificamos al Store cada hallazgo
        store.updateMissionProgress('search_numbers', 1);

        if (match.opType === '+') sessionCoins.value.copper++;
        else if (match.opType === '-') sessionCoins.value.silver++;
        else if (match.opType === '×') sessionCoins.value.gold++;
        
        currentSelection.value = [];
        if (challenges.value.every(ch => ch.found)) triggerWin();
    } else if (!challenges.value.some(ch => ch.result.startsWith(typedValue) && !ch.found)) {
        perfectGame.value = false;
        currentSelection.value.forEach(c => c.status = 'error');
        speakLoud("No", true);

        setTimeout(() => {
            currentSelection.value.forEach(c => { 
                c.status = confirmedCells.value.has(c.id) ? 'correct' : 'neutral'; 
            });
            currentSelection.value = [];
        }, 400);
    }
};

const triggerWin = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    playCoinSound();
    playOwlHoot();
    
    // 🛡️ REPORTE DE PARTIDA COMPLETADA:
    store.updateMissionProgress('play_any_game', 1);
    
    if (!perfectGame.value) {
        sessionCoins.value.gold = Math.max(1, Math.floor(sessionCoins.value.gold / 2));
        sessionCoins.value.silver = Math.max(1, Math.floor(sessionCoins.value.silver / 2));
        sessionCoins.value.copper = Math.max(1, Math.floor(sessionCoins.value.copper / 2));
    }

    try {
        if (sessionCoins.value.gold > 0) await store.addCoins('gold', sessionCoins.value.gold);
        if (sessionCoins.value.silver > 0) await store.addCoins('silver', sessionCoins.value.silver);
        if (sessionCoins.value.copper > 0) await store.addCoins('copper', sessionCoins.value.copper);
        emit('win', { ...sessionCoins.value });
    } catch (e) { console.error(e); }
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-slate-50 shadow-smartphone">
        <CoinRain v-if="showCoinRain" type="gold" :count="30" class="z-[400]" />

        <header v-if="gameState === 'playing'" class="header-sopa shrink-0">
            <div class="trophy-counter">
                <Trophy size="18" class="text-green-600" />
                <span class="font-black text-base text-green-700">
                    {{ challenges.filter(c => c.found).length }}/12
                </span>
            </div>
            <div class="session-loot-capsule">
                <div class="loot-indicator"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-indicator border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-indicator"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>
            <button @click="returnToRules" class="btn-close-sopa"><CloseIcon :size="20" /></button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-between py-2 overflow-hidden relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in">
                <button @click="exitToPortal" class="absolute top-4 right-4 bg-slate-200/50 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all">
                    <CloseIcon size="24" stroke-width="3" />
                </button>

                <div class="flex flex-col items-center mt-6">
                    <Search size="60" class="text-indigo-600 animate-bounce mb-2" />
                    <h1 class="game-title text-3xl">NÚMERO OCULTO</h1>
                </div>

                <div class="rules-panel-sopa shadow-xl w-full">
                    <div class="rules-badge uppercase font-black tracking-widest">Manual del Investigador</div>
                    <div class="flex flex-col gap-5 p-2">
                        <div class="flex gap-4 items-start">
                            <div class="bg-indigo-100 p-2 rounded-xl"><BookOpen class="text-indigo-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-600">Resuelve las operaciones de arriba y busca su **resultado** en la cuadrícula.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-green-100 p-2 rounded-xl"><Search class="text-green-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-600">Selecciona los números en orden (horizontal o vertical) para tacharlos.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-amber-100 p-2 rounded-xl"><Sparkles class="text-amber-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-600">¡Suma: 🥉 | Resta: 🥈 | Multi: 🥇! No falles para duplicar tu premio.</p>
                        </div>
                    </div>
                </div>

                <button @click="startGame" 
                        class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                               text-white font-black italic text-xl uppercase rounded-[2rem] 
                               border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                               active:translate-y-[4px] active:border-b-[4px] transition-all 
                               flex items-center justify-center py-4 group">
                    ¡BUSCAR NÚMEROS! 
                    <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                        <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
                    </div>
                </button>
            </div>

            <template v-else-if="gameState === 'playing'">
                <div class="w-full grid grid-cols-4 gap-1 px-4 shrink-0 mt-1">
                    <div v-for="ch in challenges" :key="ch.text" :class="['challenge-pill', ch.found ? 'pill-found' : 'pill-active']">
                        <p class="text-base font-black italic tracking-tighter">{{ ch.text }}</p>
                    </div>
                </div>

                <div class="sopa-grid-container shadow-2xl shrink-0">
                    <div class="grid grid-cols-6 grid-rows-6 h-full w-full">
                        <button v-for="cell in grid" :key="cell.id" @click="handleCellClick(cell)"
                            :class="['cell-btn', 
                                cell.status === 'neutral' ? 'cell-neutral' : '',
                                cell.status === 'selected' ? 'cell-selected' : '',
                                cell.status === 'correct' ? 'cell-correct' : '',
                                cell.status === 'error' ? 'cell-error' : '']">
                            <span>{{ cell.val }}</span>
                        </button>
                    </div>
                </div>
                <div class="h-2"></div>
            </template>

            <Transition name="pop">
              <div v-if="gameState === 'finished'" class="victory-overlay animate-fade-in uppercase">
                <SimpleConfetti />
                <Trophy class="w-20 h-20 text-amber-500 mb-4 drop-shadow-2xl animate-bounce" />
                <h2 class="victory-title text-indigo-950 font-black italic">¡Botín Asegurado!</h2>
                
                <div class="prize-card border-b-[10px] border-indigo-100">
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
                        OTRO DESAFÍO
                    </button>
                    <button @click="exitToPortal" class="text-slate-400 py-2 font-bold text-xs tracking-widest hover:text-indigo-600">SALIR AL PORTAL</button>
                </div>
              </div>
            </Transition>
        </div>
    </main>
  </div>
</template>

<style scoped>
/* 🛡️ BLINDAJE TÉCNICO v2.9.3 */
.master-container {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    background-color: #ffffff; overflow: hidden;
    touch-action: none !important;
    height: 100dvh; top: 0; left: 0; /* Blindaje de viewport dinámico */
}

.app-canvas {
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none; width: 100vw; height: 100dvh;
}

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }

.header-sopa {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 50;
}

.session-loot-capsule {
    display: flex; align-items: center; background: white; padding: 6px 16px;
    border-radius: 9999px; border: 2px solid #f1f5f9;
}

.loot-indicator { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.loot-indicator img { width: 1.15rem; height: 1.15rem; object-fit: contain; }
.loot-indicator span { font-weight: 900; color: #1e293b; font-size: 0.9rem; }

.btn-close-sopa { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

/* OPTIMIZACIÓN DE TAMAÑO PARA MÓVILES */
.sopa-grid-container { 
    width: 90%; 
    max-width: 340px; /* Reducido de 380 a 340 para que quepa en todos los móviles */
    aspect-ratio: 1/1; 
    background: white; 
    border-radius: 2rem; 
    padding: 6px; 
    border: 4px solid white; 
    outline: 4px solid #f1f5f9; 
}

.cell-btn { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 900; font-style: italic; border: 0.5px solid #f1f5f9; }
.cell-neutral { color: #cbd5e1; }
.cell-selected { background: #fde047; color: #854d0e; border-radius: 8px; transform: scale(1.05); }
.cell-correct { background: #dcfce7; color: #15803d; }
.cell-error { background: #fee2e2; color: #b91c1c; animation: shake 0.2s ease-in-out 2; }

.challenge-pill { padding: 4px; border-radius: 8px; border: 2px solid #e0e7ff; text-align: center; }
.pill-found { background: #f0fdf4; border-color: #bbf7d0; opacity: 0.4; color: #166534; transform: scale(0.9); }
.pill-active { background: white; color: #312e81; }

.rules-panel-sopa { width: 92%; background: white; padding: 1.5rem; border-radius: 2rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

.victory-overlay {
    position: absolute; inset: 0; z-index: 300; background: white;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 2rem; text-align: center;
}
.victory-title { font-size: 2.2rem; line-height: 1; margin-bottom: 1rem; }
.prize-card { background: #f5f3ff; border: 4px solid #ede9fe; border-radius: 3rem; padding: 1.5rem; width: 100%; max-width: 280px; margin-bottom: 1.5rem; }
.prize-item { display: flex; flex-direction: column; align-items: center; }
.prize-item img { width: 2.5rem; height: 2.5rem; margin-bottom: 4px; }
.prize-item span { font-size: 1.5rem; font-weight: 900; color: #4338ca; }

.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.9) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>