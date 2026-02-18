<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'; 
import { 
  Plus, Minus, X as MultiplyIcon, Divide, LogOut, 
  User, Pencil, Check, BookOpen, Play, X as CloseIcon,
  ShoppingBag, Zap, Flame, Coffee, DoorOpen
} from 'lucide-vue-next';
import OwlImage from './OwlImage.vue';
import { playOwlHoot } from '../utils/sound'; 
import { incentiveMessages } from '../utils/messages';
import StatusBoard from './StatusBoard.vue';
import SessionSummary from './SessionSummary.vue';
import RewardShop from './RewardShop.vue';
import QuizModule from './QuizModule.vue'; 
import DailyMissions from './DailyMissions.vue'; 
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

// --- IMPORTAMOS FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
// ---------------------------

const emit = defineEmits(['select', 'exit']);
const props = defineProps(['fromView']);

const gamificationStore = useGamificationStore();

const randomIncentive = ref("");
const studentName = ref(""); 
const isEditingName = ref(false);
const showOwl = ref(false); 
const greeting = ref("");

// Variable para detener el escuchador cuando salgamos
let unsubscribeUser = null;

// Variables para modales
const showSummary = ref(false);
const showShop = ref(false); 
const showQuiz = ref(false); 
const showMissions = ref(false); 
const showExitConfirm = ref(false); // NUEVO: Modal de confirmación de salida

// Estado para decidir si desconectamos de Firebase o no
const fullSignOutRequested = ref(false);

const pickRandomMessage = () => {
  const randomIndex = Math.floor(Math.random() * incentiveMessages.length);
  randomIncentive.value = incentiveMessages[randomIndex];
};

const showConfigModal = ref(false);
const selectedSubject = ref(null); 
const configMode = ref('notebook'); 
const configDifficulty = ref(1); 
const configTable = ref('random'); 

const options = [
  { id: 'add', label: 'Sumar', icon: Plus, color: 'bg-green-500', desc: 'Aprende a agregar' },
  { id: 'sub', label: 'Restar', icon: Minus, color: 'bg-orange-500', desc: 'Aprende a quitar' },
  { id: 'mult', label: 'Multiplicar', icon: MultiplyIcon, color: 'bg-purple-500', desc: 'Grupos iguales' },
  { id: 'div', label: 'Dividir', icon: Divide, color: 'bg-blue-500', desc: 'Repartir en partes' }
];

const openConfig = (subjectId) => {
    selectedSubject.value = subjectId;
    configMode.value = 'notebook';
    configDifficulty.value = 1;
    configTable.value = 'random';
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

// --- NUEVA LÓGICA DE SALIDA ---

const handleExitClick = () => {
    showExitConfirm.value = true; // Abrimos el cuadro de decisión
};

const confirmTakeBreak = () => {
    fullSignOutRequested.value = false; // Solo cerramos vista, NO desconectamos
    showExitConfirm.value = false;
    showSummary.value = true; // Pasamos por el resumen de puntos
};

const confirmFullLogout = () => {
    fullSignOutRequested.value = true; // SÍ desconectamos de Firebase
    showExitConfirm.value = false;
    showSummary.value = true; // Pasamos por el resumen de puntos
};

const finalExit = async () => {
    showSummary.value = false;
    
    // Apagamos el escuchador en tiempo real
    if (unsubscribeUser) unsubscribeUser(); 

    if (fullSignOutRequested.value) {
        console.log("🔒 Realizando Cierre de Sesión Completo...");
        try {
            await signOut(auth);
            localStorage.removeItem('buho_last_login'); 
        } catch (e) {
            console.error("Error al cerrar sesión:", e);
        }
    } else {
        console.log("☕ Tomando un descanso (Sesión mantenida)");
    }
    
    emit('exit');
};

// --- FIN LÓGICA DE SALIDA ---

const startRealTimeSync = (user) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.username && data.username !== studentName.value) {
                studentName.value = data.username;
                if (!greeting.value) {
                    greeting.value = `¡Hola de nuevo, ${data.username}!`;
                    speak(greeting.value);
                }
            }
            if (data.stats) {
                gamificationStore.setCoinsFromCloud(data.stats);
            }
        }
    });
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

  const isComingFromCover = props.fromView === 'cover' || !props.fromView;

  setTimeout(() => {
    showOwl.value = true;
    if (isComingFromCover) {
        if (!studentName.value) {
             const helloText = "¡Hola! ¿Cómo te llamas?";
             greeting.value = helloText;
             speak(helloText);
        }
        setTimeout(() => { showOwl.value = false; }, 4000);
    } else {
        greeting.value = "¡Sigamos practicando!";
    }
  }, 300);
});

onUnmounted(() => {
    if (unsubscribeUser) unsubscribeUser();
});

const currentSubjectLabel = computed(() => {
    const opt = options.find(o => o.id === selectedSubject.value);
    return opt ? opt.label : '';
});
</script>

<template>
  <div class="h-[100dvh] w-full bg-slate-100 flex justify-center overflow-hidden font-sans select-none text-slate-900">
    
    <div class="w-full max-w-xl h-full flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl relative overflow-hidden p-4">
    
        <div v-if="showSummary" class="absolute inset-0 z-[100]">
            <SessionSummary @close="finalExit" />
        </div>

        <RewardShop v-if="showShop" @close="showShop = false" />
        <QuizModule v-if="showQuiz" @close="showQuiz = false" />
        <DailyMissions v-if="showMissions" @close="showMissions = false" />

        <div v-if="showExitConfirm" class="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div class="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border-4 border-indigo-100 text-center flex flex-col gap-6">
                <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto border-2 border-indigo-100">
                    <OwlImage customClass="w-14 h-14" />
                </div>
                
                <div>
                    <h3 class="text-2xl font-black text-slate-800 mb-2">¿Ya terminaste?</h3>
                    <p class="text-slate-500 font-bold leading-tight">Elige cómo quieres salir:</p>
                </div>

                <div class="flex flex-col gap-3">
                    <button @click="confirmTakeBreak" class="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3">
                        <Coffee :size="24" /> Tomar un descanso
                    </button>
                    <p class="text-[10px] text-slate-400 font-bold uppercase italic">Entrarás directo la próxima vez</p>

                    <div class="h-px bg-slate-100 my-2"></div>

                    <button @click="confirmFullLogout" class="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-500 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2 border-transparent hover:border-red-200 hover:text-red-600">
                        <DoorOpen :size="18" /> Cerrar sesión de mi cuenta
                    </button>
                    <p class="text-[9px] text-slate-400">Usa esto solo si el PC es compartido</p>
                </div>

                <button @click="showExitConfirm = false" class="text-indigo-600 font-black uppercase tracking-widest text-xs mt-2 hover:underline">Continuar practicando</button>
            </div>
        </div>

        <div v-if="showConfigModal" class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative flex flex-col gap-4 border-4 border-indigo-100 max-h-[90vh] overflow-y-auto">
                <button @click="showConfigModal = false" class="absolute top-3 right-3 text-slate-400 hover:text-red-500"><CloseIcon /></button>
                <div class="text-center mb-1">
                    <h3 class="text-2xl font-black text-slate-800">{{ currentSubjectLabel }}</h3>
                    <p class="text-slate-500 text-xs font-bold uppercase">Configuración</p>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <button @click="configMode = 'quick'" :class="`p-3 rounded-xl border-2 font-bold text-sm transition-all ${configMode === 'quick' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-400'}`">⚡ Rápida</button>
                    <button @click="configMode = 'notebook'" :class="`p-3 rounded-xl border-2 font-bold text-sm transition-all ${configMode === 'notebook' ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm' : 'border-slate-200 text-slate-400'}`">📔 Cuaderno</button>
                </div>

                <div v-if="configMode === 'quick'" class="flex flex-col gap-2 animate-fade-in mt-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-slate-400 text-[10px] font-bold uppercase text-center">Selecciona la Tabla</p>
                    <button @click="configTable = 'random'" :class="`w-full py-2 rounded-lg font-bold text-xs border-2 transition-all flex items-center justify-center gap-2 ${configTable === 'random' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`">🎲 Tablas Aleatorias</button>
                    <div class="grid grid-cols-5 gap-2">
                        <button v-for="n in 10" :key="n" @click="configTable = n" :class="`aspect-square rounded-lg font-black text-sm border-2 transition-all flex items-center justify-center ${configTable === n ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`">{{ n }}</button>
                    </div>
                </div>

                <button @click="startGame" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-lg shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-2">
                    <Play :size="20" fill="currentColor" /> ¡JUGAR!
                </button>
            </div>
        </div>

        <header class="flex justify-between items-center w-full z-30 mb-2">
            <div class="flex gap-2">
                <button @click="handleExitClick" class="p-2 bg-white rounded-full text-indigo-600 shadow-md border-2 border-indigo-100 active:scale-95 transition-transform"><LogOut :size="20" class="transform rotate-180" /></button>
                
                <button @click="showMissions = true" class="px-3 py-1 bg-gradient-to-b from-orange-400 to-red-500 rounded-full text-white shadow-md border-2 border-red-200 hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 font-black">
                    <Flame :size="18" fill="currentColor" class="text-yellow-300" />
                    {{ gamificationStore.currentStreak || 0 }}
                </button>
            </div>
             
            <div class="bg-white px-4 py-1 rounded-full shadow-md hidden sm:block"><span class="text-lg font-black text-indigo-600 tracking-wider">MATERIAS</span></div>
             
            <button @click="showShop = true" class="p-2 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full text-yellow-900 shadow-lg border-2 border-yellow-200 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center animate-bounce-slow relative">
                 <ShoppingBag :size="20" stroke-width="2.5" />
                 <span class="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
        </header>

        <div class="w-full grid grid-cols-2 px-2 z-20 mb-2 items-end h-32 shrink-0">
           <div class="flex items-center justify-center pb-2">
               <div v-if="showOwl" class="bg-white rounded-xl p-3 shadow-lg border-2 border-indigo-200 relative animate-fade-in w-full text-center transition-all duration-500">
                  <p class="text-indigo-900 font-bold text-sm">{{ greeting }}</p>
               </div>
           </div>
           <div class="flex flex-col items-center justify-end">
               <div v-if="showOwl" class="w-20 h-20 mb-1 transition-all duration-500"><OwlImage customClass="w-full h-full object-contain" /></div>
               
               <div class="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-2 border border-white/30 shadow-sm w-full">
                  <User :size="14" class="text-white" />
                  <input v-if="isEditingName" type="text" v-model="studentName" @keyup.enter="saveName" class="bg-transparent text-white font-bold text-xs outline-none w-full" autoFocus />
                  <span v-else class="text-white font-bold text-xs truncate w-full cursor-pointer" @click="isEditingName = true">{{ studentName || "Tu Nombre" }}</span>
                  <button v-if="isEditingName" @click="saveName"><Check :size="14" class="text-green-300" /></button>
                  <Pencil v-else :size="12" class="text-indigo-200" />
               </div>
           </div>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:gap-6 w-full py-4 z-10 px-2 flex-none">
          <button v-for="opt in options" :key="opt.id" @click="openConfig(opt.id)"
            class="group bg-white p-3 sm:p-4 rounded-3xl border-4 border-white hover:border-indigo-200 shadow-xl active:scale-95 flex flex-col items-center justify-center gap-2 h-full min-h-[110px] sm:min-h-[130px] transition-all">
            <div :class="`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${opt.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`">
              <component :is="opt.icon" :size="24" class="text-white" :stroke-width="3" />
            </div>
            <div class="text-center">
              <h3 class="text-lg sm:text-xl font-black text-slate-800 leading-none">{{ opt.label }}</h3>
              <p class="text-slate-500 font-bold text-[9px] sm:text-[10px] mt-1 tracking-wide uppercase">{{ opt.desc }}</p>
            </div>
          </button>
        </div>

        <div class="px-2 w-full z-10 mb-2">
            <button @click="showQuiz = true" class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-1 shadow-[0_6px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none transition-all group">
                <div class="bg-white/20 rounded-2xl p-3 flex items-center gap-4">
                    <div class="w-12 h-12 shrink-0 rounded-full bg-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-inner">
                        <Zap size="28" class="text-orange-500" fill="currentColor" />
                    </div>
                    <div class="text-left text-white">
                        <h3 class="font-black text-lg leading-tight uppercase tracking-wide">Desafío Contrarreloj</h3>
                        <p class="text-orange-100 text-[10px] font-bold mt-0.5">⏱️ 60 segundos para ganar Plata</p>
                    </div>
                </div>
            </button>
        </div>

        <div class="mt-auto w-full flex flex-col gap-2 z-20 pb-4 px-2">
            <div class="bg-indigo-50/90 rounded-2xl border-2 border-indigo-100 p-2 sm:p-3 flex items-center justify-center gap-3 shadow-sm w-full animate-fade-in">
                <BookOpen class="text-indigo-600 shrink-0" :size="18" />
                <p class="text-slate-800 text-[11px] sm:text-xs font-black italic text-center leading-tight">
                    {{ randomIncentive }}
                </p>
            </div>
            <StatusBoard />
        </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-bounce-slow { animation: float 3s ease-in-out infinite; }
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
}
</style>