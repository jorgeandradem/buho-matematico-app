<script setup>
/** * ARCHIVO: TimeWatchmaker.vue
 * NOTA INTERNA: ESTRUCTURA v1.3.2 - FIX CONTRASTE DINÁMICO (X REACCIONARIA)
 * LOGICA: Movimiento radial + Snapping + Inversión de color en Header.
 * DISEÑO: Steampunk 2D con visibilidad garantizada en ciclo Día/Noche.
 */
import { ref, computed, onMounted } from 'vue';
import { 
  Trophy, Clock, CheckCircle2, PlayCircle, 
  Moon, Sun, RefreshCw, Medal, X
} from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

const emit = defineEmits(['close']);
const store = useGamificationStore();

// --- ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const currentQuestionIndex = ref(0);
const totalErrors = ref(0);
const sessionCoins = ref({ silver: 0 });
const showCoinRain = ref(false);

const targetTime = ref({ hours: 0, minutes: 0 });
const userHours = ref(3);
const userMinutes = ref(0);
const isDragging = ref(null); 
const clockRef = ref(null);

const generateChallenge = () => {
    const h = Math.floor(Math.random() * 24);
    const m = [0, 15, 30, 45, 10, 20, 40, 50][Math.floor(Math.random() * 8)];
    targetTime.value = { hours: h, minutes: m };
    userHours.value = (h + 5) % 12;
    userMinutes.value = (m + 30) % 60;
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

const handleMove = (e) => {
    if (!isDragging.value) return;
    const degrees = getAngleFromEvent(e);
    if (isDragging.value === 'minute') {
        userMinutes.value = Math.round(degrees / 6) % 60;
    } else if (isDragging.value === 'hour') {
        userHours.value = Math.round(degrees / 30) % 12;
    }
};

const stopDragging = () => { isDragging.value = null; };

const minuteStyle = computed(() => ({ transform: `rotate(${userMinutes.value * 6}deg)` }));
const hourStyle = computed(() => {
    const extra = (userMinutes.value / 60) * 30;
    return { transform: `rotate(${(userHours.value % 12) * 30 + extra}deg)` };
});

const isDay = computed(() => targetTime.value.hours >= 6 && targetTime.value.hours < 18);

// --- 🎮 MOTOR DE VALIDACIÓN ---
const checkTime = () => {
    const isCorrect = (userHours.value % 12) === (targetTime.value.hours % 12) && 
                      userMinutes.value === targetTime.value.minutes;

    if (isCorrect) {
        new Audio('/audios/correct1.mp3').play().catch(() => {});
        sessionCoins.value.silver += 2;
        speak("¡Ajuste perfecto!");
        
        if (currentQuestionIndex.value < 9) {
            setTimeout(() => {
                currentQuestionIndex.value++;
                generateChallenge();
            }, 1200);
        } else {
            setTimeout(endGame, 1200);
        }
    } else {
        new Audio('/audios/wrong.mp3').play().catch(() => {});
        totalErrors.value++;
        speak("Ajusta los engranajes.");
    }
};

const startGame = () => {
    gameState.value = 'playing';
    currentQuestionIndex.value = 0;
    totalErrors.value = 0;
    sessionCoins.value.silver = 0;
    showCoinRain.value = false;
    generateChallenge();
};

const endGame = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    new Audio('/audios/finish.mp3').play().catch(() => {});
    await store.processEndGameRewards({ silver: sessionCoins.value.silver }, totalErrors.value);
};
</script>

<template>
  <div class="master-container font-inter select-none overflow-hidden">
    <CoinRain v-if="showCoinRain" type="silver" :count="30" />

    <main class="app-canvas shadow-2xl" :class="isDay ? 'bg-amber-50' : 'bg-slate-900'">
        
        <header v-if="gameState !== 'rules'" class="header-standard transition-all duration-700" :class="isDay ? 'bg-white border-b' : 'bg-slate-800 text-white border-slate-700'">
            <div class="flex items-center gap-3">
                <div class="bg-amber-100 p-1.5 rounded-lg border border-amber-200">
                    <Trophy size="18" class="text-amber-600" />
                </div>
                <span class="text-lg font-black tracking-tighter">RETOS: {{ currentQuestionIndex + 1 }}/10</span>
            </div>

            <div class="session-loot-capsule shadow-inner" :class="!isDay ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'">
                <img src="/images/coin-silver.png" class="w-5 h-5 drop-shadow-sm" />
                <span class="text-xl font-black">{{ sessionCoins.silver }}</span>
            </div>

            <button @click="emit('close')" 
                    :class="['w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-75 transition-all', 
                             isDay ? 'bg-slate-100 text-slate-600' : 'bg-white text-blue-950']">
                <X size="20" stroke-width="3" />
            </button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-center p-4 relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between py-6 w-full max-w-[400px]">
                
                <button @click="emit('close')" 
                        class="absolute top-4 right-4 bg-white rounded-full p-2.5 text-blue-950 shadow-lg active:scale-90 transition-all z-10">
                    <X size="28"/>
                </button>

                <div class="flex flex-col items-center mt-4">
                    <div class="bg-amber-600 p-6 rounded-[2.5rem] shadow-[0_10px_0_rgb(146,64,14)] border-4 border-amber-400">
                        <Clock size="60" class="text-white drop-shadow-lg" />
                    </div>
                    <h1 class="text-4xl font-black text-amber-900 mt-5 italic uppercase tracking-tighter">El Relojero</h1>
                    <p class="text-amber-700 font-bold text-xs uppercase tracking-widest opacity-80">Mantenimiento Temporal</p>
                </div>

                <div class="rules-panel shadow-2xl bg-white w-full border-4 border-amber-200 relative overflow-hidden">
                    <div class="bg-amber-600 text-white text-[10px] font-black py-1 px-4 absolute top-0 left-0 rounded-br-xl uppercase">Manual de Ingeniería</div>
                    <ul class="p-6 pt-10 space-y-4 text-slate-700 font-bold text-sm leading-tight list-none">
                        <li class="flex gap-4">🕰️ <span>Mira la <b>hora digital</b> y ajusta las manecillas mecánicas.</span></li>
                        <li class="flex gap-4">⚙️ <span>Arrastra la <b>Manecilla Roja</b> para las Horas y la <b>Azul</b> para Minutos.</span></li>
                        <li class="flex gap-4">🥈 <span>Cada turno perfecto otorga <b>2 Monedas de Plata</b>.</span></li>
                        <li class="flex gap-4 text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100">🚩 <span>7+ errores reducen el botín a la mitad.</span></li>
                    </ul>
                </div>

                <button @click="startGame" class="w-full btn-main-steampunk">
                    ¡COMENZAR TURNO! <PlayCircle class="ml-2" />
                </button>
            </div>

            <div v-else-if="gameState === 'playing'" class="flex-1 w-full flex flex-col items-center justify-around animate-fade-in">
                
                <div class="mission-card border-4" :class="isDay ? 'bg-white border-amber-200' : 'bg-slate-800 border-slate-700 text-white'">
                    <p class="text-[10px] uppercase font-black opacity-50 tracking-widest mb-1">Ajustar a:</p>
                    <h2 class="text-6xl font-mono font-black text-amber-600">
                        {{ targetTime.hours.toString().padStart(2, '0') }}:{{ targetTime.minutes.toString().padStart(2, '0') }}
                    </h2>
                    <div class="flex items-center justify-center gap-2 mt-2 bg-slate-100/50 rounded-full py-1 px-3">
                        <Sun v-if="isDay" size="14" class="text-yellow-500" />
                        <Moon v-else size="14" class="text-indigo-400" />
                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-500">{{ isDay ? 'Día' : 'Noche' }}</span>
                    </div>
                </div>

                <div class="relative w-72 h-72 sm:w-[350px] sm:h-[350px] flex items-center justify-center"
                     @mousemove="handleMove" @touchmove="handleMove"
                     @mouseup="stopDragging" @touchend="stopDragging">
                    
                    <div ref="clockRef" class="clock-face relative w-full h-full rounded-full border-[12px] border-amber-900 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden">
                        
                        <div v-for="n in 12" :key="'h12-'+n" 
                             class="absolute inset-0 flex justify-center items-start pt-5" 
                             :style="{ transform: `rotate(${n * 30}deg)` }">
                            <span class="text-3xl font-black text-amber-900" :style="{ transform: `rotate(-${n * 30}deg)` }">{{ n }}</span>
                        </div>

                        <div v-for="n in 12" :key="'h24-'+n" 
                             class="absolute inset-0 flex justify-center items-start pt-16" 
                             :style="{ transform: `rotate(${n * 30}deg)` }">
                            <span class="text-xs font-black text-slate-400 opacity-60" :style="{ transform: `rotate(-${n * 30}deg)` }">
                                {{ n + 12 === 24 ? '00' : n + 12 }}
                            </span>
                        </div>

                        <div class="hand hour-hand" :style="hourStyle" @mousedown="isDragging = 'hour'" @touchstart="isDragging = 'hour'">
                            <div class="hour-body shadow-lg"></div>
                        </div>
                        <div class="hand minute-hand" :style="minuteStyle" @mousedown="isDragging = 'minute'" @touchstart="isDragging = 'minute'">
                            <div class="minute-body shadow-lg"></div>
                        </div>

                        <div class="absolute inset-0 m-auto w-8 h-8 bg-amber-950 rounded-full border-4 border-amber-400 z-50 shadow-md"></div>
                    </div>
                </div>

                <button @click="checkTime" class="btn-check-steampunk">
                    VALIDAR ENGRANAJES <CheckCircle2 class="ml-2" />
                </button>
            </div>

            <div v-else class="flex flex-col items-center text-center animate-fade-in w-full max-w-[340px]">
                <Medal size="90" class="text-yellow-500 mb-4 drop-shadow-xl animate-bounce" />
                <h2 class="text-4xl font-black text-amber-900 italic tracking-tighter uppercase">Maestro del Tiempo</h2>
                
                <div class="bg-white w-full p-8 rounded-[2.5rem] shadow-2xl mt-6 border-4 border-amber-100">
                    <p class="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Botín de Plata</p>
                    <div class="flex items-center justify-center gap-3">
                        <img src="/images/coin-silver.png" class="w-12 h-12" />
                        <span class="text-6xl font-black text-slate-800">{{ sessionCoins.silver }}</span>
                    </div>
                </div>
                
                <button @click="startGame" class="mt-8 w-full btn-main-steampunk">NUEVA JORNADA</button>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; display: flex; justify-content: center; align-items: center; background: #fff; z-index: 9999; }
.app-canvas { width: 100vw; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; position: relative; transition: background 1s ease; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 40px; border: 8px solid white; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1.25rem; }
.session-loot-capsule { display: flex; align-items: center; gap: 8px; padding: 6px 20px; border-radius: 9999px; border: 2px solid rgba(0,0,0,0.05); }

.clock-face { background: radial-gradient(circle, #fff 0%, #fff9c4 100%); }
.hand { position: absolute; bottom: 50%; left: 50%; transform-origin: bottom center; z-index: 40; cursor: grab; transition: transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1); }

.hour-hand { width: 14px; height: 24%; margin-left: -7px; }
.hour-body { width: 100%; height: 100%; background: linear-gradient(to right, #ef4444, #991b1b); border-radius: 20px 20px 5px 5px; border: 2px solid #7f1d1d; }

.minute-hand { width: 8px; height: 40%; margin-left: -4px; }
.minute-body { width: 100%; height: 100%; background: linear-gradient(to right, #3b82f6, #1e3a8a); border-radius: 20px 20px 5px 5px; border: 2px solid #1e3a8a; }

.mission-card { padding: 1.2rem 2.5rem; border-radius: 2rem; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.btn-main-steampunk { background: linear-gradient(to bottom, #d97706, #92400e); color: white; padding: 1.25rem; border-radius: 2rem; border-bottom: 8px solid #78350f; font-weight: 900; text-transform: uppercase; display: flex; align-items: center; justify-content: center; }
.btn-check-steampunk { background: linear-gradient(to bottom, #10b981, #065f46); color: white; padding: 1.2rem 2.5rem; border-radius: 2rem; border-bottom: 8px solid #064e3b; font-weight: 900; text-transform: uppercase; display: flex; align-items: center; justify-content: center; }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>