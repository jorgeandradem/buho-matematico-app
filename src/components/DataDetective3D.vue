<script setup>
/** * ARCHIVO: DataDetective3D.vue
 * NOTA INTERNA: COSECHA MÁGICA - ESTRUCTURA MAESTRA v6.5.0
 * LOGICA: Generación procedimental 100% única (10 escenarios distintos por partida).
 * DISEÑO: X homologada, Cesta 3D CSS, Fusión, Lluvia Mágica Final.
 */
import { ref, computed } from 'vue';
import { 
  X, Trophy, PlayCircle, CheckCircle2, XCircle, Medal,
  // 16 ICONOS 100% ESTÁNDAR Y SEGUROS
  Apple, Banana, Citrus, Grape, Heart, Droplet, Star, Leaf, 
  Sun, Cloud, Flame, Snowflake, Coffee, Gem, Clover, Zap
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
const showInTable = ref(false);

// --- FEEDBACK DE BOTONES ---
const selectedWrong = ref([]);
const selectedCorrect = ref(null);

// --- EFECTOS ESPECIALES Y LLUVIA ---
const showFusion = ref(false);
const fusionData = ref({ f1: null, f2: null, result: 0, pos1: 0, pos2: 0, c1: '', c2: '' });
const showRain = ref(false);
const rainDrops = ref([]);

// --- 🍎 PISCINA MAESTRA DE 16 ELEMENTOS NATURALES/MÁGICOS ---
const allFruits = [
    { fruit: 'Manzana', plural: 'manzanas', color: 'bg-red-500', shadow: 'border-red-700', icon: Apple, hex: '#ef4444' },
    { fruit: 'Plátano', plural: 'plátanos', color: 'bg-yellow-400', shadow: 'border-yellow-600', icon: Banana, hex: '#fbbf24' }, 
    { fruit: 'Naranja', plural: 'naranjas', color: 'bg-orange-500', shadow: 'border-orange-700', icon: Citrus, hex: '#f97316' },
    { fruit: 'Uva', plural: 'uvas', color: 'bg-purple-500', shadow: 'border-purple-700', icon: Grape, hex: '#8b5cf6' },
    { fruit: 'Fresa', plural: 'fresas', color: 'bg-pink-500', shadow: 'border-pink-700', icon: Heart, hex: '#ec4899' },
    { fruit: 'Pera', plural: 'peras', color: 'bg-lime-500', shadow: 'border-lime-700', icon: Droplet, hex: '#84cc16' },
    { fruit: 'Carambolo', plural: 'carambolos', color: 'bg-yellow-300', shadow: 'border-yellow-500', icon: Star, hex: '#fde047' },
    { fruit: 'Menta', plural: 'hojas de menta', color: 'bg-emerald-500', shadow: 'border-emerald-700', icon: Leaf, hex: '#10b981' },
    { fruit: 'Limón', plural: 'limones radiantes', color: 'bg-yellow-500', shadow: 'border-yellow-700', icon: Sun, hex: '#eab308' },
    { fruit: 'Algodón', plural: 'algodones de azúcar', color: 'bg-blue-300', shadow: 'border-blue-500', icon: Cloud, hex: '#93c5fd' },
    { fruit: 'Chile', plural: 'chiles picantes', color: 'bg-red-600', shadow: 'border-red-800', icon: Flame, hex: '#dc2626' },
    { fruit: 'Cereza Helada', plural: 'cerezas heladas', color: 'bg-cyan-400', shadow: 'border-cyan-600', icon: Snowflake, hex: '#22d3ee' },
    { fruit: 'Café', plural: 'granos de café', color: 'bg-amber-800', shadow: 'border-amber-950', icon: Coffee, hex: '#92400e' },
    { fruit: 'Zarzamora', plural: 'zarzamoras', color: 'bg-fuchsia-600', shadow: 'border-fuchsia-800', icon: Gem, hex: '#c026d3' },
    { fruit: 'Trébol', plural: 'tréboles dulces', color: 'bg-green-500', shadow: 'border-green-700', icon: Clover, hex: '#22c55e' },
    { fruit: 'Guaraná', plural: 'bayas de guaraná', color: 'bg-orange-600', shadow: 'border-orange-800', icon: Zap, hex: '#ea580c' }
];

const fruitData = ref([]);
const questionScenarios = ref([]);

// --- 🎧 SISTEMA CENTRALIZADO DE AUDIO ---
const playSound = (type) => {
    const sounds = {
        correct: '/audios/correct1.mp3',
        error: '/audios/wrong.mp3',
        coins: '/audios/coins.mp3',
        finish: '/audios/finish.mp3'
    };
    if (sounds[type]) {
        const audio = new Audio(sounds[type]);
        audio.play().catch(() => {});
    }
};

// --- ❌ NAVEGACIÓN HOMOLOGADA QUIRÚRGICA ---
const handleCloseSurgical = () => {
    if (gameState.value === 'playing' || gameState.value === 'finished') {
        gameState.value = 'rules';
    } else {
        emit('close');
    }
};

// --- ✨ LLUVIA MÁGICA FINAL ---
const triggerRain = () => {
    const drops = [];
    for (let i = 0; i < 40; i++) {
        const randomFruit = allFruits[Math.floor(Math.random() * allFruits.length)];
        drops.push({
            id: i,
            icon: randomFruit.icon,
            color: randomFruit.hex,
            left: Math.random() * 100, // Posición horizontal aleatoria (0-100%)
            delay: Math.random() * 1.5, // Retraso inicial para que no caigan todas a la vez
            duration: Math.random() * 2 + 2.5, // Velocidad de caída entre 2.5s y 4.5s
            size: Math.random() * 20 + 20 // Tamaño entre 20 y 40px
        });
    }
    rainDrops.value = drops;
    showRain.value = true;
    setTimeout(() => { showRain.value = false; }, 5000); // La lluvia dura 5 segundos
};

// --- 🧠 GENERADOR PROCEDIMENTAL DE RETOS UNICOS ---
const currentQuestion = ref(null);

const generateNextQuestion = () => {
    selectedWrong.value = [];
    selectedCorrect.value = null;

    const qType = questionScenarios.value[currentQuestionIndex.value];
    let text, correct, prize, options, isMixed = false, actions = [];

    const getValidFruit = (condition) => {
        const valid = fruitData.value.filter(condition);
        return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : fruitData.value[Math.floor(Math.random() * 4)];
    };

    if (qType === 'add1') {
        const fruit = getValidFruit(f => f.count <= 15);
        const val = Math.floor(Math.random() * 4) + 2;
        text = `Tienes ${fruit.count} ${fruit.plural}. Si el Búho te regala ${val} más, ¿cuántas tienes ahora?`;
        correct = (fruit.count + val).toString();
        actions.push({ fruit: fruit.fruit, type: 'in', newCount: fruit.count + val });
        prize = 'copper';
    } 
    else if (qType === 'add2') {
        const fruit = getValidFruit(f => f.count <= 15);
        const val = Math.floor(Math.random() * 3) + 2;
        text = `Explorando el bosque encontraste ${val} ${fruit.plural} extra. Si tenías ${fruit.count}, ¿cuál es el total?`;
        correct = (fruit.count + val).toString();
        actions.push({ fruit: fruit.fruit, type: 'in', newCount: fruit.count + val });
        prize = 'copper';
    }
    else if (qType === 'sub1') {
        const fruit = getValidFruit(f => f.count >= 3);
        const val = Math.floor(Math.random() * 2) + 1;
        text = `Hay ${fruit.count} ${fruit.plural}. Si sacas ${val} de la cesta, ¿cuántas quedan en el gráfico?`;
        correct = (fruit.count - val).toString();
        actions.push({ fruit: fruit.fruit, type: 'out', newCount: fruit.count - val });
        prize = 'silver';
    }
    else if (qType === 'sub2') {
        const fruit = getValidFruit(f => f.count >= 4);
        const val = Math.floor(Math.random() * 3) + 1;
        text = `Un travieso mapache se llevó ${val} de tus ${fruit.count} ${fruit.plural}. ¿Cuántas te quedan a salvo?`;
        correct = (fruit.count - val).toString();
        actions.push({ fruit: fruit.fruit, type: 'out', newCount: fruit.count - val });
        prize = 'silver';
    }
    else if (qType === 'mult1') {
        const fruit = getValidFruit(f => f.count <= 8);
        text = `¡Magia! Si duplicas (x2) tu columna de ${fruit.plural} (${fruit.count}), ¿cuántas tendrás en total?`;
        correct = (fruit.count * 2).toString();
        actions.push({ fruit: fruit.fruit, type: 'in', newCount: fruit.count * 2 });
        prize = 'gold';
    }
    else if (qType === 'mult2') {
        const fruit = getValidFruit(f => f.count <= 5);
        if (fruit.count <= 5) {
            text = `¡Doble poción! Un hechizo triplica (x3) tus ${fruit.count} ${fruit.plural}. ¿Cuál es el nuevo total?`;
            correct = (fruit.count * 3).toString();
            actions.push({ fruit: fruit.fruit, type: 'in', newCount: fruit.count * 3 });
        } else {
            text = `Al clonar (x2) perfectamente tus ${fruit.count} ${fruit.plural}, ¿cuántas obtienes?`;
            correct = (fruit.count * 2).toString();
            actions.push({ fruit: fruit.fruit, type: 'in', newCount: fruit.count * 2 });
        }
        prize = 'gold';
    }
    else if (qType === 'div1') {
        const fruit = getValidFruit(f => f.count % 2 === 0 || f.count % 3 === 0);
        const divisor = fruit.count % 2 === 0 ? 2 : (fruit.count % 3 === 0 ? 3 : 1);
        if (divisor > 1) {
            text = `Si repartes equitativamente tus ${fruit.count} ${fruit.plural} en ${divisor} canastas, ¿cuántas quedan en cada una?`;
            correct = (fruit.count / divisor).toString();
            actions.push({ fruit: fruit.fruit, type: 'out', newCount: fruit.count / divisor });
        } else {
            text = `Tienes ${fruit.count} ${fruit.plural} y decides usar 1. ¿Cuántas quedan?`;
            correct = (fruit.count - 1).toString();
            actions.push({ fruit: fruit.fruit, type: 'out', newCount: fruit.count - 1 });
        }
        prize = 'gold';
    }
    else if (qType === 'div2') {
        const fruit = getValidFruit(f => f.count % 2 === 0);
        if(fruit.count % 2 === 0) {
            text = `¡Qué generoso! Decides regalar exactamente la mitad de tus ${fruit.count} ${fruit.plural}. ¿Cuántas te sobran?`;
            correct = (fruit.count / 2).toString();
            actions.push({ fruit: fruit.fruit, type: 'out', newCount: fruit.count / 2 });
        } else {
            text = `Decides donar 2 de tus ${fruit.count} ${fruit.plural}. ¿Cuántas te quedan ahora?`;
            correct = (fruit.count - 2).toString();
            actions.push({ fruit: fruit.fruit, type: 'out', newCount: fruit.count - 2 });
        }
        prize = 'gold';
    }
    else if (qType === 'mix1' || qType === 'mix2') {
        isMixed = true;
        const mixIndices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
        const fruit1 = fruitData.value[mixIndices[0]];
        const fruit2 = fruitData.value[mixIndices[1]];

        if (qType === 'mix1') {
            text = `Mezcla: Si sumas las ${fruit1.plural} (${fruit1.count}) con las ${fruit2.plural} (${fruit2.count}), ¿cuál es el resultado?`;
        } else {
            text = `¡Cosecha gigante! ¿Cuántos elementos hay en total si juntas la columna de ${fruit1.plural} (${fruit1.count}) y la de ${fruit2.plural} (${fruit2.count})?`;
        }
        correct = (fruit1.count + fruit2.count).toString();
        actions.push({ fruit: fruit1.fruit, type: 'logic', newCount: fruit1.count });
        actions.push({ fruit: fruit2.fruit, type: 'logic', newCount: fruit2.count });
        
        fusionData.value = { 
            f1: fruit1.icon, f2: fruit2.icon, c1: fruit1.hex, c2: fruit1.hex,
            pos1: fruit1.pos, pos2: fruit2.pos, result: correct 
        };
        prize = 'gold';
    }

    const cInt = parseInt(correct);
    let opt2 = cInt + Math.floor(Math.random() * 3) + 1;
    let opt3 = cInt - Math.floor(Math.random() * 2) - 1;
    if (opt3 < 0) opt3 = cInt + 4; 
    if (opt2 === opt3) opt3 += 2;
    
    options = [correct, opt2.toString(), opt3.toString()].sort(() => Math.random() - 0.5);
    currentQuestion.value = { text, correct, options, actions, prize, isMixed };
};

// --- 🎮 MOTOR DE ANIMACIÓN Y COMPROBACIÓN ---
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
    if (showInTable.value || selectedWrong.value.includes(answer)) return; 
    
    const isCorrect = (answer.toString() === currentQuestion.value.correct.toString());
    
    if (isCorrect) {
        playSound('correct');
        selectedCorrect.value = answer; 
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

        hasAttempted.value = false; 
        firstWrongChoice.value = null; 
        showInTable.value = true; 

        setTimeout(() => {
            showInTable.value = false;
            currentQuestionIndex.value++;
            if (currentQuestionIndex.value >= 10) endGame();
            else generateNextQuestion();
        }, 2200);
    } else {
        playSound('error');
        selectedWrong.value.push(answer); 
        if (!hasAttempted.value) firstWrongChoice.value = answer;
        totalErrors.value++; 
        hasAttempted.value = true;
    }
};

const startGame = () => {
    gameState.value = 'playing';
    currentQuestionIndex.value = 0; 
    totalErrors.value = 0; 
    history.value = [];
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    showInTable.value = false;
    showRain.value = false;
    
    const shuffledFruits = [...allFruits].sort(() => Math.random() - 0.5).slice(0, 4);
    fruitData.value = shuffledFruits.map((item, index) => ({
        ...item,
        count: Math.floor(Math.random() * 4) + 4,
        pos: 20 + (index * 20)
    }));

    questionScenarios.value = ['add1', 'add2', 'sub1', 'sub2', 'mult1', 'mult2', 'div1', 'div2', 'mix1', 'mix2']
                              .sort(() => Math.random() - 0.5);

    generateNextQuestion();
    speak("Iniciando simulador procedimental.");
};

const endGame = async () => {
    gameState.value = 'finished';
    playSound('finish');
    triggerRain(); // <-- ACTIVAR LA LLUVIA MÁGICA
    await store.processEndGameRewards(sessionCoins.value, totalErrors.value);
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-slate-50 shadow-smartphone overflow-hidden">
        
        <header class="header-standard shrink-0" :class="{ '!bg-transparent !border-transparent': gameState === 'rules' }">
            
            <div class="trophy-section" :style="{ visibility: gameState !== 'rules' ? 'visible' : 'hidden' }">
                <Trophy size="22" class="text-yellow-500" />
                <span class="text-xl font-black text-indigo-900">{{ (gameState === 'finished' ? 10 : currentQuestionIndex + 1) }}/10</span>
            </div>
            
            <div class="session-loot-capsule" :style="{ visibility: gameState !== 'rules' ? 'visible' : 'hidden' }">
                <div class="loot-item"><img src="/images/coin-gold.png" class="w-5 h-5" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" class="w-5 h-5" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" class="w-5 h-5" /><span>{{ sessionCoins.copper }}</span></div>
            </div>
            
            <button @click="handleCloseSurgical" class="btn-close-circle">
                <X size="24" stroke-width="3" />
            </button>
        </header>

        <div class="game-content flex-1 flex flex-col overflow-hidden relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-start p-4 animate-fade-in relative -mt-8 gap-6">
                
                <div class="flex flex-col items-center mt-2">
                    <div class="basket-container animate-float-slow">
                        <div class="fruit-apple"></div>
                        <div class="fruit-orange"></div>
                        <div class="fruit-grape"></div>
                        <div class="basket-back"></div>
                        <div class="basket-front"></div>
                        <div class="basket-rim"></div>
                    </div>

                    <h1 class="game-title text-4xl italic font-black text-indigo-900 text-center leading-none mt-2 drop-shadow-sm">COSECHA<br/><span class="text-orange-500">MÁGICA</span></h1>
                </div>

                <div class="rules-panel shadow-2xl w-full max-w-[380px] !min-h-[220px]">
                    <div class="rules-badge uppercase font-black tracking-widest text-[10px]">Manual de Misión</div>
                    <ul class="p-4 space-y-3 text-slate-700 font-bold list-none text-[13px] leading-tight mt-2">
                        <li class="flex gap-2">📊 <span>10 retos de Suma, Resta, Mult. y División.</span></li>
                        <li class="flex gap-2">✨ <span>Elementos y combinaciones nuevas cada partida.</span></li>
                        <li class="flex gap-2">🥇 <span>Gana botín diversificado por cada acierto.</span></li>
                        <li class="flex gap-2 text-red-600 bg-red-50 p-2 rounded-xl border border-red-100 mt-2">
                            🚩 <span class="text-[10px] uppercase font-black">7+ errores reducen el premio al 50%.</span>
                        </li>
                    </ul>
                </div>

                <button @click="startGame" class="w-[90%] max-w-[300px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white font-black italic text-xl uppercase rounded-[2rem] border-b-[8px] border-[#1E3A8A] py-5 mb-2 flex items-center justify-center shadow-xl active:translate-y-[4px] active:border-b-[4px] transition-all">
                    ¡A COSECHAR! <PlayCircle class="ml-2 text-white" size="26" />
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
                        <span class="text-[10px] font-black text-slate-400 mt-2 uppercase text-center leading-none">{{ fruit.fruit }}</span>
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
                                :disabled="showInTable || selectedWrong.includes(option)"
                                :class="[
                                    'rounded-2xl py-6 text-xl font-black text-white active:translate-y-[4px] px-2 transition-all duration-300 ease-out',
                                    selectedCorrect === option ? 'bg-green-500 shadow-[0_6px_0_rgb(21,128,61)] scale-105' : 
                                    selectedWrong.includes(option) ? 'bg-red-500 shadow-[0_6px_0_rgb(153,27,27)] opacity-50 scale-95 cursor-not-allowed' : 
                                    'bg-blue-500 shadow-[0_6px_0_rgb(29,78,216)] hover:bg-blue-400 hover:shadow-[0_4px_0_rgb(29,78,216)]'
                                ]">
                                {{ option }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col p-4 bg-slate-50 h-full overflow-hidden relative">
                
                <div v-if="showRain" class="absolute inset-0 pointer-events-none z-[100] overflow-hidden">
                    <div v-for="drop in rainDrops" :key="drop.id" 
                         class="absolute animate-magic-fall"
                         :style="{ 
                             left: drop.left + '%', 
                             color: drop.color, 
                             animationDelay: drop.delay + 's', 
                             animationDuration: drop.duration + 's' 
                         }">
                        <component :is="drop.icon" :size="drop.size" class="drop-shadow-lg" />
                    </div>
                </div>

                <div class="text-center mb-2 shrink-0 relative z-10"><Medal size="45" class="text-yellow-500 mx-auto mb-1" /><h2 class="text-2xl font-black text-indigo-900 uppercase italic">¡Cosecha Lista!</h2></div>
                <div class="flex-1 bg-white rounded-3xl border-2 border-slate-200 shadow-inner p-4 my-2 overflow-y-auto relative z-10">
                    <div v-for="(item, idx) in history" :key="idx" class="flex flex-col py-3 border-b border-slate-50 last:border-0 px-2 font-black">
                        <div class="flex items-center justify-between font-bold text-slate-800"><span class="text-sm">{{ idx + 1 }}. {{ item.q }} = <span :class="item.isCorrect ? 'text-green-600' : 'text-red-500'">{{ item.chosen }}</span></span><CheckCircle2 v-if="item.isCorrect" class="text-green-500 shrink-0" size="22" /><XCircle v-else class="text-red-500 shrink-0" size="22" /></div>
                        <div v-if="!item.isCorrect" class="mt-1.5 ml-8 text-sm flex items-center gap-2"><span class="text-slate-900 italic">Correcto</span><span class="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">({{ item.correct }})</span></div>
                    </div>
                </div>
                <div class="flex gap-4 pb-8 mt-2 shrink-0 relative z-10">
                    <button @click="handleCloseSurgical" class="flex-1 bg-slate-200 text-slate-700 font-black py-4 rounded-2xl uppercase text-xs shadow-[0_5px_0_rgb(203,213,225)]">PORTAL</button>
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

/* CABECERA Y NAVEGACIÓN */
.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 1000; position: relative; transition: all 0.3s ease; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.25rem; height: 1.25rem; }

/* NUEVO BOTÓN 'X' SOBRE CÍRCULO BLANCO HOMOLOGADO */
.btn-close-circle { background: white; color: #ef4444; border: 2px solid #fca5a5; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; position: relative; z-index: 1001; flex-shrink: 0; }
.btn-close-circle:active { transform: scale(0.9); }

/* 🍎 CESTA 3D CSS ESPECTACULAR */
.basket-container {
    width: 140px;
    height: 120px;
    position: relative;
    margin-top: 10px;
    margin-bottom: 5px;
}

.animate-float-slow { animation: floatSlow 4s ease-in-out infinite; }
@keyframes floatSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

/* Interior de la cesta */
.basket-back {
    position: absolute;
    bottom: 0;
    left: 10px;
    width: 120px;
    height: 60px;
    background: #8b5a2b;
    border-radius: 20px 20px 40px 40px;
    z-index: 1;
}

/* Frutas */
.fruit-apple {
    position: absolute;
    bottom: 45px;
    left: 20px;
    width: 45px;
    height: 45px;
    background: radial-gradient(circle at 30% 30%, #ff6b6b, #cc0000);
    border-radius: 50%;
    box-shadow: inset -5px -5px 10px rgba(0,0,0,0.3), 2px 2px 5px rgba(0,0,0,0.4);
    z-index: 2;
}

.fruit-orange {
    position: absolute;
    bottom: 40px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: radial-gradient(circle at 30% 30%, #ffb347, #ff8c00);
    border-radius: 50%;
    box-shadow: inset -5px -5px 10px rgba(0,0,0,0.3), -2px 2px 5px rgba(0,0,0,0.4);
    z-index: 3;
}

.fruit-grape {
    position: absolute;
    bottom: 55px;
    left: 50px;
    width: 40px;
    height: 40px;
    background: radial-gradient(circle at 30% 30%, #b19cd9, #6a0dad);
    border-radius: 50%;
    box-shadow: inset -3px -3px 8px rgba(0,0,0,0.3), 0px 3px 5px rgba(0,0,0,0.5);
    z-index: 4;
}

/* Frente de la cesta (tejido) */
.basket-front {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 140px;
    height: 65px;
    background: repeating-linear-gradient(
        45deg,
        #d2a679,
        #d2a679 10px,
        #c68e58 10px,
        #c68e58 20px
    );
    border-radius: 10px 10px 50px 50px;
    box-shadow: inset -10px -10px 20px rgba(0,0,0,0.4), 0 10px 15px rgba(0,0,0,0.2);
    z-index: 5;
    overflow: hidden;
}

/* Sombra interior de la cesta para dar profundidad */
.basket-front::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 15px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);
}

/* Borde superior de la cesta */
.basket-rim {
    position: absolute;
    bottom: 55px;
    left: -5px;
    width: 150px;
    height: 15px;
    background: #a67c52;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset 0 2px 2px rgba(255,255,255,0.3);
    z-index: 6;
}

/* ✨ LLUVIA MÁGICA FINAL */
.animate-magic-fall { animation: magicFall linear forwards; top: -10%; }
@keyframes magicFall { 0% { transform: translateY(0vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(115vh) rotate(360deg); opacity: 0; } }

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

.rules-panel { background: white; padding: 1rem; border-radius: 2rem; border: 3px solid #e2e8f0; position: relative; display: flex; flex-direction: column; }
.rules-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 4px 12px; border-radius: 10px; }
.chart-area-3d { background-image: linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px); background-size: 30px 30px; }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>