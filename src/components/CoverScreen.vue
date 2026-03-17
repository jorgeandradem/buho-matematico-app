<script setup>
/** * ARCHIVO: CoverScreen.vue
 * NOTA INTERNA: SISTEMA INTEGRAL v15.0.0 - LAYOUT COMPACTO & TOASTS FLOTANTES
 * LOGICA: Popups Globales (Cero Scroll) + Interespaciado Optimizado + UI Impecable.
 * ESTADO: Lógica blindada. Cintura y UI intactas.
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
  History, Sparkles, Calendar as CalendarIcon, Zap, Search, ShieldAlert, AlertTriangle
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

const emit = defineEmits(['start']);
const store = useGamificationStore();

// --- ESTADOS VISUALES ---
const showOwl = ref(false);
const showButton = ref(false);
const showModal = ref(false);
const activeSubView = ref('auth'); 

// --- BITÁCORA ---
const historyData = ref([]);
const hasUnseenNews = ref(false);
const showHistoryModal = ref(false);

const authMode = ref('login'); 
const isLoading = ref(false); 

// 🛡️ CANALES DE FEEDBACK (POPUPS FLOTANTES)
const customError = ref("");
const customSuccess = ref("");
const showSuccessCheck = ref(false); 

// --- 🔑 ACCESO Y RECUPERACIÓN ---
const showRecovery = ref(false); 
const recoveryMode = ref('email'); 
const emailClue = ref(""); 
const usernameClue = ref("");
const showPassword = ref(false); 

const acceptedTerms = ref(false);
const isExistingUser = ref(false);
const hasReadLegal = ref(false); 

// --- 🗓️ SISTEMA DE FECHA NATIVO ---
const birthDateRaw = ref(""); 
const nativeDateInput = ref(null);

const openDatePicker = () => {
  if (nativeDateInput.value) {
    if (nativeDateInput.value.showPicker) {
      nativeDateInput.value.showPicker();
    } else {
      nativeDateInput.value.click();
    }
  }
};

const maxDateLimit = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 14); // Bloqueo RGPD 14 años
  return d.toISOString().split("T")[0];
});

const formattedDate = computed(() => {
  if (!birthDateRaw.value) return "";
  const [y, m, d] = birthDateRaw.value.split("-");
  return `${d}/${m}/${y}`;
});

const form = reactive({ username: '', email: '', password: '' });

// Validación de Email Global
const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email.toLowerCase());
};

// Limpieza de mensajes
const clearMessages = () => {
  customError.value = "";
  customSuccess.value = "";
};

watch(recoveryMode, () => {
  clearMessages();
  emailClue.value = "";
  usernameClue.value = "";
});

// --- 🔎 FUNCIONES FIREBASE ---

const findEmailClue = async () => {
  clearMessages();
  const nombre = form.username.trim();
  if (!nombre) { customError.value = "⚠️ Escribe tu nombre de alumno."; return; }
  
  const nombreBusqueda = nombre.toLowerCase();
  isLoading.value = true;
  emailClue.value = "";
  
  try {
    let q = query(collection(db, "users"), where("username_lower", "==", nombreBusqueda), limit(1));
    let snap = await getDocs(q);

    if (snap.empty) {
      q = query(collection(db, "users"), where("username", "==", nombre), limit(1));
      snap = await getDocs(q);
    }

    if (snap.empty) {
      customError.value = "⛔ Alumno no registrado en el nido.";
    } else {
      const data = snap.docs[0].data();
      const [u, d] = data.email.split('@');
      emailClue.value = `${u.substring(0,3)}...@${d}`;
      customSuccess.value = "✅ Pista generada con éxito.";
    }
  } catch (e) { 
    customError.value = "⛔ Error de red al buscar pistas."; 
  } finally { isLoading.value = false; }
};

const findUsernameClue = async () => {
  clearMessages();
  const mail = form.email.trim().toLowerCase();
  if (!isValidEmail(mail)) { customError.value = "⚠️ Correo no válido."; return; }
  isLoading.value = true;
  usernameClue.value = "";
  try {
    const q = query(collection(db, "users"), where("email", "==", mail), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) customError.value = "⛔ Correo no registrado.";
    else {
      usernameClue.value = snap.docs[0].data().username;
      customSuccess.value = "✅ Identidad confirmada.";
    }
  } catch (e) { customError.value = "⛔ Error de red al consultar."; } finally { isLoading.value = false; }
};

const handleForgotPassword = async () => {
  clearMessages();
  const mail = form.email.trim().toLowerCase();
  if (!isValidEmail(mail)) { customError.value = "⚠️ Escribe un correo válido arriba."; return; }
  isLoading.value = true;
  try {
    const q = query(collection(db, "users"), where("email", "==", mail), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      customError.value = "⛔ Este correo no pertenece a ningún alumno.";
    } else {
      await sendPasswordResetEmail(auth, mail);
      customSuccess.value = `📧 ¡Enlace enviado! Revisa la bandeja de entrada o SPAM de: ${mail}`;
    }
  } catch (e) { 
    if (e.code === 'auth/too-many-requests') {
        customError.value = "⛔ Has intentado muchas veces. Espera unos minutos.";
    } else {
        customError.value = "⛔ Error al procesar tu solicitud de correo."; 
    }
  } 
  finally { isLoading.value = false; }
};

// 🛡️ MOTOR PRINCIPAL DE AUTENTICACIÓN
const handleAuth = async () => {
  clearMessages();
  const cleanEmail = form.email.trim().toLowerCase();
  const cleanPass = form.password.trim();
  const cleanUser = form.username.trim();

  if (!isValidEmail(cleanEmail)) { customError.value = "⚠️ Correo no válido."; return; }
  if (cleanPass.length < 6) { customError.value = "⚠️ La CONTRASEÑA requiere 6 caracteres."; return; }
  
  if (authMode.value === 'register') {
    if (!cleanUser) { customError.value = "⚠️ Falta el nombre del alumno."; return; }
    if (!birthDateRaw.value) { customError.value = "⚠️ Indica tu fecha de nacimiento."; return; }
    
    const birthYear = parseInt(birthDateRaw.value.split("-")[0]);
    if (new Date().getFullYear() - birthYear < 14) {
      customError.value = "⚠️ El registro es para mayores de 14 años. Pide a un adulto que te inscriba.";
      return;
    }
    
    if (!acceptedTerms.value) { 
      customError.value = "⚠️ Haz click en la cápsula para leer el Marco Legal."; 
      activeSubView.value = 'legal'; 
      return; 
    }
  }

  isLoading.value = true;
  try {
    if (authMode.value === 'register') {
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
    } else {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    }
    localStorage.setItem('buho_last_login', Date.now().toString());
    showModal.value = false;
    emit('start');
  } catch (e) {
    const errorCode = e.code || "";
    if (errorCode === 'auth/email-already-in-use') {
        customError.value = "⛔ Este correo ya pertenece a un alumno registrado. Ve a 'ENTRA'.";
    } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        customError.value = "⛔ Correo o CONTRASEÑA incorrectos.";
    } else if (errorCode === 'auth/too-many-requests') {
        customError.value = "⛔ Demasiados intentos fallidos. El Búho ha bloqueado el acceso temporalmente.";
    } else if (errorCode === 'auth/network-request-failed') {
        customError.value = "⛔ Cortocircuito de red. Verifica tu conexión a internet.";
    } else if (errorCode.includes('requests-from-referer') || errorCode.includes('blocked')) {
        customError.value = "⛔ El cortafuegos de Google Cloud bloqueó la IP local. Verifica las restricciones de la API Key.";
    } else {
        customError.value = `⛔ Error del sistema: ${e.message}`;
    }
  } finally { isLoading.value = false; }
};

const handleLegalAcceptedFromInside = () => {
  acceptedTerms.value = true;
  hasReadLegal.value = true; 
  activeSubView.value = 'auth';
  showSuccessCheck.value = true; 
  setTimeout(() => { showSuccessCheck.value = false; }, 4000);
};

const closeAndReset = () => {
  showModal.value = false;
  activeSubView.value = 'auth';
  showRecovery.value = false;
  clearMessages();
  form.username = ''; form.email = ''; form.password = '';
  birthDateRaw.value = "";
};

const openHistory = () => {
  showHistoryModal.value = true;
  if (historyData.value.length > 0) {
    store.lastSeenUpdateId = historyData.value[0].updateId;
    store.syncAllToCloud();
    hasUnseenNews.value = false;
  }
};

const checkAccess = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().acceptedLegal) {
          acceptedTerms.value = true;
          isExistingUser.value = true;
          hasReadLegal.value = true;
      }
      const lastLogin = localStorage.getItem('buho_last_login');
      if (lastLogin && (Date.now() - parseInt(lastLogin) < 3 * 24 * 60 * 60 * 1000)) emit('start');
      else { authMode.value = 'login'; form.email = user.email; showModal.value = true; }
    } else { authMode.value = 'login'; showModal.value = true; }
  });
};

const handleStartButton = () => { playOwlHoot(); checkAccess(); };

onMounted(async () => {
  const APP_VERSION = pkg.version; 
  if (localStorage.getItem('buho_app_version') !== APP_VERSION) {
    localStorage.setItem('buho_app_version', APP_VERSION);
    localStorage.removeItem('buho_last_login'); 
    window.location.reload(true);
    return; 
  }
  try {
    const res = await fetch('/update-history.json?t=' + Date.now());
    if (res.ok) {
      historyData.value = await res.json();
      if (historyData.value.length > 0 && store.lastSeenUpdateId !== historyData.value[0].updateId) hasUnseenNews.value = true;
    }
  } catch (e) {}
  setTimeout(() => { showOwl.value = true; }, 100);
  setTimeout(() => { showButton.value = true; }, 800);
});
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas shadow-pc">
      <SimpleConfetti :isActive="true" />
      
      <div v-if="customError || customSuccess" class="absolute top-8 left-0 right-0 z-[2000] flex justify-center px-4 pointer-events-none">
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
        <div v-if="showOwl" class="owl-hero-container animate-pop-in"><OwlImage customClass="owl-img-responsive" /></div>
        <button v-if="showButton" @click="handleStartButton" class="btn-empezar bg-yellow-400 text-indigo-900 font-black py-4 rounded-full shadow-[0_8px_0_rgb(180,83,9)] animate-latent-button">
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
          
          <div class="px-4 py-3 border-b flex justify-between items-center bg-slate-50 shrink-0 z-50">
              <button v-if="activeSubView !== 'auth' || showRecovery" @click="showRecovery ? (showRecovery = false) : (activeSubView = 'auth')" class="flex items-center gap-1 text-indigo-600 font-black text-xs uppercase bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                  <ChevronLeft :size="16"/> Volver
              </button>
              <div v-else class="w-8"></div>
              
              <h2 class="text-xs font-black text-indigo-900 uppercase tracking-widest text-center flex-1 px-2">
                  {{ activeSubView === 'settings' ? 'DARSE DE BAJA' : (showRecovery ? 'RECUPERAR' : (authMode === 'register' ? 'Nuevo Alumno' : 'Entrar al Nido')) }}
              </h2>
              
              <button @click="closeAndReset" class="bg-indigo-50 text-indigo-900 p-2 rounded-full shadow-md active:scale-90 transition-transform">
                <X :size="24" stroke-width="3.5" />
              </button>
          </div>

          <div class="flex-1 overflow-y-auto scroll-interno bg-white relative">
              <div v-if="activeSubView === 'auth'" class="p-5 h-full flex flex-col justify-between">
                  <template v-if="!showRecovery">
                    <div class="space-y-3">
                        <template v-if="authMode === 'register'">
                          <div>
                            <label class="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nombre Alumno</label>
                            <input v-model="form.username" placeholder="¿Cómo te llamas?" class="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold" />
                          </div>

                          <div class="space-y-1">
                            <label class="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Fecha de Nacimiento</label>
                            <div @click="openDatePicker" class="relative cursor-pointer w-full">
                              <input 
                                type="date" 
                                ref="nativeDateInput"
                                v-model="birthDateRaw" 
                                min="1900-01-01" 
                                :max="maxDateLimit" 
                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" 
                              />
                              <div class="w-full p-2.5 bg-gradient-to-r from-slate-100 to-slate-200 border-2 border-slate-300 rounded-xl flex items-center justify-between shadow-inner relative z-10">
                                  <span :class="['font-black italic text-sm truncate', birthDateRaw ? 'text-indigo-900' : 'text-slate-400']">{{ formattedDate || 'Seleccionar fecha...' }}</span>
                                  <CalendarIcon :size="18" class="text-slate-500 shrink-0 ml-2" />
                              </div>
                            </div>
                            <p class="text-[9px] font-bold text-slate-400 ml-2 flex items-center gap-1 mt-1 opacity-80">
                               <Info :size="10" class="text-indigo-400 shrink-0" />
                               <span>Edad mínima: 14 años. Si eres menor, pide a un adulto que te inscriba.</span>
                            </p>
                          </div>
                        </template>

                        <div>
                          <label class="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Correo Electrónico</label>
                          <input 
                             v-model="form.email" 
                             type="email" 
                             autocapitalize="none" 
                             autocorrect="off" 
                             spellcheck="false" 
                             placeholder="email@ejemplo.com" 
                             class="lowercase w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold focus:border-indigo-500" 
                          />
                        </div>

                        <div class="relative">
                          <label class="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">CONTRASEÑA</label>
                          <input :type="showPassword ? 'text' : 'password'" v-model="form.password" class="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold focus:border-indigo-500" autocapitalize="none" />
                          <button @click="showPassword = !showPassword" type="button" class="absolute right-3 bottom-2.5 text-slate-400"><component :is="showPassword ? EyeOff : Eye" :size="18"/></button>
                        </div>

                        <div @click="activeSubView = 'legal'" class="relative flex items-center gap-3 p-2.5 rounded-2xl border bg-indigo-50/50 border-indigo-100 cursor-pointer hover:bg-indigo-100/50 transition-all">
                            <div v-if="hasReadLegal" class="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg z-30 animate-latent"><CheckCircle :size="16" stroke-width="3" /></div>
                            <input type="checkbox" v-model="acceptedTerms" class="w-4 h-4 accent-indigo-600 pointer-events-none" tabindex="-1" />
                            <p class="text-[10px] font-medium text-slate-600">Acepto el <span class="text-indigo-600 font-bold underline">Marco Legal</span>.</p>
                        </div>
                    </div>

                    <div class="mt-5 space-y-3 mb-[100px]">
                        <button @click="handleAuth" :disabled="isLoading" class="w-full bg-indigo-600 text-white font-black italic text-lg uppercase rounded-[2rem] border-b-[8px] border-indigo-900 py-3 shadow-lg active:translate-y-2 flex items-center justify-center transition-all">
                          <span v-if="!isLoading">{{ authMode === 'register' ? 'CREAR CUENTA' : 'ENTRAR AL NIDO' }}</span>
                          <RefreshCw v-else class="animate-spin" />
                        </button>
                        <div class="flex gap-2">
                          <button @click="activeSubView = 'guide'" class="flex-1 bg-indigo-50 text-indigo-600 font-black text-[9px] uppercase py-3 rounded-full border border-indigo-100 flex items-center justify-center gap-1"><Info :size="14"/> GUÍA</button>
                          <button @click="activeSubView = 'settings'" class="flex-1 bg-slate-100 text-slate-600 font-black text-[9px] uppercase py-3 rounded-full border border-slate-200 flex items-center justify-center gap-1"><Settings :size="14"/> CUENTA</button>
                        </div>
                        <div class="text-center pt-2">
                          <button v-if="authMode === 'login'" @click="showRecovery = true; clearMessages()" class="text-orange-700 font-black underline text-[11px] uppercase italic">¿Olvidaste algo?</button>
                          
                          <div class="text-[11px] text-slate-500 mt-3 font-bold uppercase flex items-center justify-center gap-2">
                             <span>{{ authMode === 'register' ? '¿Ya tienes cuenta?' : '¿Eres nuevo?' }}</span>
                             <button @click="authMode = authMode === 'register' ? 'login' : 'register'; clearMessages()" class="text-indigo-700 font-black px-3 py-1.5 uppercase border-2 border-yellow-400 rounded-lg animate-latent-gold bg-white shadow-sm active:scale-95 transition-all">
                                {{ authMode === 'register' ? 'ENTRA' : 'SUSCRÍBETE' }}
                             </button>
                          </div>

                        </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="flex-1 flex flex-col justify-start animate-fade-in text-center px-2 mb-8 mt-2">
                        <h2 class="text-base font-black text-indigo-900 mb-4 font-inter uppercase">Recuperar Cuenta</h2>

                        <div class="flex bg-slate-100 p-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-4">
                            <button @click="recoveryMode = 'email'" :class="`flex-1 py-3 rounded-xl transition-all ${recoveryMode === 'email' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`">¿Correo?</button>
                            <button @click="recoveryMode = 'username'" :class="`flex-1 py-3 rounded-xl transition-all ${recoveryMode === 'username' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`">¿Nombre?</button>
                        </div>
                        
                        <div v-if="recoveryMode === 'email'" class="space-y-3">
                          <input 
                             v-model="form.username" 
                             placeholder="Nombre Alumno" 
                             autocapitalize="none" 
                             autocorrect="off" 
                             spellcheck="false" 
                             class="lowercase w-full p-3 border-2 border-orange-200 rounded-2xl text-center font-bold text-sm outline-none" 
                          />
                          <button @click="findEmailClue" class="w-full bg-orange-500 text-white font-black py-3.5 rounded-2xl shadow-lg uppercase text-xs">BUSCAR PISTA 🦉</button>
                        </div>
                        
                        <div v-else class="space-y-3">
                          <input 
                             v-model="form.email" 
                             type="email" 
                             autocapitalize="none" 
                             autocorrect="off" 
                             spellcheck="false" 
                             placeholder="Correo de Registro" 
                             class="lowercase w-full p-3 border-2 border-orange-200 rounded-2xl text-center font-bold text-sm outline-none" 
                          />
                          <button @click="findUsernameClue" class="w-full bg-orange-500 text-white font-black py-3.5 rounded-2xl shadow-lg uppercase text-xs">¿QUIÉN SOY? 🦉</button>
                        </div>
                        
                        <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-2 mt-4">
                            <button @click="handleForgotPassword" class="text-indigo-600 font-black text-xs uppercase underline">REINICIAR CONTRASEÑA POR EMAIL</button>
                        </div>
                        
                        <button @click="showRecovery = false" class="text-slate-500 font-black text-xs uppercase underline mt-4">VOLVER AL LOGIN</button>
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
/* CONTENEDOR MAESTRO (FONDO PANTALLA) */
.master-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9; 
  overflow: hidden;
  touch-action: none !important;
}

/* LIENZO DE LA APP (CANVAS) */
.app-canvas {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom right, #6366f1, #a855f7); 
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  touch-action: none !important;
  -webkit-tap-highlight-color: transparent;
  width: 100vw;
  height: 100dvh;
}

/* ADAPTACIÓN PROGRESIVA PARA CINTURA */
@media (min-width: 1025px) {
  .app-canvas {
    width: 1024px; 
    height: 90dvh;
    border-radius: 45px;
    box-shadow: 0 40px 100px rgba(0,0,0,0.2);
    border: 8px solid white;
  }
}
@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; }
}

.bg-silver-gradient { background: linear-gradient(135deg, rgba(200, 200, 205, 0.9) 0%, rgba(240, 240, 245, 0.95) 50%, rgba(190, 190, 195, 0.9) 100%); }

.main-hero-area { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding-top: 8.5rem; }
.main-title { font-size: 3rem; font-weight: 900; color: white; text-align: center; line-height: 1; }
.owl-hero-container { width: 100%; max-width: 220px; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.3)); margin: 2rem 0; }

.btn-empezar { width: 85%; max-width: 280px; font-size: 1.5rem; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

.animate-latent-button { animation: latent-button 3s ease-in-out infinite; }
@keyframes latent-button {
  0%, 100% { transform: scale(1); box-shadow: 0 8px 0 rgb(180,83,9); }
  50% { transform: scale(1.05); box-shadow: 0 8px 0 rgb(180,83,9), 0 0 35px 12px rgba(255, 255, 255, 0.5); }
}

.footer-anclado { width: 100%; padding: 1rem; text-align: center; background: rgba(0,0,0,0.1); padding-bottom: 2.5rem !important; }

.mentor-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; overflow: hidden; border: 2px solid white; background: #fff; }
.mentor-avatar img { width: 100%; height: 100%; object-fit: cover; max-width: 100%; }

.header-mentor { position: absolute; top: 1.5rem; left: 1.5rem; display: flex; align-items: center; gap: 0.75rem; z-index: 50; }

.scroll-interno { scrollbar-width: none; -ms-overflow-style: none; }
.scroll-interno::-webkit-scrollbar { display: none; }
.custom-scroll { scrollbar-width: none; }
.custom-scroll::-webkit-scrollbar { display: none; }

/* ANIMACIONES POPUPS GLOBALES */
.animate-toast-down { animation: toastDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes toastDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* ANIMACION LATENTE VERDE (ORIGINAL) */
.animate-latent { animation: latent-pulse 2s infinite; }
@keyframes latent-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* ANIMACION LATENTE ORO (NUEVA) */
.animate-latent-gold { animation: latent-gold-pulse 2s infinite; }
@keyframes latent-gold-pulse {
  0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
  70% { box-shadow: 0 0 0 8px rgba(250, 204, 21, 0); }
  100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>