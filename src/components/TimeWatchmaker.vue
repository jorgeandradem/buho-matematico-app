<script setup>
/** * ARCHIVO: TimeWatchmaker.vue
 * NOTA INTERNA: v5.2 - ICONO 3D CSS + OPTIMIZACIÓN TÁCTIL
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Trophy, Clock, CheckCircle2, PlayCircle,
  Moon, Sun, RefreshCw, Medal, X, Volume2
} from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';

const emit = defineEmits(['close']);
const store = useGamificationStore();

// --- 🔊 MOTOR DE VOZ UNIFICADO ---
const speak = (text, mood = 'intro') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    if (mood === 'gold') { utterance.pitch = 1.4; utterance.rate = 1.1; }
    else if (mood === 'silver') { utterance.pitch = 1.0; utterance.rate = 1.0; }
    else if (mood === 'copper') { utterance.pitch = 0.8; utterance.rate = 0.9; }
    else { utterance.pitch = 1.1; utterance.rate = 1.0; }
    window.speechSynthesis.speak(utterance);
};

const vocalizeRules = () => {
    speak("¡Bienvenido al taller del Relojero! Ajusta las manecillas para que coincidan con la hora digital. La manecilla azul mueve a la roja como un reloj real. ¡Logra el ajuste perfecto!");
};

// --- ESTADO DEL JUEGO ---
const gameState = ref('rules');
const currentQuestionIndex = ref(0);
const totalErrors = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const showCoinRain = ref(false);

const targetTime = ref({ hours: 0, minutes: 0 });
const clockRef = ref(null);
const isDragging = ref(null);

const totalUserMinutes = ref(180);
const lastAngle = ref(0);

const userHours = computed(() => Math.floor(totalUserMinutes.value / 60) % 12);
const userMinutes = computed(() => Math.round(totalUserMinutes.value % 60));

const handleBackSurgical = () => {
    if (gameState.value === 'playing' || gameState.value === 'finished') {
        gameState.value = 'rules';
    } else {
        emit('close');
    }
};

const generateChallenge = () => {
    const h = Math.floor(Math.random() * 24);
    const m = [0, 15, 30, 45, 10, 20, 40, 50][Math.floor(Math.random() * 8)];
    targetTime.value = { hours: h, minutes: m };
    totalUserMinutes.value = (Math.floor(Math.random() * 12) * 60) + (Math.floor(Math.random() * 12) * 5);
};

const getAngleFromEvent = (e) => {
    if (!clockRef.value) return 0;
    const rect = clockRef.value.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    let degrees = angle * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
};

const handleStartDrag = (type, e) => {
    isDragging.value = type;
    lastAngle.value = getAngleFromEvent(e);
};

const handleMove = (e) => {
    if (!isDragging.value) return;
    const currentAngle = getAngleFromEvent(e);
    let delta = currentAngle - lastAngle.value;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    if (isDragging.value === 'minute') {
        totalUserMinutes.value = (totalUserMinutes.value + (delta / 6) + 720) % 720;
    } else if (isDragging.value === 'hour') {
        totalUserMinutes.value = (totalUserMinutes.value + (delta * 2) + 720) % 720;
    }
    lastAngle.value = currentAngle;
};

const stopDragging = () => {
    isDragging.value = null;
    totalUserMinutes.value = Math.round(totalUserMinutes.value);
};

const minuteStyle = computed(() => ({ transform: `rotate(${totalUserMinutes.value * 6}deg)` }));
const hourStyle = computed(() => ({ transform: `rotate(${totalUserMinutes.value * 0.5}deg)` }));

const isDay = computed(() => targetTime.value.hours >= 6 && targetTime.value.hours < 18);

const checkTime = () => {
    const currentH12 = userHours.value === 0 ? 12 : userHours.value;
    const targetH12 = (targetTime.value.hours % 12) === 0 ? 12 : (targetTime.value.hours % 12);
    const minuteDiff = Math.abs(userMinutes.value - targetTime.value.minutes);
    const isCorrect = currentH12 === targetH12 && minuteDiff <= 2;

    if (isCorrect) {
        new Audio('/audios/correct1.mp3').play().catch(() => {});
        sessionCoins.value.silver += 2;
        speak("¡Excelente! Ajuste de precisión completado.", "silver");
        store.updateMissionProgress('time_watchmaker_solve', 1);
        if (currentQuestionIndex.value < 9) {
            setTimeout(() => { currentQuestionIndex.value++; generateChallenge(); }, 1500);
        } else { setTimeout(endGame, 1500); }
    } else {
        new Audio('/audios/wrong.mp3').play().catch(() => {});
        totalErrors.value++;
        speak("Revisa los engranajes.", "copper");
    }
};

const startGame = () => {
    gameState.value = 'playing';
    currentQuestionIndex.value = 0;
    totalErrors.value = 0;
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    showCoinRain.value = false;
    generateChallenge();
};

const endGame = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    new Audio('/audios/finish.mp3').play().catch(() => {});
    speak(`¡Misión lograda! Has ganado un botín de plata.`, 'gold');
    await store.processEndGameRewards({ ...sessionCoins.value }, totalErrors.value);
};

onMounted(() => { if (gameState.value === 'rules') vocalizeRules(); });
onUnmounted(() => { window.speechSynthesis.cancel(); });
</script>

<template>
  <div class="master-container font-inter select-none overflow-hidden">
    <main class="app-canvas shadow-2xl" :class="isDay ? 'bg-amber-50' : 'bg-slate-900'">
        
        <CoinRain v-if="showCoinRain" type="silver" :count="30" class="z-50" />

        <header v-if="gameState !== 'rules'" class="header-standard shrink-0" :class="isDay ? 'bg-white border-b' : 'bg-slate-800 text-white border-slate-700'">
            <div class="flex items-center gap-3">
                <div class="bg-amber-100 p-1.5 rounded-lg border border-amber-200">
                    <Trophy size="18" class="text-amber-600" />
                </div>
                <span class="text-lg font-black tracking-tighter">RETOS: {{ currentQuestionIndex + 1 }}/10</span>
            </div>

            <div class="session-loot-capsule" :class="!isDay ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'">
                <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x px-2"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>

            <button @click="handleBackSurgical" class="btn-exit-surgical"><X size="20" stroke-width="3" /></button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between py-6 w-full max-w-[400px] animate-fade-in z-10 overflow-y-auto">
                <button @click="handleBackSurgical" class="absolute top-4 right-4 bg-white rounded-full p-2 text-blue-950 shadow-lg"><X size="28" stroke-width="3"/></button>

                <div class="flex flex-col items-center mt-4">
                    <div class="pocket-watch-3d animate-watch-float mb-6">
                        <div class="watch-crown"></div>
                        <div class="watch-case">
                            <div class="watch-dial">
                                <div class="watch-hand h-hour"></div>
                                <div class="watch-hand h-minute"></div>
                                <div class="watch-center"></div>
                            </div>
                        </div>
                    </div>
                    <h1 class="game-title text-5xl font-black text-amber-900 italic uppercase tracking-tighter text-center">El Relojero</h1>
                </div>

                <div class="rules-panel shadow-2xl bg-white w-full border-4 border-amber-200 relative mt-6 shrink-0">
                    <button @click="vocalizeRules" class="absolute top-2 right-2 bg-amber-600 text-white p-2 rounded-full border-2 border-white z-20"><Volume2 size="20" /></button>
                    
                    <div class="rules-badge">MANUAL DE INGENIERÍA</div>

                    <ul class="p-6 pt-12 space-y-4 text-slate-700 font-bold text-sm leading-tight list-none">
                        <li>🕰️ Mira la hora digital y ajusta las manecillas mecánicas.</li>
                        <li>⚙️ Engranajes Reales: La manecilla azul mueve a la roja.</li>
                        <li>🔎 Usa la lupa inteligente para máxima precisión.</li>
                    </ul>
                </div>

                <div class="w-full flex flex-col gap-2 mt-6">
                    <button @click="startGame" class="btn-main-wide">¡COMENZAR TURNO! <PlayCircle class="ml-2" /></button>
                </div>
            </div>

            <div v-else-if="gameState === 'playing'" class="flex-1 w-full flex flex-col items-center justify-around animate-fade-in z-10 overflow-hidden">
                <div class="mission-card border-4 shrink-0" :class="isDay ? 'bg-white border-amber-200' : 'bg-slate-800 border-slate-700 text-white'">
                    <h2 class="text-6xl font-mono font-black text-amber-500 drop-shadow-sm">
                        {{ targetTime.hours.toString().padStart(2, '0') }}:{{ targetTime.minutes.toString().padStart(2, '0') }}
                    </h2>
                    <div class="flex items-center justify-center gap-2 mt-2 bg-slate-100/50 rounded-full py-1 px-3">
                        <Sun v-if="isDay" size="14" class="text-yellow-500" />
                        <Moon v-else size="14" class="text-indigo-400" />
                        <span class="text-[9px] font-black uppercase tracking-widest">{{ isDay ? 'Día' : 'Noche' }}</span>
                    </div>
                </div>

                <div class="relative w-80 h-80 sm:w-[400px] sm:h-[400px] flex items-center justify-center shrink-0 my-4"
                     @mousemove="handleMove" @touchmove.prevent="handleMove"
                     @mouseup="stopDragging" @touchend="stopDragging">
                    
                    <div ref="clockRef" class="clock-face relative w-full h-full rounded-full border-[16px] border-amber-900 shadow-[0_25px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div v-for="n in 12" :key="'ext-'+n" class="absolute inset-0 flex justify-center items-start pt-4 pointer-events-none" :style="{ transform: `rotate(${n * 30}deg)` }">
                            <span class="text-3xl font-black text-amber-950" :style="{ transform: `rotate(-${n * 30}deg)` }">{{ n }}</span>
                        </div>
                        <div v-for="n in 12" :key="'int-'+n" class="absolute inset-0 flex justify-center items-start pt-16 pointer-events-none" :style="{ transform: `rotate(${n * 30}deg)` }">
                            <span class="text-sm font-black text-amber-700/60" :style="{ transform: `rotate(-${n * 30}deg)` }">{{ n + 12 === 24 ? '00' : n + 12 }}</span>
                        </div>
                        
                        <div class="hand hour-hand touch-zone" :style="hourStyle" @mousedown="handleStartDrag('hour', $event)" @touchstart.stop="handleStartDrag('hour', $event)">
                            <div class="hour-body shadow-lg"></div>
                        </div>
                        <div class="hand minute-hand touch-zone" :style="minuteStyle" @mousedown="handleStartDrag('minute', $event)" @touchstart.stop="handleStartDrag('minute', $event)">
                            <div class="minute-body shadow-lg"></div>
                        </div>

                        <div class="center-nut"></div>
                    </div>
                </div>

                <button @click="checkTime" class="btn-check-wide">VALIDAR <CheckCircle2 class="ml-2" /></button>
            </div>

            <div v-else class="flex flex-col items-center text-center animate-fade-in w-full max-w-[340px] z-10">
                <Medal size="100" class="text-yellow-500 mb-4 drop-shadow-2xl animate-bounce" />
                <h2 class="text-4xl font-black text-amber-900 uppercase">Maestro Relojero</h2>
                <div class="bg-white w-full p-8 rounded-[2.5rem] shadow-2xl mt-6 border-4 border-amber-100">
                    <div class="flex justify-around items-center w-full">
                        <div class="flex flex-col items-center"><img src="/images/coin-gold.png" class="w-10 h-10 mb-1" /><span class="text-2xl font-black text-amber-600">+{{ sessionCoins.gold }}</span></div>
                        <div class="flex flex-col items-center border-x border-slate-200 px-6"><img src="/images/coin-silver.png" class="w-12 h-12 mb-1" /><span class="text-4xl font-black text-slate-800">+{{ sessionCoins.silver }}</span></div>
                        <div class="flex flex-col items-center"><img src="/images/coin-copper.png" class="w-10 h-10 mb-1" /><span class="text-2xl font-black text-orange-600">+{{ sessionCoins.copper }}</span></div>
                    </div>
                </div>
                <div class="w-full flex flex-col gap-2 mt-8">
                    <button @click="startGame" class="btn-main-wide">NUEVA JORNADA</button>
                    <button @click="emit('close')" class="text-slate-400 font-black text-xs uppercase tracking-widest py-2 text-center">Volver al Portal</button>
                </div>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; z-index: 9999; overflow: hidden; touch-action: none !important; }
.app-canvas { width: 100vw; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; position: relative; transition: background 1s ease; touch-action: none !important; -webkit-tap-highlight-color: transparent; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 40px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1.25rem; z-index: 100; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 20px; border-radius: 9999px; border: 2px solid #f1f5f9; }
.loot-item { display: flex; align-items: center; gap: 6px; font-weight: 900; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.btn-exit-surgical { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fca5a5; }

/* 🌟 ICONO PORTADA 3D CSS */
.pocket-watch-3d { position: relative; width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.3)); }
.watch-crown { position: absolute; top: -10px; width: 24px; height: 15px; background: linear-gradient(to right, #854d0e, #eab308, #854d0e); border-radius: 4px; border: 2px solid #451a03; z-index: 1; }
.watch-case { 
    width: 120px; height: 120px; border-radius: 50%; 
    background: radial-gradient(circle at 30% 30%, #fde047, #ca8a04 60%, #854d0e); 
    border: 5px solid #451a03; 
    box-shadow: inset -4px -4px 10px rgba(0,0,0,0.5), inset 4px 4px 10px rgba(255,255,255,0.6);
    display: flex; align-items: center; justify-content: center;
    position: relative;
}
.watch-dial { 
    width: 95px; height: 95px; border-radius: 50%; 
    background: #fdfbf7; 
    border: 2px solid #a16207; 
    box-shadow: inset 0 4px 10px rgba(0,0,0,0.15);
    position: relative;
}
.watch-hand { position: absolute; bottom: 50%; left: 50%; transform-origin: bottom center; border-radius: 99px; }
.h-hour { width: 5px; height: 25px; background: #1e293b; transform: rotate(45deg); margin-left: -2.5px; }
.h-minute { width: 3px; height: 38px; background: #b91c1c; transform: rotate(150deg); margin-left: -1.5px; }
.watch-center { position: absolute; inset: 0; margin: auto; width: 8px; height: 8px; background: #451a03; border-radius: 50%; }

.animate-watch-float { animation: watchFloat 4s ease-in-out infinite; }
@keyframes watchFloat { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-15px) rotate(2deg); } }

/* RESTO DEL RELOJ JUEGO */
.clock-face { background: #fdfbf7; box-shadow: inset 0 0 30px rgba(0,0,0,0.1); }
.hand { position: absolute; bottom: 50%; left: 50%; transform-origin: bottom center; z-index: 80; cursor: grab; touch-action: none; }
.touch-zone { padding-left: 45px; padding-right: 45px; padding-bottom: 20px; touch-action: none; }
.hour-hand { width: 100px; height: 28%; margin-left: -50px; }
.hour-body { width: 16px; height: 100%; margin: 0 auto; background: linear-gradient(to right, #ef4444, #991b1b); border-radius: 10px; border: 2px solid #7f1d1d; }
.minute-hand { width: 90px; height: 42%; margin-left: -45px; }
.minute-body { width: 10px; height: 100%; margin: 0 auto; background: linear-gradient(to right, #3b82f6, #1e3a8a); border-radius: 10px; border: 2px solid #1e3a8a; }

.center-nut { position: absolute; inset: 0; margin: auto; width: 2rem; height: 2rem; background-color: #451a03; border-radius: 50%; border: 4px solid #fbbf24; z-index: 70; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

.mission-card { padding: 1.5rem 2.5rem; border-radius: 2rem; text-align: center; box-shadow: 0 15px 30px rgba(0,0,0,0.15); }
.btn-main-wide { background: linear-gradient(to bottom, #d97706, #92400e); color: white; padding: 1.4rem; border-radius: 2.5rem; border-bottom: 8px solid #78350f; font-size: 1.2rem; font-weight: 900; text-transform: uppercase; width: 100%; display: flex; align-items: center; justify-content: center; }
.btn-check-wide { background: linear-gradient(to bottom, #10b981, #065f46); color: white; padding: 1.4rem; border-radius: 2.5rem; border-bottom: 8px solid #064e3b; font-size: 1.2rem; font-weight: 900; text-transform: uppercase; width: 100%; max-width: 380px; display: flex; align-items: center; justify-content: center; }

.btn-main-wide:active, .btn-check-wide:active { transform: translateY(4px); border-bottom-width: 4px; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.rules-panel { width: 100%; background: white; padding: 1rem; border-radius: 1.75rem; border: 4px solid #fde68a; position: relative; overflow: visible; }
.rules-badge { position: absolute; top: 8px; left: 1.5rem; background: #4f46e5; color: white; font-size: 13px; font-weight: 900; padding: 8px 18px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.03em; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 30; }
</style>