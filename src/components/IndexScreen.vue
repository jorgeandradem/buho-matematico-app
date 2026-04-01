<script setup>
/** * ARCHIVO: IndexScreen.vue
 * NOTA INTERNA: TORRE DE CONTROL v3.0.0 - INTEGRACIÓN TOTAL DIMENSIÓN CRISTAL
 * LOGICA: Sincronización Privada + Gestión de Premios Cuánticos.
 */
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'; 
import { 
  Plus, Minus, X as MultiplyIcon, Divide, LogOut, 
  User, Pencil, BookOpen, Play, X as CloseIcon,
  ShoppingBag, Zap, Flame, Coffee, DoorOpen, BellRing, Target,
  Eye, EyeOff, Volume2, Hexagon
} from 'lucide-vue-next';
import OwlImage from './OwlImage.vue';
import { incentiveMessages } from '../utils/messages';
import StatusBoard from './StatusBoard.vue';
import SessionSummary from './SessionSummary.vue';
import RewardShop from './RewardShop.vue';
import ChallengeHub from './ChallengeHub.vue'; 
import DailyMissions from './DailyMissions.vue'; 
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

// 🛠️ FIX: Añadimos 'open-crystal-dimension' a la lista de eventos permitidos
const emit = defineEmits(['select', 'exit', 'open-portal-welcome', 'open-crystal-dimension']);
const props = defineProps(['fromView', 'config']);

const gamificationStore = useGamificationStore();
const randomIncentive = ref("");
const studentName = ref(""); 
const isEditingName = ref(false);
const showOwl = ref(false); 
const greeting = ref("");
const hasVocalizedWelcome = ref(false);
let unsubscribeUser = null;

// --- 🧭 NAVEGACIÓN INTERNA ---
const showSummary = ref(false);
const showShop = ref(false); 
const showMissions = ref(false); 
const showExitConfirm = ref(false); 
const fullSignOutRequested = ref(false);
const showChallengeHub = ref(props.config && props.config.mode === 'open-hub'); 

const showBubble = ref(false);
const bubbleText = computed(() => gamificationStore.bubbleMessage);
const showQuickGuide = ref(false);
const showTextZoom = ref(false);
const guideFontSize = ref(20); 

// --- ⚡ WATCHERS ---

watch(showQuickGuide, (isOpen) => {
    if (isOpen) guideFontSize.value = 20;
});

watch(studentName, (newName) => {
    const isComingFromCover = props.fromView === 'cover' || !props.fromView;
    if (newName && isComingFromCover && !hasVocalizedWelcome.value) {
        greeting.value = `¡Hola de nuevo, ${newName}!`;
        speak(greeting.value);
        hasVocalizedWelcome.value = true;
    }
});

watch(bubbleText, (newVal) => {
    if (newVal) {
        showBubble.value = true;
        speak(newVal); 
        setTimeout(() => {
            showBubble.value = false;
            gamificationStore.bubbleMessage = ''; 
        }, 6000);
    }
});

// --- ⚙️ SINCRONIZACIÓN Y ACCIONES ---

const startRealTimeSync = (user) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.username) studentName.value = data.username;
            if (data.stats) gamificationStore.setCoinsFromCloud(data.stats);
        }
    });
};

const pickRandomMessage = () => {
  const randomIndex = Math.floor(Math.random() * incentiveMessages.length);
  randomIncentive.value = incentiveMessages[randomIndex];
};

const zoomIn = () => { if (guideFontSize.value < 28) guideFontSize.value += 2; }; 
const zoomOut = () => { if (guideFontSize.value > 12) guideFontSize.value -= 2; };

const options = [
  { id: 'add', label: 'Sumar', icon: Plus, color: 'bg-green-500', desc: 'Aprende a agregar' },
  { id: 'sub', label: 'Restar', icon: Minus, color: 'bg-orange-500', desc: 'Aprende a quitar' },
  { id: 'mult', label: 'Multiplicar', icon: MultiplyIcon, color: 'bg-purple-500', desc: 'Grupos iguales' },
  { id: 'div', label: 'Dividir', icon: Divide, color: 'bg-blue-500', desc: 'Repartir en partes' }
];

const showConfigModal = ref(false);
const selectedSubject = ref(null); 
const configMode = ref('notebook'); 
const configDifficulty = ref(1); 
const configTable = ref('random'); 

const openConfig = (subjectId) => {
    selectedSubject.value = subjectId;
    configMode.value = 'notebook';
    configDifficulty.value = 1;
    configTable.value = 'random';
    showQuickGuide.value = false; 
    showConfigModal.value = true;
};

const startGame = () => {
    showConfigModal.value = false;
    emit('select', {
        id: selectedSubject.value,
        mode: configMode.value,
        difficulty: configDifficulty.value,
        table: configTable.value
    });
};

const handleExitClick = () => { showExitConfirm.value = true; };
const confirmTakeBreak = () => { showExitConfirm.value = false; showSummary.value = true; };
const confirmFullLogout = () => { fullSignOutRequested.value = true; showExitConfirm.value = false; showSummary.value = true; };

const finalExit = async () => {
    showSummary.value = false;
    if (unsubscribeUser) unsubscribeUser(); 
    if (fullSignOutRequested.value) {
        try {
            await signOut(auth);
            localStorage.removeItem('buho_last_login'); 
        } catch (e) { console.error("Error logout:", e); }
    }
    emit('exit');
};

const saveName = async () => { 
  if (studentName.value.trim()) { 
    isEditingName.value = false; 
    const thanksText = `¡Gracias ${studentName.value}!`;
    greeting.value = thanksText; speak(thanksText); 
    const user = auth.currentUser;
    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { username: studentName.value });
        } catch (e) { console.error(e); }
    }
  } 
};

onMounted(() => {
  gamificationStore.loadFromStorage();
  gamificationStore.checkDailyStreak();
  if (!gamificationStore.activeMissions || gamificationStore.activeMissions.length === 0) {
      gamificationStore.generateNewMissions();
  }
  pickRandomMessage();
  onAuthStateChanged(auth, (user) => {
      if (user) startRealTimeSync(user); 
      else {
          const localName = localStorage.getItem('owlStudentName');
          if (localName) studentName.value = localName;
      }
  });
  if (props.fromView && ['add', 'sub', 'mult', 'div'].includes(props.fromView)) {
      setTimeout(() => { openConfig(props.fromView); }, 50);
  }
  const isComingFromCover = props.fromView === 'cover' || !props.fromView;
  setTimeout(() => {
    showOwl.value = true;
    if (isComingFromCover) {
        if (!studentName.value) {
             greeting.value = "¡Hola! ¿Cómo te llamas?";
             speak(greeting.value);
        }
        setTimeout(() => { showOwl.value = false; }, 4000);
    } else {
        greeting.value = "¡Sigamos practicando!";
        setTimeout(() => { showOwl.value = false; }, 3000);
    }
  }, 300);
});

onUnmounted(() => {
    if (unsubscribeUser) unsubscribeUser();
    window.speechSynthesis.cancel();
});

const currentSubjectLabel = computed(() => options.find(o => o.id === selectedSubject.value)?.label || '');
</script>

<template>
  <div class="master-container">
    <main class="app-canvas">
    
        <Transition name="bubble-pop">
            <div v-if="showBubble" class="absolute top-20 left-1/2 -translate-x-1/2 z-[200] w-[94%] max-w-xs">
                <div class="bg-yellow-400 text-indigo-900 p-8 rounded-[2rem] shadow-2xl border-4 border-white flex items-center gap-5 relative min-h-[130px] h-auto">
                    <div class="bg-indigo-900/10 p-3 rounded-full shrink-0">
                        <BellRing class="animate-ring text-indigo-900" :size="30" />
                    </div>
                    <p class="font-black text-lg leading-snug flex-1">{{ bubbleText }}</p>
                    <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-yellow-400"></div>
                </div>
            </div>
        </Transition>

        <div v-if="showSummary" class="absolute inset-0 z-[100]">
            <SessionSummary @close="finalExit" />
        </div>

        <RewardShop v-if="showShop" @close="showShop = false" />
        <DailyMissions v-if="showMissions" @close="showMissions = false" />
        <ChallengeHub v-if="showChallengeHub" @close="showChallengeHub = false" />
        
        <div v-if="showExitConfirm" class="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div class="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border-4 border-indigo-100 text-center flex flex-col gap-6">
                <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto border-2 border-indigo-100">
                    <OwlImage customClass="w-14 h-14" />
                </div>
                <div>
                    <h3 class="text-2xl font-black text-slate-800 mb-2 uppercase leading-none">¿Ya terminaste?</h3>
                    <p class="text-slate-500 font-bold leading-tight">Elige cómo quieres salir:</p>
                </div>
                <div class="flex flex-col gap-3">
                    <button @click="confirmTakeBreak" class="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 transition-all flex items-center justify-center gap-3">
                        <Coffee :size="24" /> Tomar un descanso
                    </button>
                    <button @click="confirmFullLogout" class="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-500 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                        <DoorOpen :size="18" /> Cerrar sesión
                    </button>
                </div>
                <button @click="showExitConfirm = false" class="text-indigo-600 font-black tracking-widest text-xs mt-2 hover:underline uppercase">Continuar practicando</button>
            </div>
        </div>

        <header class="header-main shrink-0">
            <div class="flex gap-2">
                <button @click="showShop = true" class="btn-circular-action bg-gradient-to-b from-yellow-300 to-yellow-500 border-yellow-200 animate-bounce-slow">
                     <ShoppingBag :size="20" stroke-width="2.5" class="text-yellow-900" />
                     <span class="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
                <button @click="showMissions = true" class="px-3 py-1 bg-gradient-to-b from-orange-400 to-red-500 rounded-full text-white shadow-md border-2 border-red-200 active:scale-95 flex items-center gap-1 font-black h-10">
                    <Flame :size="18" fill="currentColor" class="text-yellow-300" />
                    {{ gamificationStore.currentStreak || 0 }}
                </button>
            </div>
            <div class="bg-white/80 backdrop-blur-sm px-6 py-1.5 rounded-full shadow-sm border border-indigo-100 flex items-center">
              <span class="text-sm font-black text-indigo-600 tracking-widest uppercase">Búho Mate</span>
            </div>
            <button @click="handleExitClick" class="btn-circular-action bg-white border-indigo-100 text-indigo-600">
                <LogOut :size="20" class="transform rotate-180" />
            </button>
        </header>

        <div class="content-hero-area flex-1 flex flex-col justify-evenly">
          
          <div class="w-full grid grid-cols-2 px-6 items-end">
             <div class="flex items-center justify-center h-full">
                 <div v-if="showOwl" class="bg-white rounded-2xl p-2 shadow-xl border-2 border-indigo-200 relative animate-fade-in w-full text-center">
                    <p class="text-indigo-900 font-black text-xs leading-tight">{{ greeting }}</p>
                    <div class="absolute -bottom-2 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                 </div>
             </div>
             <div class="flex flex-col items-center justify-end h-full">
                 <div v-if="showOwl" class="w-16 h-16 sm:w-20 sm:h-20 transition-all duration-500 shrink-0"><OwlImage customClass="w-full h-full object-contain" /></div>
                 <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/30 shadow-sm w-full max-w-[140px]">
                    <User :size="14" class="text-white shrink-0" />
                    <input v-if="isEditingName" type="text" v-model="studentName" @keyup.enter="saveName" class="bg-transparent text-white font-black text-[11px] outline-none w-full" autofocus />
                    <span v-else class="text-white font-black text-[11px] truncate w-full cursor-pointer uppercase tracking-tighter" @click="isEditingName = true">{{ studentName || "HOLA!" }}</span>
                    <Pencil v-if="!isEditingName" :size="12" class="text-indigo-200 shrink-0" />
                 </div>
             </div>
          </div>

          <div class="grid grid-cols-2 gap-3 w-full px-4 max-w-md mx-auto">
            <button v-for="opt in options" :key="opt.id" @click="openConfig(opt.id)"
              class="group bg-white p-2 rounded-[2rem] border-4 border-transparent hover:border-indigo-100 shadow-xl active:scale-95 flex flex-col items-center justify-center gap-1 transition-all h-24 sm:h-28">
              <div :class="`w-10 h-10 rounded-xl ${opt.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0`">
                <component :is="opt.icon" :size="22" class="text-white" :stroke-width="3" />
              </div>
              <div class="text-center">
                <h3 class="text-[15px] sm:text-base font-black text-slate-800 leading-none uppercase tracking-tighter">{{ opt.label }}</h3>
                <p class="text-slate-400 font-bold text-[8px] sm:text-[9px] mt-0.5 tracking-widest uppercase">{{ opt.desc }}</p>
              </div>
            </button>
          </div>

          <div class="px-4 w-full flex flex-col gap-2 shrink-0 max-w-md mx-auto">
              
              <button @click="emit('open-portal-welcome')" class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-[2.5rem] p-1 shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 transition-all group">
                <div class="bg-white/10 rounded-[2.2rem] py-2 px-4 flex items-center gap-4">
                    <div class="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Target size="22" class="text-orange-500" fill="currentColor" />
                    </div>
                    <div class="text-left text-white flex-1">
                        <h3 class="font-black text-lg leading-tight uppercase tracking-tighter">Portal de Desafíos</h3>
                        <p class="text-orange-100 text-[10px] font-bold uppercase leading-none mt-0.5">🎯 ¡Gana monedas extra aquí!</p>
                    </div>
                </div>
              </button>

              <button @click="emit('open-crystal-dimension')" class="w-full bg-slate-950 rounded-[2.5rem] p-1 shadow-[0_4px_0_rgb(2,6,23),0_0_15px_rgba(34,211,238,0.4)] border border-cyan-500/30 active:translate-y-1 transition-all group relative overflow-hidden">
                  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-400/20 via-transparent to-transparent"></div>
                  <div class="bg-white/5 backdrop-blur-md rounded-[2.2rem] py-2 px-4 flex items-center gap-4 relative z-10 border border-white/5">
                      <div class="w-10 h-10 shrink-0 rounded-full bg-slate-900 border border-cyan-400/50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all shadow-[inset_0_0_15px_rgba(34,211,238,0.3)]">
                          <Hexagon size="22" class="text-cyan-400" />
                      </div>
                      <div class="text-left flex-1">
                          <h3 class="font-black text-lg leading-tight uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">Dimensión de Cristal</h3>
                          <p class="text-cyan-200/80 text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">✨ Entra al Reino Cuántico</p>
                      </div>
                  </div>
              </button>
          </div>

          <div class="w-full px-4 flex items-center justify-center min-h-[44px]">
              <div class="bg-indigo-900/20 w-full rounded-2xl py-2 px-4 flex items-center justify-center gap-3 shadow-inner max-w-md">
                  <button @click="speak(randomIncentive)" class="text-indigo-200 hover:text-white transition-colors shrink-0">
                      <Volume2 :size="16" />
                  </button>
                  <p class="text-white text-[11px] font-black italic text-center leading-tight">{{ randomIncentive }}</p>
              </div>
          </div>
        </div>

        <div class="shrink-0 pb-6 px-4 w-full">
            <StatusBoard />
        </div>

        <div v-if="showConfigModal" class="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div class="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative border-4 border-indigo-100 flex flex-col max-h-[90vh]">
                <div class="absolute top-4 left-4 flex gap-2 z-[160]">
                    <button @click="showQuickGuide = !showQuickGuide" class="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 animate-eye-pulse h-10 w-10 flex items-center justify-center">
                      <component :is="showQuickGuide ? EyeOff : Eye" :size="20" :stroke-width="2.5" />
                    </button>
                    <Transition name="fade">
                        <button v-if="showQuickGuide" @click="showTextZoom = !showTextZoom" 
                          :class="`rounded-full font-black text-sm transition-all h-10 w-10 flex items-center justify-center border-2 ${showTextZoom ? 'bg-indigo-600 text-white border-transparent' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`">Aa</button>
                    </Transition>
                </div>

                <Transition name="fade-slide">
                    <div v-if="showTextZoom && showQuickGuide" class="absolute top-16 left-4 z-[170] bg-white rounded-xl shadow-xl border-2 border-indigo-100 flex items-center gap-2 p-2 mt-1">
                        <button @click="zoomOut" class="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-500 font-black text-lg">-</button>
                        <span class="text-[13px] font-black text-indigo-900 w-5 text-center">{{ guideFontSize }}</span>
                        <button @click="zoomIn" class="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-500 font-black text-lg">+</button>
                    </div>
                </Transition>

                <button @click="showConfigModal = false" class="absolute top-4 right-4 bg-slate-100 p-2 rounded-full text-slate-400 hover:text-red-500 h-10 w-10 flex items-center justify-center"><CloseIcon :size="20" /></button>
                
                <div class="text-center mb-6 shrink-0 mt-8">
                    <h3 class="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{{ currentSubjectLabel }}</h3>
                    <p class="text-indigo-500 text-[10px] font-black uppercase tracking-widest">¿Cómo quieres practicar?</p>
                </div>

                <div class="flex-1 overflow-y-auto no-scrollbar">
                  <Transition name="slide-down">
                    <div v-if="showQuickGuide" class="mb-4 bg-slate-50 border-2 border-blue-100 rounded-[1.5rem] overflow-hidden shadow-inner shrink-0">
                      <div class="p-5 max-h-[180px] overflow-y-auto scrollbar-thin font-inter text-slate-600 text-left space-y-4">
                        <p :style="{ fontSize: guideFontSize + 'px', lineHeight: '1.5' }" class="font-light">
                          <strong :style="{ fontSize: (guideFontSize * 0.85) + 'px' }" class="font-black text-blue-600 uppercase">⌨️ TECLADO VIRTUAL:</strong> Teclado numérico táctil integrado para evitar que el teclado nativo estorbe. Celdas amarillas bloqueadas.
                        </p>
                        <p :style="{ fontSize: guideFontSize + 'px', lineHeight: '1.5' }" class="font-light">
                          <strong :style="{ fontSize: (guideFontSize * 0.85) + 'px' }" class="font-black text-blue-600 uppercase">🎯 FOCO INTELIGENTE:</strong> Guía visual de bordes amarillos. El cursor salta solo al responder bien.
                        </p>
                      </div>
                    </div>
                  </Transition>

                  <div class="grid grid-cols-2 gap-4 mb-6">
                      <button @click="configMode = 'quick'" :class="`p-4 rounded-3xl border-4 font-black text-sm transition-all flex flex-col items-center gap-2 ${configMode === 'quick' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 opacity-60'}`">
                        <Zap :size="24" /> RÁPIDA
                      </button>
                      <button @click="configMode = 'notebook'" :class="`p-4 rounded-3xl border-4 font-black text-sm transition-all flex flex-col items-center gap-2 ${configMode === 'notebook' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-slate-100 text-slate-400 opacity-60'}`">
                        <BookOpen :size="24" /> CUADERNO
                      </button>
                  </div>

                  <div v-if="configMode === 'quick'" class="flex flex-col gap-3 mb-6 p-4 bg-slate-50 rounded-3xl border-2 border-slate-100">
                      <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">Selecciona una Tabla</p>
                      <button @click="configTable = 'random'" :class="`w-full py-3 rounded-xl font-black text-xs border-2 transition-all ${configTable === 'random' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`">🎲 ALEATORIAS</button>
                      <div class="grid grid-cols-5 gap-2">
                          <button v-for="n in 10" :key="n" @click="configTable = n" :class="`aspect-square rounded-xl font-black text-sm border-2 flex items-center justify-center ${configTable === n ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`">{{ n }}</button>
                      </div>
                  </div>
                </div>

                <button @click="startGame" class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(49,46,129)] active:translate-y-1 transition-all flex items-center justify-center gap-3 uppercase shrink-0">
                    <Play :size="24" fill="currentColor" /> ¡JUGAR!
                </button>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
/* 🛡️ BLINDAJE ESTRUCTURAL GLOBAL */
.master-container { 
  height: 100dvh; 
  width: 100vw; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  overflow: hidden; 
  background-color: #f1f5f9; 
  position: fixed; 
  top: 0; 
  left: 0; 
  touch-action: none; 
}

/* 📱 CONFIGURACIÓN PARA SMARTPHONE (POR DEFECTO) */
.app-canvas { 
  display: flex; 
  flex-direction: column; 
  justify-content: space-between; 
  position: relative; 
  overflow: hidden; 
  background: linear-gradient(to bottom right, #6366f1, #a855f7); 
  width: 100vw; 
  height: 100dvh; 
  box-sizing: border-box; /* ⬅️ Evita desbordamientos laterales */
}

/* 📑 CONFIGURACIÓN PARA TABLET (iPad, Android Tabs) */
@media (min-width: 600px) and (max-width: 1024px) { 
  .app-canvas { 
    width: 85vw; 
    height: 95dvh; 
    border-radius: 35px; 
    max-width: 700px; /* ⬅️ Mantiene el encuadre profesional */
  } 
}

/* 💻 CONFIGURACIÓN PARA PC (INVARIABLE SEGÚN SOLICITUD) */
@media (min-width: 1025px) { 
  .app-canvas { 
    width: 1024px; 
    height: 90dvh; 
    border-radius: 45px; 
    border: 6px solid rgba(255, 255, 255, 0.1); 
  } 
}

/* 📐 ÁREA DE CONTENIDO DINÁMICA (ELASTICA VERTICALMENTE) */
.content-hero-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly; /* ⬅️ Reparte el espacio vacío de forma profesional */
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  padding: 0.5rem 0;
}

.header-main { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 1.2rem 1rem; z-index: 50; }
.btn-circular-action { width: 2.8rem; height: 2.8rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border-width: 2px; position: relative; transition: transform 0.2s; }

.animate-eye-pulse { animation: eyePulse 2s infinite; }
@keyframes eyePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease-out; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-15px); }

.animate-bounce-slow { animation: bounce 3s infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s reverse; }
@keyframes popIn { from { opacity: 0; transform: translate(-50%, -20px) scale(0.8); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>