<script setup>
/** * ARCHIVO: RUTA DEL TESORO TreasureHunt.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.3 + MAPA 3D ÉPICO + CONEXIÓN LLAMITA (RACHAS)
 * LOGICA: Reporte de cofres abiertos y fin de partida al Banco Central.
 */
import { ref, computed, onMounted } from 'vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { pirateLevels } from '../data/pirateLevels';
import { X as CloseIcon, Trophy, Zap, AlertCircle, Flag, Ship, MousePointer2, PlayCircle, ChevronRight } from 'lucide-vue-next';
import SimpleConfetti from '../components/SimpleConfetti.vue';
import CoinRain from '../components/CoinRain.vue';
import { playOwlHoot, playCoinSound } from '../utils/sound';
import { speak } from '../utils/voice';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- 1. CONFIGURACIÓN Y ESTADOS ---
const QUESTIONS_COUNT = 10;
const flagColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4', '#14b8a6', '#8b5cf6'];

const gameState = ref('rules'); 
const progress = ref(0);
const totalErrors = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

// --- 2. MOTOR DE AUDIO (BUQUE) ---
const soundShipHorn = new Audio('https://assets.mixkit.co/active_storage/sfx/1004/1004-preview.mp3'); 
soundShipHorn.volume = 0.6;

const playHorn = () => {
    soundShipHorn.currentTime = 0;
    soundShipHorn.play().catch(() => {});
};

// --- 3. LÓGICA DE NAVEGACIÓN ---
const isChestOpen = ref(false);
const navigationClass = ref('center'); 
const showIslandBanner = ref(false);
const showCoinRain = ref(false);
const currentChallenge = ref({ text: '', result: 0, options: [], opType: '' });
const wrongSelected = ref([]); 
const currentFlagColor = ref(flagColors[0]);

const closeTreasure = () => {
    if (gameState.value === 'rules') {
        emit('close');
    } else {
        gameState.value = 'rules';
    }
};

const generateChallenge = () => {
    wrongSelected.value = [];
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 12) + 1;
    let b = Math.floor(Math.random() * 12) + 1;
    let res = op === '+' ? a + b : (a + 10) - b;

    let opts = new Set([res]);
    while (opts.size < 3) {
        let fake = res + (Math.floor(Math.random() * 4) + 1) * (Math.random() > 0.5 ? 1 : -1);
        if (fake >= 0 && fake !== res) opts.add(fake);
    }

    currentChallenge.value = {
        text: `${op === '-' ? a + 10 : a} ${op} ${b}`,
        result: res,
        options: Array.from(opts).sort(() => Math.random() - 0.5),
        opType: op
    };
};

const startChallenge = () => {
    playHorn(); 
    isChestOpen.value = false;
    navigationClass.value = 'center';
    showIslandBanner.value = false;
    progress.value = 0;
    totalErrors.value = 0;
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    gameState.value = 'playing';
    currentFlagColor.value = flagColors[Math.floor(Math.random() * flagColors.length)];
    generateChallenge();
};

const handleAnswer = (selected) => {
    if (navigationClass.value !== 'center' || isChestOpen.value) return;

    if (selected === currentChallenge.value.result) {
        progress.value++;

        // 🛡️ REPORTE QUIRÚRGICO A MISIONES: Notificamos cada cofre abierto para la llamita
        store.updateMissionProgress('treasure_chest_opened', 1);

        if (currentChallenge.value.opType === '+') sessionCoins.value.copper++;
        else sessionCoins.value.silver++;
        
        isChestOpen.value = true;
        showIslandBanner.value = true;
        playCoinSound();

        if (progress.value >= QUESTIONS_COUNT) {
            setTimeout(() => finishGame(), 1500);
        } else {
            setTimeout(() => {
                navigationClass.value = 'exit-left'; 
                setTimeout(() => {
                    navigationClass.value = 'off-screen-right';
                    currentFlagColor.value = flagColors[Math.floor(Math.random() * flagColors.length)];
                    isChestOpen.value = false;
                    showIslandBanner.value = false;
                    setTimeout(() => {
                        navigationClass.value = 'center';
                        generateChallenge();
                    }, 50); 
                }, 1500); 
            }, 1000); 
        }
    } else {
        if (!wrongSelected.value.includes(selected)) {
            wrongSelected.value.push(selected);
            totalErrors.value++;
            if (navigator.vibrate) navigator.vibrate(200);
        }
    }
};

const finishGame = async () => {
    playHorn(); 
    gameState.value = 'finished';
    showCoinRain.value = true;
    
    // 🛡️ REPORTE DE PARTIDA COMPLETADA PARA LA RACHA:
    store.updateMissionProgress('play_any_game', 1);

    playOwlHoot();
    if (totalErrors.value > 6) sessionCoins.value = { gold: 0, silver: 0, copper: 5 };
    await store.addCoins('gold', sessionCoins.value.gold);
    await store.addCoins('silver', sessionCoins.value.silver);
    await store.addCoins('copper', sessionCoins.value.copper);
};

onMounted(() => { document.body.style.overflow = 'hidden'; });
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-white shadow-smartphone">
      
      <CoinRain v-if="showCoinRain" type="silver" :count="40" class="z-[400]" />

      <header v-if="gameState !== 'rules'" class="header-standard shrink-0">
        <div class="trophy-section">
          <Trophy size="22" class="text-yellow-500" />
          <span class="text-xl font-black text-indigo-900">{{ progress }}/10</span>
        </div>
        <div class="session-loot-capsule">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>
        <button @click="closeTreasure" class="btn-close-circle"><CloseIcon :size="20" /></button>
      </header>

      <div class="game-content flex-1 flex flex-col items-center justify-between py-4 overflow-hidden relative">
        
        <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in z-50">
            <button @click="closeTreasure" class="absolute top-4 right-4 bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 active:scale-75 transition-all">
                <CloseIcon size="24" stroke-width="3" />
            </button>

            <div class="flex flex-col items-center mt-4 text-center">
                
                <div class="map-3d-epic animate-float">
                    <div class="map-scroll-top"></div>
                    <div class="map-surface">
                        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md p-1">
                            <path d="M 10 85 Q 30 90 40 70 T 70 55 T 40 30 T 80 15" fill="none" stroke="#78350f" stroke-width="2" stroke-dasharray="3 3" class="animate-map-dash" />
                            
                            <circle cx="10" cy="85" r="4" fill="#22c55e" stroke="#14532d" stroke-width="1.5"/>
                            <circle cx="25" cy="82" r="3" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                            <circle cx="40" cy="70" r="3.5" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                            <circle cx="55" cy="62" r="3" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                            <circle cx="70" cy="55" r="3.5" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                            <circle cx="60" cy="42" r="3" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                            <circle cx="45" cy="35" r="3.5" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                            <circle cx="40" cy="30" r="3" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                            <circle cx="60" cy="22" r="3.5" fill="#22c55e" stroke="#14532d" stroke-width="1"/>
                            
                            <path d="M 76 11 L 84 19 M 84 11 L 76 19" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />
                        </svg>
                    </div>
                    <div class="map-scroll-bottom"></div>
                </div>

                <h1 class="game-title text-center text-4xl uppercase italic font-black text-indigo-900 drop-shadow-sm mt-2">Ruta del Tesoro</h1>
            </div>

            <div class="rules-panel shadow-2xl w-full">
                <div class="rules-badge uppercase font-black tracking-widest">Manual del Capitán</div>
                <div class="flex flex-col gap-5 p-2">
                    <div class="flex gap-4 items-start">
                        <div class="bg-blue-50 p-2.5 rounded-xl border border-blue-100 shrink-0"><Ship class="text-blue-600" size="20" /></div>
                        <p class="text-sm font-bold text-slate-700 leading-tight">Navega a través de **10 islas** resolviendo operaciones matemáticas.</p>
                    </div>
                    <div class="flex gap-4 items-start">
                        <div class="bg-yellow-50 p-2.5 rounded-xl border border-yellow-100 shrink-0"><Zap class="text-yellow-600" size="20" /></div>
                        <p class="text-sm font-bold text-slate-700 leading-tight">Cada acierto abre el cofre y te permite zarpar hacia el próximo destino.</p>
                    </div>
                    <div class="flex gap-4 items-start">
                        <div class="bg-red-100 p-2.5 rounded-xl border border-red-100 shrink-0"><AlertCircle class="text-red-600" size="20" /></div>
                        <p class="text-sm font-bold text-slate-700 leading-tight">¡Cuidado! Muchos errores reducirán tu botín final en el puerto.</p>
                    </div>
                </div>
            </div>

            <button @click="startChallenge" 
                    class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                           text-white font-black italic text-xl uppercase rounded-[2rem] 
                           border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                           active:translate-y-[4px] active:border-b-[4px] transition-all 
                           flex items-center justify-center py-4 group">
                ¡A NAVEGAR! 
                <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                    <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
                </div>
            </button>
        </div>

        <div v-else-if="gameState === 'playing'" class="flex-1 w-full flex flex-col items-center justify-start relative">
            <div class="absolute inset-0 w-full h-full bg-[#0284c7] z-0 shadow-inner"></div>
            <div class="absolute top-[45%] w-full h-8 bg-gradient-to-b from-white/40 to-transparent blur-sm z-10 animate-foam"></div>

            <div class="mission-tag-surgical z-20 mt-4">MISIÓN: ISLA {{ progress + 1 }}</div>

            <div :class="['ship-container z-30 mt-8', navigationClass]">
                <div class="absolute -top-8 left-[60%] flex flex-col items-center">
                  <div class="smoke-v2 s1"></div>
                  <div class="smoke-v2 s2"></div>
                </div>
                <div class="absolute -top-4 left-[35%] animate-flag-wave z-10">
                  <Flag size="28" :fill="currentFlagColor" :color="currentFlagColor" class="drop-shadow-md" />
                </div>
                <div class="text-[100px] drop-shadow-2xl animate-boat-float leading-none relative z-20">🚢</div>
            </div>

            <div v-if="navigationClass === 'center'" class="flex flex-row items-center justify-center gap-8 w-full mt-4 z-20">
                <div class="w-16 h-16 bg-black rounded-full border-4 border-white shadow-xl flex items-center justify-center text-3xl animate-float">🦉</div>
                <div :class="['chest-svg-wrapper', isChestOpen ? 'is-open' : 'animate-chest-attention']">
                   <svg viewBox="0 0 100 100" class="w-24 h-24 drop-shadow-xl">
                      <path d="M10,40 L90,40 L90,80 Q90,90 80,90 L20,90 Q10,90 10,80 Z" fill="#78350f" stroke="#451a03" stroke-width="3"/>
                      <path class="chest-lid transition-transform duration-500" d="M10,40 L90,40 L95,20 L5,20 Z" fill="#92400e" stroke="#451a03" stroke-width="3" :style="isChestOpen ? 'transform: translateY(-20px) rotate(-15deg)' : ''"/>
                      <circle cx="50" cy="50" r="5" fill="#facc15" stroke="#854d0e" stroke-width="2"/>
                   </svg>
                </div>
            </div>

            <div v-if="navigationClass === 'center' && !isChestOpen" class="challenge-area-treasure z-40 mt-auto mb-6 w-full px-4">
                <div class="challenge-card-treasure-surgical animate-pop-in">
                    <div class="challenge-text-surgical italic">{{ currentChallenge.text }}</div>
                    <div class="options-grid-surgical">
                        <button v-for="opt in currentChallenge.options" :key="opt" 
                                @click="handleAnswer(opt)" 
                                :class="['btn-treasure-option-surgical', wrongSelected.includes(opt) ? 'is-wrong' : '']">
                            {{ opt }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showIslandBanner" class="absolute top-1/3 z-50 animate-island-pop">
                <div class="bg-yellow-400 text-indigo-900 px-8 py-3 rounded-2xl font-black text-2xl shadow-2xl border-4 border-white rotate-[-4deg]">¡COFRE ABIERTO!</div>
            </div>
        </div>

        <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in z-50">
            <SimpleConfetti />
            <Trophy class="w-32 h-32 text-yellow-300 mb-4 drop-shadow-xl animate-float" />
            <h2 class="victory-title text-indigo-950 font-black text-center uppercase italic">¡Ruta Completada!</h2>
            
            <div class="prize-card-large mt-6 border-b-[10px] border-indigo-100 bg-white">
                <div class="flex justify-around w-full">
                    <div class="loot-res flex flex-col items-center"><img src="/images/coin-gold.png" class="w-12 h-12" /><span class="font-black text-xl text-amber-600">+{{ sessionCoins.gold }}</span></div>
                    <div class="loot-res flex flex-col items-center border-x border-slate-100 px-6"><img src="/images/coin-silver.png" class="w-12 h-12" /><span class="font-black text-xl text-slate-500">+{{ sessionCoins.silver }}</span></div>
                    <div class="loot-res flex flex-col items-center"><img src="/images/coin-copper.png" class="w-12 h-12" /><span class="font-black text-xl text-orange-600">+{{ sessionCoins.copper }}</span></div>
                </div>
            </div>

            <div class="flex flex-col gap-4 w-full max-w-[280px] mt-8">
                <button @click="startChallenge" 
                        class="w-full bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                               text-white py-4 rounded-[1.5rem] font-black italic uppercase 
                               border-b-[6px] border-[#1E3A8A] shadow-lg active:translate-y-[2px] active:border-b-[2px] transition-all">
                    OTRA RUTA
                </button>
                <button @click="closeTreasure" class="text-slate-400 py-2 font-bold text-xs tracking-widest hover:text-indigo-600 uppercase">VOLVER AL PORTAL</button>
            </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 🛡️ BLINDAJE TÉCNICO MASTER-CONTAINER v2.9.3 */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; touch-action: none !important; height: 100dvh; top: 0; left: 0; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; touch-action: none !important; -webkit-tap-highlight-color: transparent; width: 100vw; height: 100dvh; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); border: 8px solid white; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.2rem; height: 1.2rem; }
.btn-close-circle { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

/* --- 🗺️ MAPA DEL TESORO 3D CSS --- */
.map-3d-epic {
    position: relative;
    width: 110px;
    height: 110px;
    margin-bottom: 1.5rem;
    transform: rotateX(40deg) rotateZ(-15deg) rotateY(15deg);
    transform-style: preserve-3d;
}

.map-surface {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, #fef08a 0%, #facc15 100%);
    border: 4px solid #92400e;
    border-radius: 6px;
    box-shadow:
        -1px 1px 0px #78350f,
        -2px 2px 0px #78350f,
        -3px 3px 0px #78350f,
        -4px 4px 0px #78350f,
        -5px 5px 0px #78350f,
        -15px 15px 25px rgba(0,0,0,0.4);
    overflow: hidden;
    z-index: 5;
}

.map-scroll-top {
    position: absolute;
    top: -12px; left: -10px; right: -10px; height: 24px;
    background: linear-gradient(to bottom, #f59e0b, #b45309);
    border: 3px solid #78350f;
    border-radius: 12px;
    box-shadow: -4px 4px 0 #451a03;
    z-index: 10;
}

.map-scroll-bottom {
    position: absolute;
    bottom: -12px; left: -10px; right: -10px; height: 24px;
    background: linear-gradient(to top, #f59e0b, #b45309);
    border: 3px solid #78350f;
    border-radius: 12px;
    box-shadow: -4px 4px 0 #451a03;
    z-index: 10;
}

@keyframes mapDash {
    to { stroke-dashoffset: -20; }
}

.animate-map-dash {
    stroke-dashoffset: 0;
    animation: mapDash 1.5s linear infinite;
}

/* ------------------------------------- */

.mission-tag-surgical { background: #312e81; color: #fde047; padding: 6px 24px; border-radius: 9999px; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 2px; border: 2px solid #fde047; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }

.challenge-card-treasure-surgical { width: 100%; background: white; padding: 1.5rem; border-radius: 3rem; box-shadow: 0 20px 50px rgba(0,0,0,0.4); text-align: center; border-bottom: 8px solid #cbd5e1; }
.challenge-text-surgical { font-size: 5rem; font-weight: 900; color: #1e3a8a; margin-bottom: 1.5rem; letter-spacing: -3px; line-height: 1; }
.options-grid-surgical { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.btn-treasure-option-surgical { background: #f8fafc; border-bottom: 6px solid #cbd5e1; padding: 1.25rem 0; border-radius: 2rem; font-size: 2.5rem; font-weight: 900; color: #334155; transition: all 0.1s; }
.btn-treasure-option-surgical:active { transform: translateY(4px); border-bottom-width: 2px; }
.btn-treasure-option-surgical.is-wrong { background: #fee2e2; border-color: #f87171; color: #b91c1c; animation: shake 0.3s; }

.game-title { font-size: 2.5rem; letter-spacing: -0.05em; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.rules-panel { width: 92%; max-width: 400px; background: white; padding: 1.5rem; border-radius: 2rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #2563eb; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

.ship-container { position: relative; transition: transform 1.5s ease-in-out, opacity 1s; }
.ship-container.center { transform: translateX(0); opacity: 1; }
.ship-container.exit-left { transform: translateX(-600px); opacity: 0; }
.ship-container.off-screen-right { transform: translateX(600px); opacity: 0; transition: none !important; }

.smoke-v2 { position: absolute; width: 15px; height: 15px; background: rgba(255,255,255,0.7); border-radius: 50%; filter: blur(4px); opacity: 0; }
.s1 { animation: smokeMove 2s infinite; }
.s2 { animation: smokeMove 2s infinite 1s; }
@keyframes smokeMove { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translateY(-50px) scale(2); opacity: 0; } }

@keyframes foam { 0% { transform: translateX(-5%); } 100% { transform: translateX(5%); } }
.animate-foam { animation: foam 3s linear infinite alternate; }

@keyframes boat-float { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-10px) rotate(1deg); } }
.animate-boat-float { animation: boat-float 3s ease-in-out infinite; }

@keyframes flag-wave { 0% { transform: skewY(0); } 100% { transform: skewY(-12deg); } }
.animate-flag-wave { animation: flag-wave 1.2s ease-in-out infinite alternate; }

.prize-card-large { width: 90%; max-width: 320px; padding: 2.5rem 1rem; border-radius: 3rem; box-shadow: 0 15px 30px rgba(0,0,0,0.2); }
.victory-title { font-size: 2.2rem; text-shadow: 0 2px 4px white; }

.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-float { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }

.animate-island-pop { animation: island-pop 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes island-pop { from { transform: scale(0) rotate(-20deg); opacity: 0; } to { transform: scale(1) rotate(-4deg); opacity: 1; } }

@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>