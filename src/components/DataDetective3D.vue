<script setup>
/** * ARCHIVO: DataDetective3D.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v5.0.0 - MOTOR MATEMÁTICO INFINITO
 * LOGICA: Generación procedimental de (+, -, *, /) con inventario persistente.
 * DISEÑO: Fusión de frutas, Círculo Dorado y texto natural.
 */
import { ref, computed } from 'vue';
import { 
  X, Trophy, Apple, PlayCircle, CheckCircle2, XCircle, Medal, 
  ShoppingBasket, Citrus, Grape, Banana, ArrowBigDown, ArrowBigUp, RefreshCw
} from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

const emit = defineEmits(['close']);
const store = useGamificationStore();

// --- ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const currentQuestionIndex = ref(0);
const totalErrors = ref(0);
const hasAttempted = ref(false); 
const firstWrongChoice = ref(null);
const history = ref([]);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const actionParticles = ref([]); 
const fallingFruits = ref([]); 

// --- EFECTOS ESPECIALES ---
const showFusion = ref(false);
const fusionData = ref({ f1: null, f2: null, result: 0, pos1: 0, pos2: 0, c1: '', c2: '' });

// --- 📊 INVENTARIO PERSISTENTE (4 COLUMNAS) ---
const fruitData = ref([
    { fruit: 'Manzana', count: 6, color: 'bg-red-500', shadow: 'border-red-700', icon: Apple, hex: '#ef4444', pos: 20 },
    { fruit: 'Plátano', count: 5, color: 'bg-yellow-400', shadow: 'border-yellow-600', icon: Banana, hex: '#fbbf24', pos: 40 }, 
    { fruit: 'Naranja', count: 8, color: 'bg-orange-500', shadow: 'border-orange-700', icon: Citrus, hex: '#f97316', pos: 60 },
    { fruit: 'Uva', count: 4, color: 'bg-purple-500', shadow: 'border-purple-700', icon: Grape, hex: '#8b5cf6', pos: 80 },
]);

// --- 🧠 GENERADOR PROCEDIMENTAL DE RETOS ---
const currentQuestion = ref(null);

const generateNextQuestion = () => {
    const isMixed = Math.random() > 0.4; // 60% de retos mixtos
    const ops = ['add', 'sub', 'mult', 'div'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    let text, correct, options, prize, actions = [];
    const fIdx = Math.floor(Math.random() * 4);
    const fruit = fruitData.value[fIdx];

    if (!isMixed) {
        // --- 🍎 OPERACIÓN SIMPLE ---
        if (op === 'add') {
            const val = Math.floor(Math.random() * 5) + 2;
            text = `Tienes ${fruit.count} ${fruit.fruit.toLowerCase()}s. Si el Búho te regala ${val} más, ¿cuántas tienes ahora?`;
            correct = (fruit.count + val).toString();
            actions.push({ fruit: fruit.fruit, type: 'in', newCount: fruit.count + val });
            prize = 'copper';
        } else if (op === 'sub' && fruit.count > 3) {
            const val = Math.floor(Math.random() * 3) + 1;
            text = `Hay ${fruit.count} ${fruit.fruit.toLowerCase()}s. Si sacas ${val} para merendar, ¿cuántas quedan en el gráfico?`;
            correct = (fruit.count - val).toString();
            actions.push({ fruit: fruit.fruit, type: 'out', newCount: fruit.count - val });
            prize = 'silver';
        } else if (op === 'mult' && fruit.count < 6) {
            text = `¡Multiplicación! Si duplicas (x2) tu columna de ${fruit.fruit.toLowerCase()}s, ¿cuántas tendrás?`;
            correct = (fruit.count * 2).toString();
            actions.push({ fruit: fruit.fruit, type: 'in', newCount: fruit.count * 2 });
            prize = 'gold';
        } else {
            // División (Busca divisor exacto)
            const divisor = fruit.count % 2 === 0 ? 2 : (fruit.count % 3 === 0 ? 3 : 1);
            text = `Si repartes tus ${fruit.count} ${fruit.fruit.toLowerCase()}s en ${divisor} grupos iguales, ¿cuántas quedan en cada grupo?`;
            correct = (fruit.count / divisor).toString();
            actions.push({ fruit: fruit.fruit, type: 'out', newCount: fruit.count / divisor });
            prize = 'gold';
        }
    } else {
        // --- 🧺 OPERACIÓN MIXTA (FUSIÓN) ---
        const f2Idx = (fIdx + 1) % 4;
        const fruit2 = fruitData.value[f2Idx];
        
        text = `Mezcla: Si sumas las ${fruit.fruit.toLowerCase()}s (${fruit.count}) con las ${fruit2.fruit.toLowerCase()}s (${fruit2.count}), ¿cuál es el resultado total?`;
        correct = (fruit.count + fruit2.count).toString();
        actions.push({ fruit: fruit.fruit, type: 'logic', newCount: fruit.count });
        actions.push({ fruit: fruit2.fruit, type: 'logic', newCount: fruit2.count });
        
        fusionData.value = { 
            f1: fruit.icon, f2: fruit2.icon, c1: fruit.hex, c2: fruit2.hex,
            pos1: fruit.pos, pos2: fruit2.pos, result: correct 
        };
        prize = 'gold';
    }

    // Generar opciones coherentes
    const cInt = parseInt(correct);
    options = [correct, (cInt + 2).toString(), (cInt - 1 < 0 ? cInt + 4 : cInt - 1).toString()].sort(() => Math.random() - 0.5);
    currentQuestion.value = { text, correct, options, actions, prize, isMixed };
};

// --- 🎮 MOTOR DE ANIMACIÓN ---
const spawnParticles = (actions) => {
    actions.forEach((act) => {
        const f = fruitData.value.find(item => item.fruit === act.fruit);
        for (let i = 0; i < 6; i++) {
            actionParticles.value.push({ 
                id: Math.random(), icon: f.icon, color: f.hex, type: act.type, 
                left: f.pos + (Math.random() * 10 - 5), delay: i * 0.15
            });
        }
    });
    setTimeout(() => { actionParticles.value = []; }, 2200);
};

const checkAnswer = (answer) => {
    const isCorrect = (answer.toString() === currentQuestion.value.correct.toString());
    if (isCorrect) {
        new Audio('/audios/correct1.mp3').play().catch(() => {});
        sessionCoins.value[currentQuestion.value.prize] += 2;
        
        if (currentQuestion.value.isMixed) {
            showFusion.value = true;
            setTimeout(() => { showFusion.value = false; }, 2500);
        }

        spawnParticles(currentQuestion.value.actions);
        currentQuestion.value.actions.forEach(act => {
            const f = fruitData.value.find(item => item.fruit === act.fruit);
            f.count = act.newCount;
        });

        history.value.push({ 
            q: currentQuestion.value.text, chosen: hasAttempted.value ? firstWrongChoice.value : answer, 
            correct: currentQuestion.value.correct, isCorrect: !hasAttempted.value 
        });

        hasAttempted.value = false; firstWrongChoice.value = null; 
        setTimeout(() => {
            currentQuestionIndex.value++;
            if (currentQuestionIndex.value >= 10) endGame();
            else generateNextQuestion();
        }, 2200);
    } else {
        new Audio('/audios/wrong.mp3').play().catch(() => {});
        if (!hasAttempted.value) firstWrongChoice.value = answer;
        totalErrors.value++; hasAttempted.value = true;
    }
};

const startGame = () => {
    gameState.value = 'playing';
    currentQuestionIndex.value = 0; totalErrors.value = 0; history.value = [];
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    fruitData.value.forEach(f => f.count = Math.floor(Math.random() * 4) + 4);
    generateNextQuestion();
    speak("Iniciando simulador procedimental.");
};

const endGame = async () => {
    gameState.value = 'finished';
    new Audio('/audios/finish.mp3').play().catch(() => {});
    await store.processEndGameRewards(sessionCoins.value, totalErrors.value);
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-slate-50 shadow-smartphone overflow-hidden">
        
        <header v-if="gameState !== 'rules'" class="header-standard sticky top-0 z-50 shrink-0">
            <div class="trophy-section">
                <Trophy size="22" class="text-yellow-500" />
                <span class="text-xl font-black text-indigo-900">{{ (gameState === 'finished' ? 10 : currentQuestionIndex + 1) }}/10</span>
            </div>
            <div class="session-loot-capsule">
                <div class="loot-item"><img src="/images/coin-gold.png" class="w-5 h-5" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" class="w-5 h-5" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" class="w-5 h-5" /><span>{{ sessionCoins.copper }}</span></div>
            </div>
            <button @click="gameState = 'rules'" class="btn-close-circle"><RefreshCw size="18" class="text-red-500" /></button>
        </header>

        <div class="game-content flex-1 flex flex-col overflow-hidden relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-4 animate-fade-in relative">
                <button @click="emit('close')" class="absolute top-2 right-2 bg-slate-200/50 w-10 h-10 rounded-full flex items-center justify-center z-50"><X size="24" /></button>

                <div class="flex flex-col items-center mt-2">
                    <div class="bg-indigo-600 p-5 rounded-[2rem] shadow-[0_8px_0_rgb(30,27,75)] mb-3 border-4 border-indigo-400">
                        <ShoppingBasket size="50" class="text-white" />
                    </div>
                    <h1 class="game-title text-3xl italic font-black text-indigo-900 text-center leading-none">DETECTIVE FRUTAL</h1>
                </div>

                <div class="rules-panel shadow-2xl w-full max-w-[380px] !min-h-[260px]">
                    <div class="rules-badge uppercase font-black tracking-widest text-[10px]">Manual de Misión</div>
                    <ul class="p-4 space-y-3 text-slate-700 font-bold list-none text-[13px] leading-tight">
                        <li class="flex gap-2">📊 <span>10 retos de Suma, Resta, Mult. y División.</span></li>
                        <li class="flex gap-2">✨ <span>Efectos especiales al unir frutas mixtas.</span></li>
                        <li class="flex gap-2">🥇 <span>Gana botín diversificado por cada acierto.</span></li>
                        <li class="flex gap-2 text-red-600 bg-red-50 p-2 rounded-xl border border-red-100">
                            🚩 <span class="text-[10px] uppercase font-black">7+ errores reducen el premio al 50%.</span>
                        </li>
                    </ul>
                </div>

                <button @click="startGame" class="w-[90%] max-w-[300px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white font-black italic text-lg uppercase rounded-[2rem] border-b-[8px] border-[#1E3A8A] py-4 mb-2 flex items-center justify-center">
                    ¡ACTIVAR LUPA! <PlayCircle class="ml-2 text-white" size="24" />
                </button>
            </div>

            <div v-else-if="gameState === 'playing'" class="flex-1 flex flex-col animate-fade-in overflow-hidden relative">
                
                <div class="chart-area-3d flex-1 relative bg-white rounded-3xl border-4 border-slate-100 mx-2 mt-2 shadow-inner flex items-end justify-around pb-12 px-4 overflow-hidden">
                    
                    <div v-if="showFusion" class="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                        <div class="absolute animate-fuse-left" :style="{ left: fusionData.pos1 + '%', color: fusionData.c1 }"><component :is="fusionData.f1" size="45" /></div>
                        <div class="absolute animate-fuse-right" :style="{ left: fusionData.pos2 + '%', color: fusionData.c2 }"><component :is="fusionData.f2" size="45" /></div>
                        <div class="bg-yellow-400 w-24 h-24 rounded-full border-4 border-white shadow-2xl flex items-center justify-center animate-pop-result">
                            <span class="text-4xl font-black text-indigo-900">{{ fusionData.result }}</span>
                        </div>
                    </div>

                    <div v-for="p in actionParticles" :key="p.id" 
                         :class="['absolute z-[70] pointer-events-none', p.type === 'in' ? 'animate-direct-in' : 'animate-direct-out']" 
                         :style="{ left: p.left + '%', color: p.color, animationDelay: p.delay + 's' }">
                        <component :is="p.icon" size="38" class="drop-shadow-md" />
                    </div>

                    <div v-for="fruit in fruitData" :key="fruit.fruit" class="flex flex-col items-center group relative h-full justify-end w-full max-w-[65px]">
                        <span class="text-xs font-black text-indigo-900 mb-2 bg-indigo-50 px-2 rounded-md border border-indigo-100 z-10 transition-all duration-1000">{{ fruit.count }}</span>
                        <div :class="[fruit.color, fruit.shadow]" class="w-full rounded-t-xl border-b-[10px] transition-all duration-1000 ease-in-out shadow-xl flex flex-col items-center pt-3" :style="{ height: (fruit.count * 5.2) + '%' }">
                             <component :is="fruit.icon" size="28" class="text-white drop-shadow-md" />
                        </div>
                        <span class="text-[10px] font-black text-slate-400 mt-2 uppercase text-center">{{ fruit.fruit }}</span>
                    </div>
                    <div class="absolute bottom-10 left-4 right-4 h-1.5 bg-slate-200 rounded-full"></div>
                </div>

                <div class="ui-area shrink-0 p-4 bg-white border-t-2 border-slate-100">
                    <div class="question-box bg-blue-50 rounded-3xl p-5 mb-4 border-2 border-blue-100 text-center flex items-center justify-center min-h-[110px]">
                        <p class="text-[17px] font-bold text-indigo-900 leading-tight italic">
                            {{ currentQuestion.text }}
                        </p>
                    </div>
                    <div class="grid grid-cols-3 gap-3 pb-2">
                        <button v-for="option in currentQuestion.options" :key="option" @click="checkAnswer(option)" 
                                class="rounded-2xl py-6 text-xl font-black bg-blue-500 text-white shadow-[0_6px_0_rgb(29,78,216)] active:translate-y-[4px] px-2">
                                {{ option }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col p-4 bg-slate-50 h-full overflow-hidden">
                <div class="text-center mb-2 shrink-0"><Medal size="45" class="text-yellow-500 mx-auto mb-1" /><h2 class="text-2xl font-black text-indigo-900 uppercase italic">¡Simulación Lista!</h2></div>
                <div class="flex-1 bg-white rounded-3xl border-2 border-slate-200 shadow-inner p-4 my-2 overflow-y-auto">
                    <div v-for="(item, idx) in history" :key="idx" class="flex flex-col py-3 border-b border-slate-50 last:border-0 px-2 font-black">
                        <div class="flex items-center justify-between font-bold text-slate-800"><span class="text-sm">{{ idx + 1 }}. {{ item.q }} = <span :class="item.isCorrect ? 'text-green-600' : 'text-red-500'">{{ item.chosen }}</span></span><CheckCircle2 v-if="item.isCorrect" class="text-green-500 shrink-0" size="22" /><XCircle v-else class="text-red-500 shrink-0" size="22" /></div>
                        <div v-if="!item.isCorrect" class="mt-1.5 ml-8 text-sm flex items-center gap-2"><span class="text-slate-900 italic">Correcto</span><span class="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">({{ item.correct }})</span></div>
                    </div>
                </div>
                <div class="flex gap-4 pb-8 mt-2 shrink-0">
                    <button @click="emit('close')" class="flex-1 bg-slate-200 text-slate-700 font-black py-4 rounded-2xl uppercase text-xs shadow-[0_5px_0_rgb(203,213,225)]">PORTAL</button>
                    <button @click="startGame" class="flex-[2] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white font-black py-4 rounded-2xl border-b-[8px] border-[#1E3A8A] shadow-lg italic text-xs uppercase">VOLVER A JUGAR</button>
                </div>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; width: 100vw; height: 100dvh; display: flex; justify-content: center; align-items: center; background-color: #ffffff; z-index: 9999; overflow: hidden; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; width: 100vw; height: 100dvh; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.15); } }
.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.25rem; height: 1.25rem; }
.btn-close-circle { background: #fee2e2; color: #ef4444; border-radius: 9999px; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; }

/* 🍎 ANIMACIONES DE FUSIÓN Y PARTÍCULAS */
.animate-fuse-left { animation: fuseLeft 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards; top: 35%; }
@keyframes fuseLeft { 0% { transform: scale(1); opacity: 1; } 100% { left: 50% !important; transform: scale(1.5) translateX(-50%); opacity: 0; } }

.animate-fuse-right { animation: fuseRight 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards; top: 35%; }
@keyframes fuseRight { 0% { transform: scale(1); opacity: 1; } 100% { left: 50% !important; transform: scale(1.5) translateX(-50%); opacity: 0; } }

.animate-pop-result { animation: popResult 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; position: absolute; top: 30%; z-index: 110; }
@keyframes popResult { 0% { transform: scale(0); opacity: 0; } 20% { transform: scale(1.1); opacity: 1; } 85% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }

.animate-direct-in { animation: directIn 1.8s forwards; position: absolute; top: 15%; }
@keyframes directIn { 0% { transform: translateY(-200px) scale(0); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 0; } }

.animate-direct-out { animation: directOut 1.8s forwards; position: absolute; bottom: 20%; }
@keyframes directOut { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-250px) scale(0); opacity: 0; } }

.rules-panel { min-height: 260px; background: white; padding: 1rem; border-radius: 2rem; border: 3px solid #e2e8f0; position: relative; display: flex; flex-direction: column; }
.chart-area-3d { background-image: linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px); background-size: 30px 30px; }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>