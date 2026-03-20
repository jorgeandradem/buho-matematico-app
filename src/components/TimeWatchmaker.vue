<script setup>
/** * ARCHIVO: TimeWatchmaker.vue
 * NOTA INTERNA: EL RELOJERO - ESTRUCTURA v4.0 - RELOJ 3D HIPERREALISTA
 * LOGICA: Movimiento radial + Snapping + Conexión a Store + CSS Expandido
 * DISEÑO: Steampunk 2D/3D con visibilidad garantizada. Cristal Elevado y Hitbox Extremo.
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
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
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
        
        store.updateMissionProgress('time_watchmaker_solve', 1);

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
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    showCoinRain.value = false;
    generateChallenge();
};

const endGame = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    new Audio('/audios/finish.mp3').play().catch(() => {});
    
    // Conexión al Store
    await store.processEndGameRewards({ ...sessionCoins.value }, totalErrors.value);
};

const handleClose = () => {
    emit('close');
};
</script>

<template>
  <div class="master-container font-inter select-none overflow-hidden">
    <CoinRain v-if="showCoinRain" type="silver" :count="30" />

    <main class="app-canvas shadow-2xl" :class="isDay ? 'bg-amber-50' : 'bg-slate-900'">
        
        <header v-if="gameState !== 'rules'" class="header-standard transition-all duration-700 shrink-0" :class="isDay ? 'bg-white border-b' : 'bg-slate-800 text-white border-slate-700'">
            <div class="flex items-center gap-3">
                <div class="bg-amber-100 p-1.5 rounded-lg border border-amber-200">
                    <Trophy size="18" class="text-amber-600" />
                </div>
                <span class="text-lg font-black tracking-tighter" :class="!isDay ? 'text-white' : ''">RETOS: {{ currentQuestionIndex + 1 }}/10</span>
            </div>

            <div class="session-loot-capsule shadow-inner" :class="!isDay ? 'bg-slate-700 border-slate-600' : 'bg-slate-50'">
                <div class="loot-item">
                    <img src="/images/coin-gold.png" />
                    <span :class="isDay ? 'text-slate-800' : 'text-white'">{{ sessionCoins.gold }}</span>
                </div>
                <div class="loot-item border-x" :class="isDay ? 'border-slate-200' : 'border-slate-600'">
                    <img src="/images/coin-silver.png" />
                    <span :class="isDay ? 'text-slate-800' : 'text-white'">{{ sessionCoins.silver }}</span>
                </div>
                <div class="loot-item">
                    <img src="/images/coin-copper.png" />
                    <span :class="isDay ? 'text-slate-800' : 'text-white'">{{ sessionCoins.copper }}</span>
                </div>
            </div>

            <button @click="handleClose" 
                    :class="['w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-75 transition-all', 
                             isDay ? 'bg-slate-100 text-slate-600' : 'bg-white text-blue-950']">
                <X size="20" stroke-width="3" />
            </button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between py-6 w-full max-w-[400px] z-10 overflow-y-auto">
                
                <button @click="handleClose" 
                        class="absolute top-4 right-4 bg-white rounded-full p-2.5 text-blue-950 shadow-lg active:scale-90 transition-all z-20">
                    <X size="28" stroke-width="3"/>
                </button>

                <div class="flex flex-col items-center mt-4">
                    
                    <div class="pocket-watch-3d animate-watch-float mb-4 drop-shadow-2xl">
                        <div class="watch-crown">
                           <div class="watch-ring"></div>
                        </div>
                        <div class="watch-case">
                            <div class="watch-dial">
                                <div class="watch-gear g1"></div>
                                <div class="watch-gear g2"></div>
                                <div class="watch-hand h-hour"></div>
                                <div class="watch-hand h-minute"></div>
                                <div class="watch-center-pin"></div>
                            </div>
                            <div class="watch-glass">
                                <div class="glass-reflection-watch"></div>
                            </div>
                        </div>
                    </div>

                    <h1 class="text-5xl font-black text-amber-900 italic uppercase tracking-tighter drop-shadow-md text-center">El Relojero</h1>
                    <p class="text-amber-700 font-bold text-xs uppercase tracking-widest opacity-80 mt-1 text-center">Mantenimiento Temporal</p>
                </div>

                <div class="rules-panel shadow-2xl bg-white w-full border-4 border-amber-200 relative overflow-hidden mt-6 shrink-0">
                    <div class="bg-amber-600 text-white text-[10px] font-black py-1 px-4 absolute top-0 left-0 rounded-br-xl uppercase">Manual de Ingeniería</div>
                    <ul class="p-6 pt-10 space-y-4 text-slate-700 font-bold text-sm leading-tight list-none">
                        <li class="flex gap-4">🕰️ <span>Mira la <b>hora digital</b> y ajusta las manecillas mecánicas.</span></li>
                        <li class="flex gap-4">⚙️ <span>Arrastra la <b>Manecilla Roja</b> para las Horas y la <b>Azul</b> para Minutos.</span></li>
                        <li class="flex gap-4">🥈 <span>Cada turno perfecto otorga <b>2 Monedas de Plata</b>.</span></li>
                        <li class="flex gap-4 text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100">🚩 <span>7+ errores reducen el botín a la mitad.</span></li>
                    </ul>
                </div>

                <button @click="startGame" class="w-full btn-main-steampunk mt-6 shrink-0">
                    ¡COMENZAR TURNO! <PlayCircle class="ml-2" />
                </button>
            </div>

            <div v-else-if="gameState === 'playing'" class="flex-1 w-full flex flex-col items-center justify-around animate-fade-in z-10 overflow-hidden">
                
                <div class="mission-card border-4 shrink-0" :class="isDay ? 'bg-white border-amber-200' : 'bg-slate-800 border-slate-700 text-white'">
                    <p class="text-[10px] uppercase font-black opacity-50 tracking-widest mb-1">Ajustar a:</p>
                    <h2 class="text-6xl font-mono font-black text-amber-500 drop-shadow-sm">
                        {{ targetTime.hours.toString().padStart(2, '0') }}:{{ targetTime.minutes.toString().padStart(2, '0') }}
                    </h2>
                    <div class="flex items-center justify-center gap-2 mt-2 bg-slate-100/50 rounded-full py-1 px-3">
                        <Sun v-if="isDay" size="14" class="text-yellow-500" />
                        <Moon v-else size="14" class="text-indigo-400" />
                        <span class="text-[9px] font-black uppercase tracking-widest" :class="isDay ? 'text-amber-700' : 'text-slate-300'">{{ isDay ? 'Día' : 'Noche' }}</span>
                    </div>
                </div>

                <div class="relative w-72 h-72 sm:w-[350px] sm:h-[350px] flex items-center justify-center shrink-0 my-4 mx-auto"
                     @mousemove="handleMove" @touchmove.prevent="handleMove"
                     @mouseup="stopDragging" @touchend="stopDragging" @mouseleave="stopDragging">
                    
                    <div ref="clockRef" class="clock-face relative w-full h-full rounded-full border-[14px] border-amber-900 shadow-[0_25px_50px_rgba(0,0,0,0.4)] overflow-hidden">
                        
                        <div v-for="n in 12" :key="'h12-'+n" 
                             class="absolute inset-0 flex justify-center items-start pt-5 pointer-events-none" 
                             :style="{ transform: `rotate(${n * 30}deg)` }">
                            <span class="text-3xl font-black text-amber-950 drop-shadow-sm" :style="{ transform: `rotate(-${n * 30}deg)` }">{{ n }}</span>
                        </div>

                        <div v-for="n in 12" :key="'h24-'+n" 
                             class="absolute inset-0 flex justify-center items-start pt-16 pointer-events-none" 
                             :style="{ transform: `rotate(${n * 30}deg)` }">
                            <span class="text-xs font-black text-amber-700/60" :style="{ transform: `rotate(-${n * 30}deg)` }">
                                {{ n + 12 === 24 ? '00' : n + 12 }}
                            </span>
                        </div>

                        <div class="hand hour-hand touch-zone" :style="hourStyle" @mousedown="isDragging = 'hour'" @touchstart.stop="isDragging = 'hour'">
                            <div class="hour-body shadow-lg"></div>
                        </div>
                        <div class="hand minute-hand touch-zone" :style="minuteStyle" @mousedown="isDragging = 'minute'" @touchstart.stop="isDragging = 'minute'">
                            <div class="minute-body shadow-lg"></div>
                        </div>

                        <div class="absolute inset-0 m-auto w-8 h-8 bg-amber-950 rounded-full border-4 border-amber-400 z-50 shadow-md pointer-events-none"></div>
                        
                        <div class="glass-dome absolute inset-0 rounded-full pointer-events-none z-[60]"></div>
                    </div>
                </div>

                <button @click="checkTime" class="btn-check-steampunk w-full max-w-[350px] shrink-0 mx-auto">
                    VALIDAR ENGRANAJES <CheckCircle2 class="ml-2" />
                </button>
            </div>

            <div v-else class="flex flex-col items-center text-center animate-fade-in w-full max-w-[340px] z-10 overflow-y-auto h-full justify-center">
                <Medal size="100" class="text-yellow-500 mb-4 drop-shadow-2xl animate-bounce shrink-0" />
                <h2 class="text-4xl font-black text-amber-900 italic tracking-tighter uppercase shrink-0" :class="!isDay ? 'text-amber-400' : ''">Maestro del Tiempo</h2>
                
                <div class="bg-white w-full p-8 rounded-[2.5rem] shadow-2xl mt-6 border-4 border-amber-100 shrink-0">
                    <p class="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4">Botín Obtenido</p>
                    <div class="flex justify-around items-center w-full">
                        <div class="flex flex-col items-center">
                            <img src="/images/coin-gold.png" class="w-10 h-10 mb-1 drop-shadow-md" />
                            <span class="text-2xl font-black text-amber-600">+{{ sessionCoins.gold }}</span>
                        </div>
                        <div class="flex flex-col items-center border-x border-slate-200 px-6">
                            <img src="/images/coin-silver.png" class="w-12 h-12 mb-1 drop-shadow-md" />
                            <span class="text-4xl font-black text-slate-800">+{{ sessionCoins.silver }}</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <img src="/images/coin-copper.png" class="w-10 h-10 mb-1 drop-shadow-md" />
                            <span class="text-2xl font-black text-orange-600">+{{ sessionCoins.copper }}</span>
                        </div>
                    </div>
                </div>
                
                <button @click="startGame" class="mt-8 w-full btn-main-steampunk shrink-0">NUEVA JORNADA</button>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
.master-container { 
    position: fixed; 
    inset: 0; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    background: #fff; 
    z-index: 9999; 
}

.app-canvas { 
    width: 100vw; 
    height: 100dvh; 
    display: flex; 
    flex-direction: column; 
    overflow: hidden; 
    position: relative; 
    transition: background 1s ease; 
    touch-action: none; 
}

@media (min-width: 1025px) { 
    .app-canvas { 
        width: 1024px; 
        height: 90dvh; 
        border-radius: 40px; 
        border: 8px solid white; 
    } 
}

.header-standard { 
    width: 100%; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0.8rem 1.25rem; 
    z-index: 100; 
}

.session-loot-capsule { 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    padding: 6px 20px; 
    border-radius: 9999px; 
    border: 2px solid rgba(0,0,0,0.05); 
}

.loot-item { 
    display: flex; 
    align-items: center; 
    gap: 6px; 
    padding: 0 8px; 
    font-weight: 900; 
}

.loot-item img { 
    width: 1.2rem; 
    height: 1.2rem; 
    object-fit: contain; 
}

/* --- 🕰️ RELOJ 3D CSS HIPERREALISTA (PORTADA) --- */
.pocket-watch-3d {
  position: relative;
  width: 140px;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.watch-crown {
  width: 24px;
  height: 16px;
  background: linear-gradient(90deg, #b45309, #fde047, #b45309);
  border-radius: 4px 4px 0 0;
  border: 2px solid #78350f;
  position: relative;
  z-index: 2;
  margin-bottom: -2px;
}

.watch-ring {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border: 4px solid #facc15;
  border-radius: 50%;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(0,0,0,0.3);
}

.watch-case {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fef08a, #ca8a04 60%, #713f12 100%);
  border: 4px solid #451a03;
  box-shadow: inset -5px -5px 15px rgba(0,0,0,0.4), inset 5px 5px 15px rgba(255,255,255,0.6), 0 15px 25px rgba(0,0,0,0.4);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.watch-dial {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #fdfbf7;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
  border: 2px solid #a16207;
  position: relative;
  overflow: hidden;
}

/* Engranajes de fondo (Simulados) */
.watch-gear { 
    position: absolute; 
    border-radius: 50%; 
    border: 4px dashed #94a3b8; 
    background: transparent; 
    opacity: 0.3; 
}

.g1 { 
    width: 50px; 
    height: 50px; 
    top: 10px; 
    left: 10px; 
    animation: spin 10s linear infinite; 
}

.g2 { 
    width: 40px; 
    height: 40px; 
    bottom: 10px; 
    right: 10px; 
    animation: spin-reverse 8s linear infinite; 
}

@keyframes spin { 
    100% { transform: rotate(360deg); } 
}

@keyframes spin-reverse { 
    100% { transform: rotate(-360deg); } 
}

/* Manecillas Portada */
.watch-hand { 
    position: absolute; 
    bottom: 50%; 
    left: 50%; 
    transform-origin: bottom center; 
    border-radius: 2px; 
    box-shadow: 2px 2px 4px rgba(0,0,0,0.3); 
}

.h-hour { 
    width: 6px; 
    height: 30px; 
    margin-left: -3px; 
    background: #1e293b; 
    transform: rotate(45deg); 
}

.h-minute { 
    width: 4px; 
    height: 45px; 
    margin-left: -2px; 
    background: #b91c1c; 
    transform: rotate(120deg); 
}

.watch-center-pin { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%); 
    width: 10px; 
    height: 10px; 
    background: #facc15; 
    border-radius: 50%; 
    border: 2px solid #713f12; 
    z-index: 10; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.4); 
}

.watch-glass {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(ellipse at 40% 20%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 40%);
  box-shadow: inset -5px -5px 15px rgba(0,0,0,0.2);
  z-index: 5;
  pointer-events: none;
}

.animate-watch-float { 
    animation: watchFloat 4s ease-in-out infinite; 
}

@keyframes watchFloat {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}

/* ------------------------------------------- */

/* JUEGO: Reloj Jugable y Lente de Cristal */
.clock-face { 
    background: #fdfbf7;
}

/* 🌟 Cristal Convexo Mejorado (Lupa Elevada) */
.glass-dome {
    box-shadow: 
        inset 0px 40px 40px -20px rgba(255, 255, 255, 0.8), /* Brillo curvo superior muy duro */
        inset 0px -20px 40px -10px rgba(0, 0, 0, 0.5),     /* Sombra profunda inferior */
        inset -20px 0px 30px -15px rgba(0, 0, 0, 0.2);     /* Profundidad lateral */
    background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%);
    border: 1px solid rgba(255,255,255,0.3); /* Borde de cristal brillante */
}

.hand { 
    position: absolute; 
    bottom: 50%; 
    left: 50%; 
    transform-origin: bottom center; 
    z-index: 40; 
    cursor: grab; 
    transition: transform 0.1s cubic-bezier(0.1, 0.5, 0.1, 1); 
}

/* 🎯 Zonas de Captura Táctil EXTREMAS (Hitboxes invisibles para máxima sensibilidad) */
.touch-zone {
    /* Padding enorme e invisible para capturar el dedo fácilmente */
    padding-left: 40px;
    padding-right: 40px;
    padding-bottom: 20px; /* Captura por debajo del centro también */
    /* Anulamos comportamientos nativos que interfieren con el arrastre */
    touch-action: none;
    user-select: none;
}

/* Compensamos el padding extremo en el layout para que visualmente siga igual */
.hour-hand { 
    width: 94px; 
    height: 26%; 
    margin-left: -47px; 
} 

.hour-body { 
    width: 14px; 
    height: 100%; 
    margin: 0 auto; 
    background: linear-gradient(to right, #ef4444, #991b1b); 
    border-radius: 20px 20px 5px 5px; 
    border: 2px solid #7f1d1d; 
}

.minute-hand { 
    width: 88px; 
    height: 42%; 
    margin-left: -44px; 
}

.minute-body { 
    width: 8px; 
    height: 100%; 
    margin: 0 auto; 
    background: linear-gradient(to right, #3b82f6, #1e3a8a); 
    border-radius: 20px 20px 5px 5px; 
    border: 2px solid #1e3a8a; 
}

.mission-card { 
    padding: 1.5rem 2.5rem; 
    border-radius: 2rem; 
    text-align: center; 
    box-shadow: 0 15px 30px rgba(0,0,0,0.15); 
}

.btn-main-steampunk { 
    background: linear-gradient(to bottom, #d97706, #92400e); 
    color: white; 
    padding: 1.4rem; 
    border-radius: 2.5rem; 
    border-bottom: 8px solid #78350f; 
    font-size: 1.2rem; 
    font-weight: 900; 
    text-transform: uppercase; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    box-shadow: 0 10px 20px rgba(146,64,14,0.3); 
    transition: 0.1s; 
    cursor: pointer; 
}

.btn-main-steampunk:active { 
    transform: translateY(4px); 
    border-bottom-width: 4px; 
}

.btn-check-steampunk { 
    background: linear-gradient(to bottom, #10b981, #065f46); 
    color: white; 
    padding: 1.4rem 2.5rem; 
    border-radius: 2.5rem; 
    border-bottom: 8px solid #064e3b; 
    font-size: 1.2rem; 
    font-weight: 900; 
    text-transform: uppercase; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    box-shadow: 0 10px 20px rgba(6,78,59,0.3); 
    transition: 0.1s; 
    cursor: pointer; 
    width: 90%; 
    max-width: 350px;
}

.btn-check-steampunk:active { 
    transform: translateY(4px); 
    border-bottom-width: 4px; 
}

.animate-fade-in { 
    animation: fadeIn 0.4s ease-out forwards; 
}

@keyframes fadeIn { 
    from { opacity: 0; transform: translateY(10px); } 
    to { opacity: 1; transform: translateY(0); } 
}
</style>