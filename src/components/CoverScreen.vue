<script setup>
/** * ARCHIVO: CoverScreen.vue
 * NOTA INTERNA: SISTEMA INTEGRAL v15.0.2 - LAYOUT COMPACTO & TOASTS FLOTANTES
 * LOGICA: Motor RGPD Estricto (3 Selects) + Radar Múltiple. 
 * ESTADO: Cero rueda libre en móviles. Rodillo táctil controlado 100%.
 */
import { ref, onMounted, reactive, watch, computed } from 'vue'; 
import { auth, db } from '../firebaseConfig'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { 
  X, ChevronLeft, Info, Eye, EyeOff, AlertCircle, CheckCircle, 
  Settings, RefreshCw, ChevronRight, Bell, HelpCircle, 
  History, Sparkles, Calendar as CalendarIcon, Zap, Search, ShieldAlert, AlertTriangle,
  ArrowRight, ArrowDown
} from 'lucide-vue-next';
import OwlImage from './OwlImage.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import userIcon from '@/assets/icono.png'; 
import { playOwlHoot } from '../utils/sound';

import GuideView from './GuideView.vue';
import LegalView from './LegalView.vue';
import AccountSettings from './AccountSettings.vue'; 

import pkg from '../../package.json';
import { useGamificationStore } from '../stores/useGamificationStore';

const props = defineProps({
  forceAuthMode: { type: String, default: null }
});

const emit = defineEmits(['start', 'showWelcome']);
const store = useGamificationStore();

// --- ESTADOS VISUALES ---
const showModal = ref(false);
const activeSubView = ref('auth'); 

// --- BITÁCORA ---
const historyData = ref([]);
const hasUnseenNews = ref(false);
const showHistoryModal = ref(false);

const authMode = ref('login'); 
const isLoading = ref(false); 

// 🛡️ CANALES DE FEEDBACK GLOBALES
const customError = ref("");
const customSuccess = ref("");
const showSuccessCheck = ref(false); 

// 🛡️ CANALES DE FEEDBACK RECUPERACIÓN
const recoveryError = ref("");
const recoverySuccessMsg = ref("");

// --- 🔑 ACCESO Y RECUPERACIÓN ---
const showRecovery = ref(false); 
const recoveryMode = ref('email'); 
const showPassword = ref(false); 

// Array para guardar múltiples cuentas encontradas (Homónimos)
const foundAccounts = ref([]);

const acceptedTerms = ref(false);
const isExistingUser = ref(false);
const hasReadLegal = ref(false); 

const form = reactive({ username: '', email: '', password: '' });

// ============================================================================
// 🛡️ MOTOR FÉRREO DE FECHAS (3 SELECTS - ANTI RUEDA LIBRE)
// ============================================================================
const birthDay = ref("");
const birthMonth = ref("");
const birthYear = ref("");

const today = new Date();
const currentYear = today.getFullYear();
const currentMonthNum = today.getMonth() + 1;
const currentDayNum = today.getDate();

const maxAllowedYear = currentYear - 14; 

// 1. Años: Desde (Año Actual - 14) bajando hasta 1900
const yearsList = computed(() => {
    const arr = [];
    for (let y = maxAllowedYear; y >= 1900; y--) arr.push(y);
    return arr;
});

// 2. Meses: Bloqueo inteligente si seleccionan el año tope
const allMonths = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

const monthsList = computed(() => {
    if (birthYear.value && parseInt(birthYear.value) === maxAllowedYear) {
        return allMonths.slice(0, currentMonthNum); 
    }
    return allMonths;
});

// 3. Días: Bloqueo inteligente según mes bisiesto y día tope exacto
const daysList = computed(() => {
    if (!birthMonth.value || !birthYear.value) return [];
    
    const y = parseInt(birthYear.value);
    const m = parseInt(birthMonth.value);
    
    let maxDaysInSelectedMonth = new Date(y, m, 0).getDate(); 
    
    if (y === maxAllowedYear && m === currentMonthNum) {
        maxDaysInSelectedMonth = Math.min(maxDaysInSelectedMonth, currentDayNum);
    }
    
    const arr = [];
    for (let d = 1; d <= maxDaysInSelectedMonth; d++) {
        arr.push(d < 10 ? `0${d}` : `${d}`);
    }
    return arr;
});

watch([birthYear, birthMonth], ([newY, newM]) => {
    if (newY && parseInt(newY) === maxAllowedYear && newM && parseInt(newM) > currentMonthNum) {
        birthMonth.value = ""; birthDay.value = "";
    } else if (newY && newM && birthDay.value) {
        const maxD = (parseInt(newY) === maxAllowedYear && parseInt(newM) === currentMonthNum) 
                     ? currentDayNum 
                     : new Date(parseInt(newY), parseInt(newM), 0).getDate();
        if (parseInt(birthDay.value) > maxD) birthDay.value = ""; 
    }
});

const formattedDate = computed(() => {
  if (!birthDay.value || !birthMonth.value || !birthYear.value) return "";
  return `${birthDay.value}/${birthMonth.value}/${birthYear.value}`;
});
// ============================================================================


const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email.toLowerCase());
};

const clearMessages = () => { customError.value = ""; customSuccess.value = ""; };
const clearRecoveryMessages = () => { recoveryError.value = ""; recoverySuccessMsg.value = ""; };
const clearDateFields = () => { birthDay.value = ""; birthMonth.value = ""; birthYear.value = ""; };

watch(recoveryMode, () => {
  clearMessages(); clearRecoveryMessages(); foundAccounts.value = []; clearDateFields();
});

watch(authMode, () => { clearMessages(); clearDateFields(); });

// --- 🔎 FUNCIONES FIREBASE DE RECUPERACIÓN (RADAR MÚLTIPLE + SEGURIDAD FIRESTORE) ---

const findEmailClue = async () => {
  clearRecoveryMessages();
  const nombre = form.username.trim();
  if (!nombre) { recoveryError.value = "¡Alto ahí! Necesitamos saber tu nombre de alumno."; return; }
  if (!formattedDate.value) { recoveryError.value = "El Búho necesita tu fecha de nacimiento completa para buscar."; return; }
  
  const nombreBusqueda = nombre.toLowerCase();
  isLoading.value = true;
  foundAccounts.value = [];
  
  try {
    let q = query(collection(db, "users"), where("username_lower", "==", nombreBusqueda), limit(3));
    let snap = await getDocs(q);

    if (snap.empty) {
      q = query(collection(db, "users"), where("username", "==", nombre), limit(3));
      snap = await getDocs(q);
    }

    if (snap.empty) {
      recoveryError.value = "No encontramos ningún pergamino con ese nombre. ¿Seguro que lo escribiste bien?";
    } else {
      
      snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.birthDate && data.birthDate !== formattedDate.value) return;

          const realEmail = data.email;
          const [u, d] = realEmail.split('@');
          const visiblePart = u.substring(0, Math.min(3, u.length));
          const hiddenPart = "*".repeat(Math.max(3, u.length - visiblePart.length));
          
          foundAccounts.value.push({
              realEmail: realEmail,
              clueEmail: `${visiblePart}${hiddenPart}@${d}`
          });
      });

      if (foundAccounts.value.length === 0) {
          recoveryError.value = "Encontramos el nombre, pero la fecha de nacimiento no coincide. El Búho no puede darte acceso.";
      } else {
          recoverySuccessMsg.value = foundAccounts.value.length > 1 
                                     ? "¡Hay varios Capitanes con ese nombre! ¿Reconoces tu cuenta?"
                                     : "¡Te encontramos en los registros!";
      }
    }
  } catch (e) { 
    console.error("⛔ [ERROR RADAR BÚHO]:", e); 
    if (e.code === 'permission-denied') {
        recoveryError.value = "Bloqueo de seguridad: Tus reglas de base de datos no permiten esta búsqueda.";
    } else {
        recoveryError.value = "Tormenta de red. El radar del Búho está fallando."; 
    }
  } finally { isLoading.value = false; }
};

const closeRecovery = () => {
    showRecovery.value = false; authMode.value = 'login'; clearMessages(); clearRecoveryMessages(); clearDateFields();
};

const useClueAndLogin = (realEmail) => {
    form.email = realEmail;
    closeRecovery(); 
    customSuccess.value = "¡Dato anotado mágicamente! 🪄 Solo falta tu contraseña.";
};

const handleForgotPassword = async () => {
  clearRecoveryMessages();
  const mail = form.email.trim().toLowerCase();
  if (!isValidEmail(mail)) { recoveryError.value = "Escribe un correo válido en la caja para enviarte la llave."; return; }
  isLoading.value = true;
  try {
    const q = query(collection(db, "users"), where("email", "==", mail), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      recoveryError.value = "Ese correo no tiene un nido asignado todavía.";
    } else {
      await sendPasswordResetEmail(auth, mail);
      console.log("✅ [ÉXITO AUTH]: Firebase reporta que el correo ha sido enviado a:", mail);
      recoverySuccessMsg.value = `¡Hechizo enviado! 🪄 Revisa la bandeja de entrada (o SPAM) de ${mail} para crear tu nueva llave.`;
    }
  } catch (e) { 
    console.error("⛔ [ERROR FIREBASE AUTH]:", e);
    recoveryError.value = e.code === 'auth/too-many-requests' ? "Has intentado muchas veces. Espera unos minutos." : "Error al intentar crear el enlace mágico."; 
  } finally { isLoading.value = false; }
};

// 🛡️ MOTOR PRINCIPAL DE AUTENTICACIÓN
const handleAuth = async () => {
  clearMessages();
  const cleanEmail = form.email.trim().toLowerCase();
  const cleanPass = form.password.trim();
  const cleanUser = form.username.trim();

  if (!isValidEmail(cleanEmail)) { customError.value = "Ese correo parece un poco raro. Revísalo bien."; return; }
  if (cleanPass.length < 6) { customError.value = "Para volar seguro, tu CONTRASEÑA debe tener al menos 6 caracteres."; return; }
  
  if (authMode.value === 'register') {
    if (!cleanUser) { customError.value = "¡Alto ahí! Necesitamos saber tu nombre de alumno para dejarte pasar."; return; }
    if (!formattedDate.value) { customError.value = "El Búho dice que tu fecha de nacimiento no está completa."; return; }
    
    if (!acceptedTerms.value) { 
      customError.value = "Haz clic en la cápsula debajo para leer y aceptar el Marco Legal."; 
      activeSubView.value = 'legal'; 
      return; 
    }
  }

  isLoading.value = true;
  try {
    if (authMode.value === 'register') {
      const q = query(collection(db, "users"), where("username_lower", "==", cleanUser.toLowerCase()), limit(1));
      const nameCheckSnap = await getDocs(q);
      if (!nameCheckSnap.empty) {
          customError.value = `¡Oh oh! Ya existe un Capitán llamado '${cleanUser}'. Intenta agregarle un número u otra palabra.`;
          isLoading.value = false;
          return;
      }

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      await setDoc(doc(db, "users", cred.user.uid), {
        username: cleanUser, 
        username_lower: cleanUser.toLowerCase(), 
        email: cleanEmail, 
        birthDate: formattedDate.value, 
        createdAt: Date.now(), 
        acceptedLegal: true, 
        stats: { gold:0, silver:0, copper:0 }
      });
      customSuccess.value = `¡Bienvenido al Nido, Capitán ${cleanUser}! Preparando motores...`;
    } else {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    }
    localStorage.setItem('buho_last_login', Date.now().toString());
    showModal.value = false;
    emit('start');
  } catch (e) {
    const errorCode = e.code || "";
    if (errorCode === 'auth/email-already-in-use') customError.value = "Ese correo ya tiene un nido asignado. ¡Ve a 'Entrar'!";
    else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') customError.value = "Contraseña incorrecta. El Búho necesita tu llave real.";
    else if (errorCode === 'auth/too-many-requests') customError.value = "¡Ouch! Demasiados intentos fallidos. Puerta bloqueada temporalmente.";
    else if (errorCode === 'auth/network-request-failed') customError.value = "Cortocircuito de red. El Búho no puede volar sin internet.";
    else customError.value = `Error inesperado: ${e.message}`;
  } finally { isLoading.value = false; }
};

const handleLegalAcceptedFromInside = () => {
  acceptedTerms.value = true; hasReadLegal.value = true; activeSubView.value = 'auth';
  showSuccessCheck.value = true; setTimeout(() => { showSuccessCheck.value = false; }, 4000);
};

const closeAndReset = () => {
  showModal.value = false; activeSubView.value = 'auth'; showRecovery.value = false;
  clearMessages(); clearRecoveryMessages(); clearDateFields();
  form.username = ''; form.email = ''; form.password = ''; foundAccounts.value = [];
};

const openHistory = () => {
  showHistoryModal.value = true;
  if (historyData.value.length > 0) {
    store.lastSeenUpdateId = historyData.value[0].updateId; store.syncAllToCloud(); hasUnseenNews.value = false;
  }
};

const checkAccess = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().acceptedLegal) {
          acceptedTerms.value = true; isExistingUser.value = true; hasReadLegal.value = true;
      }
      const lastLogin = localStorage.getItem('buho_last_login');
      if (lastLogin && (Date.now() - parseInt(lastLogin) < 3 * 24 * 60 * 60 * 1000)) emit('start');
      else emit('showWelcome'); 
    } else emit('showWelcome'); 
  });
};

const handleStartButton = () => { playOwlHoot(); checkAccess(); };

onMounted(async () => {
  if (props.forceAuthMode) { authMode.value = props.forceAuthMode; showModal.value = true; }
  const APP_VERSION = pkg.version; 
  if (localStorage.getItem('buho_app_version') !== APP_VERSION) {
    localStorage.setItem('buho_app_version', APP_VERSION); localStorage.removeItem('buho_last_login'); 
    window.location.reload(true); return; 
  }
  try {
    const res = await fetch('/update-history.json?t=' + Date.now());
    if (res.ok) {
      historyData.value = await res.json();
      if (historyData.value.length > 0 && store.lastSeenUpdateId !== historyData.value[0].updateId) hasUnseenNews.value = true;
    }
  } catch (e) {}
});
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas shadow-pc">
      <SimpleConfetti :isActive="true" />
      
      <div v-if="(customError || customSuccess) && !showRecovery" class="absolute top-8 left-0 right-0 z-[2000] flex justify-center px-4 pointer-events-none">
          <div v-if="customError" class="w-full max-w-md p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 shadow-2xl animate-toast-down pointer-events-auto backdrop-blur-md">
              <AlertCircle class="text-red-500 shrink-0 mt-0.5" :size="18" />
              <p class="text-[11px] font-bold text-red-700 leading-tight italic flex-1">{{ customError }}</p>
              <button @click="clearMessages" class="shrink-0 text-red-400 active:scale-90 p-1"><X :size="16"/></button>
          </div>
          <div v-if="customSuccess" class="w-full max-w-md p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 shadow-2xl animate-toast-down pointer-events-auto backdrop-blur-md">
              <CheckCircle class="text-emerald-500 shrink-0 mt-0.5" :size="18" />
              <p class="text-[11px] font-bold text-emerald-800 leading-tight italic flex-1">{{ customSuccess }}</p>
              <button @click="clearMessages" class="shrink-0 text-emerald-400 active:scale-90 p-1"><X :size="16"/></button>
          </div>
      </div>

      <div class="header-mentor">
          <div class="mentor-avatar"><img :src="userIcon" alt="Mentor" /></div>
          <div class="mentor-info text-white">
              <h3 class="font-bold text-sm leading-tight drop-shadow-md">Jorge Andrade</h3>
              <p class="text-[10px] font-medium opacity-90 uppercase tracking-widest">Mentor Digital & IA</p>
          </div>
      </div>

      <div class="main-hero-area">
        <h1 class="main-title animate-pop-in">Búho <span class="block text-yellow-300">Matemático</span></h1>
        <div class="owl-hero-container owl-delayed"><OwlImage customClass="owl-img-responsive" /></div>
        <button @click="handleStartButton" class="btn-empezar btn-delayed bg-yellow-400 text-indigo-900 font-black py-4 rounded-full shadow-[0_8px_0_rgb(180,83,9)]">
          <span class="uppercase">¡Empezar!</span>
        </button>
      </div>

      <footer class="footer-anclado">
          <div @click="openHistory" class="relative inline-flex flex-col items-center cursor-pointer group">
              <div v-if="hasUnseenNews" class="absolute -top-1 -right-2 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-indigo-900 animate-pulse z-10"></div>
              <p class="text-sm font-bold text-white drop-shadow-sm group-hover:text-yellow-300 transition-colors">@Copyright 2026</p>
              <p class="text-xs font-medium text-white/80 drop-shadow-sm flex items-center gap-1">
                Búho Mate v{{ pkg.version }} <Bell :size="12" :class="{'text-orange-400': hasUnseenNews}" />
              </p>
          </div>
      </footer>

      <div v-if="showModal" class="absolute inset-0 bg-indigo-900/60 z-[100] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm overflow-hidden">
        <div class="bg-white w-full max-w-md sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-x-0 sm:border-4 border-yellow-400 relative flex flex-col h-full sm:h-[85vh] animate-pop-in">
          
          <div class="px-4 py-2 border-b flex justify-between items-center bg-slate-50 shrink-0 z-50">
              <button v-if="activeSubView !== 'auth' || showRecovery" @click="showRecovery ? closeRecovery() : (activeSubView = 'auth')" class="flex items-center gap-1 text-indigo-600 font-black text-[10px] uppercase bg-white px-2.5 py-1 rounded-full shadow-sm border border-slate-100">
                  <ChevronLeft :size="14"/> Volver
              </button>
              <div v-else class="w-8"></div>
              <h2 class="text-[10px] font-black text-indigo-900 uppercase tracking-widest text-center flex-1 px-2">
                  {{ activeSubView === 'settings' ? 'DARSE DE BAJA' : (showRecovery ? 'RECUPERAR' : (authMode === 'register' ? 'Nuevo Alumno' : 'Entrar al Nido')) }}
              </h2>
              <button @click="closeAndReset" class="bg-indigo-50 text-indigo-900 p-1.5 rounded-full shadow-md active:scale-90 transition-transform">
                <X :size="18" stroke-width="3.5" />
              </button>
          </div>

          <div class="flex-1 overflow-y-auto scroll-interno bg-white relative">
              <div v-if="activeSubView === 'auth'" class="p-5 flex flex-col justify-start relative h-full">
                  
                  <template v-if="!showRecovery">
                    <div class="space-y-2 relative z-10">
                        <template v-if="authMode === 'register'">
                          <div>
                            <label class="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nombre Alumno</label>
                            <input v-model="form.username" placeholder="Tu Apodo de Capitán" class="w-full p-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold text-slate-700" />
                          </div>

                          <div class="space-y-1">
                            <label class="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Fecha de Nacimiento</label>
                            
                            <div class="flex gap-2 w-full mt-1">
                                <select v-model="birthDay" class="flex-1 p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 text-center cursor-pointer appearance-none text-sm">
                                    <option value="" disabled>Día</option>
                                    <option v-for="d in daysList" :key="d" :value="d">{{ d }}</option>
                                </select>
                                <select v-model="birthMonth" class="flex-[1.5] p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 text-center cursor-pointer appearance-none text-sm">
                                    <option value="" disabled>Mes</option>
                                    <option v-for="m in monthsList" :key="m.value" :value="m.value">{{ m.label }}</option>
                                </select>
                                <select v-model="birthYear" class="flex-1 p-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 text-center cursor-pointer appearance-none text-sm">
                                    <option value="" disabled>Año</option>
                                    <option v-for="y in yearsList" :key="y" :value="y">{{ y }}</option>
                                </select>
                            </div>

                            <p class="text-[10px] font-bold text-slate-400 ml-2 flex items-center gap-1 mt-1 opacity-100">
                               <Info :size="10" class="text-indigo-400 shrink-0" />
                               <span>Edad mínima: 14 años. Si eres menor, pide a un adulto que te inscriba.</span>
                            </p>
                          </div>
                        </template>

                        <div>
                          <label class="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Correo Electrónico</label>
                          <input v-model="form.email" type="email" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="email@ejemplo.com" class="lowercase w-full p-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold focus:border-indigo-500 text-slate-700" />
                        </div>

                        <div class="relative">
                          <label class="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">CONTRASEÑA</label>
                          <input :type="showPassword ? 'text' : 'password'" v-model="form.password" class="w-full p-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold focus:border-indigo-500 text-slate-700" autocapitalize="none" />
                          <button @click="showPassword = !showPassword" type="button" class="absolute right-3 bottom-2.5 text-slate-400"><component :is="showPassword ? EyeOff : Eye" :size="18"/></button>
                        </div>

                        <div @click="activeSubView = 'legal'" class="relative flex items-center gap-3 p-2 rounded-2xl border bg-indigo-50/50 border-indigo-100 cursor-pointer hover:bg-indigo-100/50 transition-all">
                            <div v-if="hasReadLegal" class="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg z-30 animate-latent"><CheckCircle :size="16" stroke-width="3" /></div>
                            <input type="checkbox" v-model="acceptedTerms" class="w-4 h-4 accent-indigo-600 pointer-events-none" tabindex="-1" />
                            <p class="text-[10px] font-medium text-slate-600">Acepto el <span class="text-indigo-600 font-bold underline">Marco Legal</span>.</p>
                        </div>
                    </div>

                    <div class="mt-2 space-y-3 relative z-10 flex flex-col justify-start">
                        <button @click="handleAuth" :disabled="isLoading" class="w-full bg-indigo-600 text-white font-black italic text-lg uppercase rounded-[2rem] border-b-[6px] border-indigo-900 py-2.5 shadow-lg active:translate-y-1 flex items-center justify-center transition-all">
                          <span v-if="!isLoading">{{ authMode === 'register' ? 'CREAR CUENTA' : 'ENTRAR AL NIDO' }}</span>
                          <RefreshCw v-else class="animate-spin" />
                        </button>

                        <div v-if="authMode === 'register'" class="space-y-2 pt-1">
                            <div class="flex items-center gap-2 px-2">
                                <div class="w-10 h-10 shrink-0 bg-indigo-100 rounded-full border-2 border-indigo-200 shadow-inner flex items-center justify-center overflow-hidden animate-pulse-slow"><OwlImage customClass="w-full h-full object-cover transform scale-110 mt-1" /></div>
                                <button @click="authMode = 'login'; clearMessages();" class="flex-1 bg-emerald-50/80 rounded-xl py-2 px-3 text-[11px] font-bold text-slate-600 shadow-sm flex items-center justify-between active:scale-95 transition-transform group animate-latent-gold-soft border border-emerald-200">
                                    <span>¿Estás inscrito? NO ES POR AQUÍ, pero pulsa y volamos juntos a tu portal.</span>
                                </button>
                            </div>
                        </div>

                        <div v-if="authMode === 'login'" class="space-y-2 pt-1">
                            <div class="flex items-center gap-2 px-2">
                                <div class="w-10 h-10 shrink-0 bg-orange-100 rounded-full border-2 border-orange-200 shadow-inner flex items-center justify-center overflow-hidden animate-pulse-slow"><OwlImage customClass="w-full h-full object-cover transform scale-110 mt-1" /></div>
                                <button @click="authMode = 'register'; clearMessages();" class="flex-1 bg-emerald-50/80 rounded-xl py-2 px-3 text-[11px] font-bold text-slate-600 shadow-sm flex items-center justify-center active:scale-95 transition-transform group animate-latent-gold-soft border border-emerald-200">
                                    <span>¿Eres un NUEVO ALUMNO?, NO ES POR AQUÍ, pero pulsa y volamos juntos a tu portal, o usa el texto azul de "crear una cuenta nueva"</span>
                                </button>
                            </div>
                            <div class="text-center pt-2">
                                <p class="text-[10px] font-bold text-slate-400 mb-1">SUSCRÍBETE EN EL LINK</p>
                                <button @click="authMode = 'register'; clearMessages();" class="text-indigo-700 font-black text-xs uppercase underline active:text-indigo-900 transition-colors">¡Crear una cuenta nueva!</button>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 pt-4 border-t border-slate-100 z-20 w-full">
                        <div class="flex gap-2 mb-2">
                          <button @click="activeSubView = 'guide'" class="flex-1 bg-indigo-50 text-indigo-600 font-black text-[11px] uppercase py-2.5 rounded-full border border-indigo-100 flex items-center justify-center gap-1"><Info :size="15"/> GUÍA DE USO</button>
                          <button @click="activeSubView = 'settings'" class="flex-1 bg-slate-100 text-slate-600 font-black text-[11px] uppercase py-2.5 rounded-full border border-slate-200 flex items-center justify-center gap-1"><Settings :size="15"/> CUENTA</button>
                        </div>
                        <div class="text-center">
                          <button v-if="authMode === 'login'" @click="showRecovery = true; clearMessages(); clearRecoveryMessages();" class="text-orange-700 font-black underline text-[11px] uppercase italic">¿Olvidaste algo?</button>
                        </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="flex-1 flex flex-col justify-start animate-fade-in text-center px-2 mb-8 mt-2">
                        <h2 class="text-base font-black text-indigo-900 mb-4 font-inter uppercase">Recuperar Cuenta</h2>

                        <div v-if="!recoverySuccessMsg" class="flex bg-slate-100 p-1.5 rounded-2xl text-[11px] font-black uppercase tracking-widest mb-4">
                            <button @click="recoveryMode = 'email'" :class="`flex-1 py-3 rounded-xl transition-all ${recoveryMode === 'email' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`">¿OLVIDASTE EL CORREO?</button>
                            <button @click="recoveryMode = 'password'" :class="`flex-1 py-3 rounded-xl transition-all ${recoveryMode === 'password' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`">¿LA CONTRASEÑA?</button>
                        </div>
                        
                        <div v-if="recoveryError && !recoverySuccessMsg" class="w-full p-3 mb-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 shadow-sm animate-pop-in">
                            <AlertCircle class="text-red-500 shrink-0 mt-0.5" :size="18" />
                            <p class="text-[11px] font-bold text-red-700 leading-tight italic flex-1 text-left">{{ recoveryError }}</p>
                            <button @click="clearRecoveryMessages" class="shrink-0 text-red-400 active:scale-90 p-1"><X :size="16"/></button>
                        </div>

                        <div v-if="recoverySuccessMsg" class="animate-fade-in flex flex-col items-center justify-center py-6">
                            <div class="w-16 h-16 bg-emerald-100 rounded-full border-4 border-emerald-200 flex items-center justify-center mb-4 shadow-inner">
                                <CheckCircle class="text-emerald-500" size="32" />
                            </div>
                            <h3 class="text-lg font-black text-emerald-800 mb-2 uppercase tracking-tight">{{ recoveryMode === 'password' ? '¡HECHIZO ENVIADO!' : '¡TE ENCONTRAMOS!' }}</h3>
                            <p class="text-xs font-medium text-slate-600 mb-6 px-4 leading-relaxed">{{ recoverySuccessMsg }}</p>
                            
                            <div v-if="recoveryMode === 'email' && foundAccounts.length > 0" class="w-full space-y-3 mb-6">
                                <div v-for="(acc, index) in foundAccounts" :key="index" class="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-3 flex flex-col items-center gap-2">
                                    <p class="text-sm font-black text-indigo-900 tracking-wider">{{ acc.clueEmail }}</p>
                                    <button @click="useClueAndLogin(acc.realEmail)" class="w-[85%] bg-indigo-600 text-white font-black py-2 rounded-lg shadow-md uppercase text-[10px] active:scale-95 transition-transform flex items-center justify-center gap-1">
                                        ¡USAR ESTA CUENTA! <ArrowRight size="12" />
                                    </button>
                                </div>
                            </div>

                            <button @click="closeRecovery" class="text-slate-500 font-black text-xs uppercase underline mt-2">VOLVER AL LOGIN</button>
                        </div>

                        <div v-else-if="recoveryMode === 'email' && !recoverySuccessMsg" class="space-y-3">
                          <input v-model="form.username" placeholder="Escribe tu Nombre" autocapitalize="none" autocorrect="off" spellcheck="false" class="lowercase w-full p-3 border-2 border-orange-200 rounded-2xl text-center font-bold text-sm outline-none text-slate-700" />
                          
                          <div class="flex gap-2 w-full mt-2">
                                <select v-model="birthDay" class="flex-1 p-2.5 bg-slate-50 border-2 border-orange-200 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-500 text-center cursor-pointer appearance-none text-sm">
                                    <option value="" disabled>Día</option>
                                    <option v-for="d in daysList" :key="d" :value="d">{{ d }}</option>
                                </select>
                                <select v-model="birthMonth" class="flex-[1.5] p-2.5 bg-slate-50 border-2 border-orange-200 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-500 text-center cursor-pointer appearance-none text-sm">
                                    <option value="" disabled>Mes</option>
                                    <option v-for="m in monthsList" :key="m.value" :value="m.value">{{ m.label }}</option>
                                </select>
                                <select v-model="birthYear" class="flex-1 p-2.5 bg-slate-50 border-2 border-orange-200 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-500 text-center cursor-pointer appearance-none text-sm">
                                    <option value="" disabled>Año</option>
                                    <option v-for="y in yearsList" :key="y" :value="y">{{ y }}</option>
                                </select>
                          </div>
                          
                          <button @click="findEmailClue" :disabled="isLoading" class="w-full bg-orange-500 text-white font-black py-3.5 rounded-2xl shadow-lg uppercase text-xs active:scale-95 transition-transform flex items-center justify-center mt-3">
                            <span v-if="!isLoading">BUSCAR PISTA 🦉</span>
                            <RefreshCw v-else class="animate-spin text-white" size="18" />
                          </button>
                        </div>
                        
                        <div v-else-if="recoveryMode === 'password' && !recoverySuccessMsg" class="space-y-3">
                          <input v-model="form.email" type="email" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Escribe tu Correo" class="lowercase w-full p-3 border-2 border-orange-200 rounded-2xl text-center font-bold text-sm outline-none text-slate-700" />
                          
                          <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-2 mt-4">
                              <p class="text-[10px] text-slate-500 font-bold mb-2">Te enviaremos una llave mágica a tu correo para cambiar tu contraseña.</p>
                              <button @click="handleForgotPassword" :disabled="isLoading" class="w-full bg-indigo-600 text-white font-black py-3.5 rounded-2xl shadow-lg uppercase text-xs active:scale-95 transition-transform flex items-center justify-center">
                                  <span v-if="!isLoading">✨ ENVIAR ENLACE MÁGICO ✨</span>
                                  <RefreshCw v-else class="animate-spin text-white" size="18" />
                              </button>
                          </div>
                        </div>
                        
                        <button v-if="!recoverySuccessMsg" @click="closeRecovery" class="text-slate-500 font-black text-xs uppercase underline mt-6">VOLVER AL LOGIN</button>
                    </div>
                  </template>

              </div>
              <div v-if="activeSubView === 'guide'" class="h-full flex flex-col p-4"><GuideView /></div>
              <div v-if="activeSubView === 'legal'" class="h-full flex flex-col p-4"><LegalView :currentStatus="acceptedTerms" @accepted="handleLegalAcceptedFromInside" /></div>
              <div v-if="activeSubView === 'settings'" class="h-full"><AccountSettings @close="activeSubView = 'auth'" /></div>
          </div>
        </div>
      </div>

      <Transition name="fade">
        <div v-if="showHistoryModal" class="absolute inset-0 z-[1000] flex items-center justify-center p-4 bg-silver-gradient backdrop-blur-md">
          <div class="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border-4 border-indigo-600 flex flex-col max-h-[85vh] animate-pop-in">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative shrink-0">
               <button @click="showHistoryModal = false" class="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"><X :size="20"/></button>
               <History class="mx-auto mb-2 opacity-50" :size="32" />
               <h2 class="text-2xl font-black italic uppercase tracking-tighter">Bitácora del Búho</h2>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll bg-slate-50/50">
               <div v-if="historyData.length === 0" class="text-center py-20 opacity-30"><Zap class="mx-auto mb-2" :size="48" /><p class="font-black uppercase text-xs">Sin registros</p></div>
               <div v-for="(update, index) in historyData" :key="update.updateId" class="relative pl-8 border-l-4 transition-all bg-white p-5 rounded-r-3xl shadow-sm border-indigo-100" :class="{'!border-orange-500 scale-[1.02]': index === 0 && hasUnseenNews}">
                 <div class="absolute -left-[14px] top-6 w-6 h-6 rounded-full border-4 border-slate-50 flex items-center justify-center" :class="index === 0 && hasUnseenNews ? 'bg-orange-500 animate-pulse' : 'bg-indigo-600'"><Sparkles v-if="index === 0" class="text-white" :size="10" /></div>
                 <div class="flex items-center justify-between mb-2">
                   <div class="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-lg"><Zap class="text-indigo-600" :size="12" /><span class="text-[11px] font-black text-indigo-700 uppercase">v{{ update.version }}</span></div>
                   <div class="flex items-center gap-1 text-slate-400"><CalendarIcon :size="10" /><span class="text-[10px] font-bold">{{ update.date }}</span></div>
                 </div>
                 <h4 class="text-sm font-black text-slate-800 uppercase mb-1">{{ update.title }}</h4>
                 <p class="text-xs text-slate-600 leading-relaxed font-medium">{{ update.description }}</p>
               </div>
            </div>
            <div class="p-6 bg-white border-t text-center"><button @click="showHistoryModal = false" class="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg active:scale-95 text-xs">¡RECIBIDO!</button></div>
          </div>
        </div>
      </Transition>

    </main>
  </div>
</template>

<style scoped>
/* CONTENEDOR MAESTRO */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; touch-action: none !important; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; background: linear-gradient(to bottom right, #6366f1, #a855f7); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; touch-action: none !important; -webkit-tap-highlight-color: transparent; width: 100vw; height: 100dvh; }

/* ADAPTACIÓN PC */
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); border: 8px solid white; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; } }

.bg-silver-gradient { background: linear-gradient(135deg, rgba(200, 200, 205, 0.9) 0%, rgba(240, 240, 245, 0.95) 50%, rgba(190, 190, 195, 0.9) 100%); }
.main-hero-area { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding-top: 8.5rem; }
.main-title { font-size: 3rem; font-weight: 900; color: white; text-align: center; line-height: 1; }
.owl-hero-container { width: 100%; max-width: 220px; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.3)); margin: 2rem 0; }
.btn-empezar { width: 85%; max-width: 280px; font-size: 1.5rem; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

@keyframes latent-button { 0%, 100% { transform: scale(1); box-shadow: 0 8px 0 rgb(180,83,9); } 50% { transform: scale(1.05); box-shadow: 0 8px 0 rgb(180,83,9), 0 0 35px 12px rgba(255, 255, 255, 0.5); } }
.footer-anclado { width: 100%; padding: 1rem; text-align: center; background: rgba(0,0,0,0.1); padding-bottom: 2.5rem !important; }
.mentor-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; overflow: hidden; border: 2px solid white; background: #fff; }
.mentor-avatar img { width: 100%; height: 100%; object-fit: cover; max-width: 100%; }
.header-mentor { position: absolute; top: 1.5rem; left: 1.5rem; display: flex; align-items: center; gap: 0.75rem; z-index: 50; }
.scroll-interno { scrollbar-width: none; -ms-overflow-style: none; }
.scroll-interno::-webkit-scrollbar { display: none; }
.custom-scroll { scrollbar-width: none; }
.custom-scroll::-webkit-scrollbar { display: none; }

.animate-toast-down { animation: toastDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes toastDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.animate-latent { animation: latent-pulse 2s infinite; }
@keyframes latent-pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
.animate-pulse-slow { animation: pulseSlow 3s infinite alternate; }
@keyframes pulseSlow { 0% { transform: scale(1); } 100% { transform: scale(1.05); box-shadow: inset 0 0 10px rgba(99, 102, 241, 0.3); } }
.animate-latent-gold-soft { animation: latent-gold-soft 2.5s infinite; }
@keyframes latent-gold-soft { 0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.5); } 70% { box-shadow: 0 0 0 6px rgba(250, 204, 21, 0); } 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.owl-delayed { opacity: 0; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s forwards; }
.btn-delayed { opacity: 0; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.8s forwards, latent-button 3s ease-in-out 1.3s infinite; }

/* Para forzar que no salga la flechita por defecto en los selects en algunos navegadores */
select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}
</style>