<script setup>
/** * ARCHIVO: IndexScreen.vue
 * NOTA INTERNA: TORRE DE CONTROL v2.9.9 - FILTRO DE SALUDO INTELIGENTE + MOTOR UNIFICADO
 */
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'; 
import { 
  Plus, Minus, X as MultiplyIcon, Divide, LogOut, 
  User, Pencil, BookOpen, Play, X as CloseIcon,
  ShoppingBag, Zap, Flame, Coffee, DoorOpen, BellRing, Target,
  Eye, EyeOff, ChevronRight
} from 'lucide-vue-next';
import OwlImage from './OwlImage.vue';
import { playOwlHoot } from '../utils/sound'; 
import { incentiveMessages } from '../utils/messages';
import StatusBoard from './StatusBoard.vue';
import SessionSummary from './SessionSummary.vue';
import RewardShop from './RewardShop.vue';
import ChallengeHub from './ChallengeHub.vue'; 
import DailyMissions from './DailyMissions.vue'; 
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice'; // Importación de la utilidad de voz

import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

const emit = defineEmits(['select', 'exit', 'open-portal-welcome']);
const props = defineProps(['fromView', 'config']);

const gamificationStore = useGamificationStore();
const randomIncentive = ref("");
const studentName = ref(""); 
const isEditingName = ref(false);
const showOwl = ref(false); 
const greeting = ref("");
const hasVocalizedWelcome = ref(false); // Flag para evitar repeticiones
let unsubscribeUser = null;

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
const guideFontSize = ref(14); 

// --- ⚡ WATCHERS ESTRATÉGICOS ---

// Solo saluda vocalmente si viene de la CoverScreen (Login o retorno de descanso)
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

// --- ⚙️ LÓGICA DE DATOS Y SINCRONIZACIÓN ---

const startRealTimeSync = (user) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Actualizamos el nombre (el watch se encarga de la voz si aplica)
            if (data.username) {
                studentName.value = data.username;
            }
            if (data.stats) {
                gamificationStore.setCoinsFromCloud(data.stats);
            }
        }
    });
};

const pickRandomMessage = () => {
  const randomIndex = Math.floor(Math.random() * incentiveMessages.length);
  randomIncentive.value = incentiveMessages[randomIndex];
};

const zoomIn = () => { if (guideFontSize.value < 24) guideFontSize.value += 2; };
const zoomOut = () => { if (guideFontSize.value > 10) guideFontSize.value -= 2; };

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

const handleExitClick = () => {
    showExitConfirm.value = true; 
};

const confirmTakeBreak = () => {
    fullSignOutRequested.value = false; 
    showExitConfirm.value = false;
    showSummary.value = true; 
};

const confirmFullLogout = () => {
    fullSignOutRequested.value = true; 
    showExitConfirm.value = false;
    showSummary.value = true; 
};

const finalExit = async () => {
    showSummary.value = false;
    if (unsubscribeUser) unsubscribeUser(); 

    if (fullSignOutRequested.value) {
        try {
            await signOut(auth);
            localStorage.removeItem('buho_last_login'); 
        } catch (e) {
            console.error("Error al cerrar sesión:", e);
        }
    }
    emit('exit');
};

const saveName = async () => { 
  if (studentName.value.trim()) { 
    isEditingName.value = false; 
    const thanksText = `¡Gracias ${studentName.value}!`;
    greeting.value = thanksText; 
    speak(thanksText); 
    const user = auth.currentUser;
    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { username: studentName.value });
        } catch (e) {
            console.error("Error guardando nombre:", e);
        }
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
      if (user) {
          startRealTimeSync(user); 
      } else {
          const localName = localStorage.getItem('owlStudentName');
          if (localName) studentName.value = localName;
      }
  });

  if (props.fromView && ['add', 'sub', 'mult', 'div'].includes(props.fromView)) {
      setTimeout(() => { openConfig(props.fromView); }, 50);
  }

  // --- Lógica de Presentación Visual/Vocal ---
  const isComingFromCover = props.fromView === 'cover' || !props.fromView;

  setTimeout(() => {
    showOwl.value = true;
    
    if (isComingFromCover) {
        // Solo si no hay nombre (nuevo usuario), preguntamos vocalmente aquí
        if (!studentName.value) {
             const helloText = "¡Hola! ¿Cómo te llamas?";
             greeting.value = helloText;
             speak(helloText);
        }
        // Si hay nombre, el watch(studentName) se encarga de saludar "HOLA DE NUEVO"
        setTimeout(() => { showOwl.value = false; }, 4000);
    } else {
        // VIENE DE UN JUEGO: Silencio vocal, solo texto informativo
        greeting.value = "¡Sigamos practicando!";
        setTimeout(() => { showOwl.value = false; }, 3000);
    }
  }, 300);
});

onUnmounted(() => {
    if (unsubscribeUser) unsubscribeUser();
    window.speechSynthesis.cancel(); // Silenciamos al salir del índice
});

const currentSubjectLabel = computed(() => {
    const opt = options.find(o => o.id === selectedSubject.value);
    return opt ? opt.label : '';
});
</script>

<template>
  <div class="master-container">
    <main class="app-canvas">
    
        <Transition name="bubble-pop">
            <div v-if="showBubble" class="absolute top-20 left-1/2 -translate-x-1/2 z-[200] w-[94%] max-w-xs">
                <div class="bg-yellow-400 text-indigo-900 p-8 rounded-[2rem] shadow-2xl border-4 border-white flex items-center gap-5 relative min-h-[130px] h-auto transition-all">
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
                    <h3 class="text-2xl font-black text-slate-800 mb-2 text-center uppercase leading-none">¿Ya terminaste?</h3>
                    <p class="text-slate-500 font-bold leading-tight text-center">Elige cómo quieres salir:</p>
                </div>
                <div class="flex flex-col gap-3">
                    <button @click="confirmTakeBreak" class="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 transition-all flex items-center justify-center gap-3 leading-none">
                        <Coffee :size="24" /> Tomar un descanso
                    </button>
                    <button @click="confirmFullLogout" class="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-500 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2 border-transparent hover:border-red-200 hover:text-red-600">
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

        <div class="content-hero-area flex-1">
          <div class="w-full grid grid-cols-2 px-6 items-end mb-4">
             <div class="flex items-center justify-center h-full">
                 <div v-if="showOwl" class="bg-white rounded-2xl p-3 shadow-xl border-2 border-indigo-200 relative animate-fade-in w-full text-center">
                    <p class="text-indigo-900 font-black text-xs leading-tight">{{ greeting }}</p>
                    <div class="absolute -bottom-2 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                 </div>
             </div>
             <div class="flex flex-col items-center justify-end h-full">
                 <div v-if="showOwl" class="w-20 h-20 sm:w-24 sm:h-24 transition-all duration-500 shrink-0"><OwlImage customClass="w-full h-full object-contain" /></div>
                 <div class="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/30 shadow-sm w-full max-w-[140px]">
                    <User :size="14" class="text-white" />
                    <input v-if="isEditingName" type="text" v-model="studentName" @keyup.enter="saveName" class="bg-transparent text-white font-black text-xs outline-none w-full" autoFocus />
                    <span v-else class="text-white font-black text-[10px] truncate w-full cursor-pointer uppercase tracking-tighter" @click="isEditingName = true">{{ studentName || "HOLA!" }}</span>
                    <Pencil v-if="!isEditingName" :size="12" class="text-indigo-200" />
                 </div>
             </div>
          </div>

          <div class="grid grid-cols-2 gap-4 w-full px-4 mb-4">
            <button v-for="opt in options" :key="opt.id" @click="openConfig(opt.id)"
              class="group bg-white p-3 rounded-[2.5rem] border-4 border-transparent hover:border-indigo-100 shadow-xl active:scale-95 flex flex-col items-center justify-center gap-2 transition-all h-28 sm:h-32">
              <div :class="`w-12 h-12 rounded-2xl ${opt.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`">
                <component :is="opt.icon" :size="24" class="text-white" :stroke-width="3" />
              </div>
              <div class="text-center">
                <h3 class="text-lg font-black text-slate-800 leading-none uppercase tracking-tighter">{{ opt.label }}</h3>
                <p class="text-slate-400 font-bold text-[9px] mt-1 tracking-widest uppercase">{{ opt.desc }}</p>
              </div>
            </button>
          </div>

          <div class="px-4 w-full mb-4">
              <button @click="emit('open-portal-welcome')" class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-[2.5rem] p-1 shadow-[0_6px_0_rgb(194,65,12)] active:translate-y-1 transition-all group">
                <div class="bg-white/10 rounded-[2.2rem] p-3 flex items-center gap-5">
                    <div class="w-12 h-12 shrink-0 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        <Target size="26" class="text-orange-500" fill="currentColor" />
                    </div>
                    <div class="text-left text-white flex-1">
                        <h3 class="font-black text-lg leading-tight uppercase tracking-tighter">Portal de Desafíos</h3>
                        <p class="text-orange-100 text-[10px] font-bold uppercase">🎯 ¡Gana monedas extra aquí!</p>
                    </div>
                </div>
              </button>
          </div>
        </div>

        <div class="footer-anclado shrink-0 pb-6 px-4">
            <div class="bg-indigo-900/20 rounded-2xl py-2 px-4 flex items-center justify-center gap-3 shadow-inner mb-2 relative">
                <button @click="speak(randomIncentive)" class="text-indigo-200 hover:text-white transition-colors">
                    <Volume2 :size="16" />
                </button>
                <p class="text-white text-[11px] font-black italic text-center leading-tight">
                    {{ randomIncentive }}
                </p>
            </div>
            <StatusBoard />
        </div>

        <div v-if="showConfigModal" class="absolute inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div class="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative border-4 border-indigo-100 flex flex-col max-h-[90vh]">
                
                <div class="absolute top-4 left-4 flex gap-2 z-[160]">
                    <button @click="showQuickGuide = !showQuickGuide" 
                      class="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all animate-eye-pulse shadow-sm h-10 w-10 flex items-center justify-center">
                      <component :is="showQuickGuide ? EyeOff : Eye" :size="20" :stroke-width="2.5" />
                    </button>
                    
                    <Transition name="fade">
                        <button v-if="showQuickGuide" @click="showTextZoom = !showTextZoom" 
                          :class="`rounded-full font-black text-sm transition-all shadow-sm h-10 w-10 flex items-center justify-center border-2 border-transparent ${showTextZoom ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100'}`">
                          Aa
                        </button>
                    </Transition>
                </div>

                <Transition name="fade-slide">
                    <div v-if="showTextZoom && showQuickGuide" class="absolute top-16 left-4 z-[170] bg-white rounded-xl shadow-xl border-2 border-indigo-100 flex items-center gap-2 p-2 mt-1">
                        <button @click="zoomOut" class="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors font-black text-lg">-</button>
                        <span class="text-[13px] font-black text-indigo-900 w-5 text-center">{{ guideFontSize }}</span>
                        <button @click="zoomIn" class="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors font-black text-lg">+</button>
                    </div>
                </Transition>

                <button @click="showConfigModal = false" class="absolute top-4 right-4 bg-slate-100 p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors z-[160] h-10 w-10 flex items-center justify-center"><CloseIcon :size="20" /></button>
                
                <div class="text-center mb-6 shrink-0 mt-8">
                    <h3 class="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{{ currentSubjectLabel }}</h3>
                    <p class="text-indigo-500 text-[10px] font-black uppercase tracking-widest">¿Cómo quieres practicar?</p>
                </div>

                <div class="flex-1 overflow-y-auto no-scrollbar">
                  <div class="grid grid-cols-2 gap-4 mb-6">
                      <button @click="configMode = 'quick'" :class="`p-4 rounded-3xl border-4 font-black text-sm transition-all flex flex-col items-center gap-2 ${configMode === 'quick' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 opacity-60'}`">
                        <Zap :size="24" /> RÁPIDA
                      </button>
                      <button @click="configMode = 'notebook'" :class="`p-4 rounded-3xl border-4 font-black text-sm transition-all flex flex-col items-center gap-2 ${configMode === 'notebook' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-slate-100 text-slate-400 opacity-60'}`">
                        <BookOpen :size="24" /> CUADERNO
                      </button>
                  </div>

                  <div v-if="configMode === 'quick'" class="flex flex-col gap-3 animate-fade-in mb-6 p-4 bg-slate-50 rounded-3xl border-2 border-slate-100">
                      <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">Selecciona una Tabla</p>
                      <button @click="configTable = 'random'" :class="`w-full py-3 rounded-xl font-black text-xs border-2 transition-all ${configTable === 'random' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`">🎲 ALEATORIAS</button>
                      <div class="grid grid-cols-5 gap-2">
                          <button v-for="n in 10" :key="n" @click="configTable = n" :class="`aspect-square rounded-xl font-black text-sm border-2 transition-all flex items-center justify-center ${configTable === n ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`">{{ n }}</button>
                      </div>
                  </div>
                </div>

                <button @click="startGame" class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(49,46,129)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 uppercase tracking-widest shrink-0">
                    <Play :size="24" fill="currentColor" /> ¡JUGAR!
                </button>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
/* (Mantenemos los estilos blindados originales para no afectar la interfaz) */
.master-container { height: 100dvh; width: 100vw; display: flex; justify-content: center; align-items: center; overflow: hidden; background-color: #f1f5f9; position: fixed; top: 0; left: 0; touch-action: none; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; background: linear-gradient(to bottom right, #6366f1, #a855f7); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; touch-action: none !important; -webkit-tap-highlight-color: transparent; width: 100vw; height: 100dvh; }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; box-shadow: 0 25px 50px rgba(0,0,0,0.2); } }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.25); border: 6px solid rgba(255, 255, 255, 0.1); } }
.header-main { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 1.2rem 1rem; z-index: 50; }
.btn-circular-action { width: 2.8rem; height: 2.8rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-width: 2px; position: relative; transition: transform 0.2s; }
.content-hero-area { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 0; padding-bottom: 1rem; }
.animate-eye-pulse { animation: eyePulse 2s infinite; }
@keyframes eyePulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 50% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-5px) scale(0.95); }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-bounce-slow { animation: bounce 3s infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.bubble-pop-enter-active { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.bubble-pop-leave-active { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse; }
@keyframes popIn { from { opacity: 0; transform: translate(-50%, -20px) scale(0.8); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>