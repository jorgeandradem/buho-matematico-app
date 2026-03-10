<script setup>
/** * ARCHIVO: CoverScreen.vue
 * NOTA INTERNA: BLINDAJE DE MODALES v2.9.8 - ANTI-DESBORDAMIENTO
 * LOGICA: Altura bloqueada al Viewport + Scroll interno para Zoom.
 */
import { ref, onMounted, reactive, watch } from 'vue'; 
import { auth, db } from '../firebaseConfig'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { X, ChevronLeft, Info, Eye, EyeOff, AlertCircle, CheckCircle, Settings, RefreshCw, ChevronRight } from 'lucide-vue-next';
import OwlImage from './OwlImage.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import userIcon from '@/assets/icono.png'; 
import { playOwlHoot } from '../utils/sound';

import GuideView from './GuideView.vue';
import LegalView from './LegalView.vue';
import AccountSettings from './AccountSettings.vue'; 

const emit = defineEmits(['start']);
const showOwl = ref(false);
const showButton = ref(false);
const showModal = ref(false);

const activeSubView = ref('auth'); 
const showRecovery = ref(false); 
const recoveryMode = ref('email'); 
const showPassword = ref(false); 

const authMode = ref('login'); 
const isLoading = ref(false); 
const emailClue = ref(""); 
const usernameClue = ref("");
const customError = ref("");
const showSuccessCheck = ref(false); 

const acceptedTerms = ref(false);
const isExistingUser = ref(false);
const hasReadLegal = ref(false); 

const form = reactive({ username: '', email: '', password: '' });

watch(form, () => { customError.value = ""; });

const closeAndReset = () => {
  showModal.value = false;
  activeSubView.value = 'auth';
  showRecovery.value = false;
  customError.value = "";
  form.username = '';
  form.email = '';
  form.password = '';
  emailClue.value = "";
  usernameClue.value = "";
  recoveryMode.value = 'email';
};

const handleLegalAcceptedFromInside = () => {
  acceptedTerms.value = true;
  hasReadLegal.value = true; 
  activeSubView.value = 'auth';
  showSuccessCheck.value = true;
  setTimeout(() => { showSuccessCheck.value = false; }, 3000);
};

const handleLegalCheckboxClick = (e) => {
  if (isExistingUser.value || hasReadLegal.value) return; 
  e.preventDefault();
  activeSubView.value = 'legal';
};

const SESSION_LIMIT = 3 * 24 * 60 * 60 * 1000;

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
      const now = Date.now();
      if (lastLogin && (now - lastLogin < SESSION_LIMIT)) {
        emit('start');
      } else {
        authMode.value = 'login';
        form.email = user.email;
        showModal.value = true;
      }
    } else {
      authMode.value = 'login';
      showModal.value = true;
    }
  });
};

const handleStartButton = () => { playOwlHoot(); checkAccess(); };

const findEmailClue = async () => {
  if (!form.username.trim()) { customError.value = "⚠️ Escribe el Nombre de Alumno."; return; }
  isLoading.value = true;
  try {
    const q = query(collection(db, "users"), where("username", "==", form.username.trim()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) { customError.value = "⛔ El Nombre de Alumno no existe."; } 
    else {
      const userData = querySnapshot.docs[0].data();
      const [name, domain] = userData.email.split('@');
      const masked = name.length > 4 ? `${name.substring(0, 4)}...${name.slice(-1)}` : `${name.substring(0, 2)}...`;
      emailClue.value = `${masked}@${domain}`;
    }
  } catch (error) { customError.value = "⛔ Error al buscar la pista."; } 
  finally { isLoading.value = false; }
};

const findUsernameClue = async () => {
  if (!form.email.trim() || !form.email.includes('@')) { customError.value = "⚠️ Escribe tu correo."; return; }
  isLoading.value = true;
  try {
    const q = query(collection(db, "users"), where("email", "==", form.email.trim()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) { customError.value = "⛔ Este correo no está registrado."; } 
    else {
      const userData = querySnapshot.docs[0].data();
      usernameClue.value = userData.username;
    }
  } catch (error) { customError.value = "⛔ Error al buscar el nombre."; } 
  finally { isLoading.value = false; }
};

const handleForgotPassword = async () => {
  if (!form.email || !form.email.includes('@')) { customError.value = "⚠️ Escribe tu correo arriba."; return; }
  isLoading.value = true;
  try {
    const q = query(collection(db, "users"), where("email", "==", form.email.trim()));
    const snap = await getDocs(q);
    if (snap.empty) { customError.value = "⛔ Este correo no está registrado."; return; }
    await sendPasswordResetEmail(auth, form.email.trim());
    customError.value = `📧 ¡Enviado! Revisa tu correo: ${form.email}`;
  } catch (error) { customError.value = "⛔ Error al procesar."; } 
  finally { isLoading.value = false; }
};

const handleAuth = async () => {
  customError.value = "";
  if (authMode.value === 'register' && !acceptedTerms.value) {
    customError.value = "⚠️ Debes leer y aceptar el Marco Legal primero.";
    activeSubView.value = 'legal';
    return;
  }
  if (!form.email.includes('@')) { customError.value = "⚠️ El correo ingresado no es válido."; return; }
  if (form.password.length < 6) { customError.value = "⚠️ La contraseña es muy corta."; return; }
  if (authMode.value === 'register' && form.username.trim() === '') { customError.value = "⚠️ Escribe el Nombre del Alumno."; return; }

  isLoading.value = true; 
  try {
    if (authMode.value === 'register') {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: form.username, 
        email: form.email,
        createdAt: Date.now(),
        acceptedLegal: true, 
        stats: { puntos: 0, racha: 0 } 
      });
    } else {
      await signInWithEmailAndPassword(auth, form.email, form.password);
    }
    localStorage.setItem('buho_last_login', Date.now());
    showModal.value = false;
    emit('start');
  } catch (error) {
    if (error.code === 'auth/invalid-credential') {
        customError.value = "⛔ Los datos son incorrectos. Revisa tu correo o contraseña.";
    } else {
        customError.value = "⛔ Error: " + error.message;
    }
  } finally { isLoading.value = false; }
};

onMounted(async () => {
  const APP_VERSION = "2.9.8"; 
  const savedVersion = localStorage.getItem('buho_app_version');

  if (savedVersion !== APP_VERSION) {
    localStorage.setItem('buho_app_version', APP_VERSION);
    localStorage.removeItem('buho_last_login'); 
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (e) { console.log("Caché limpia"); }
    }
    window.location.reload(true);
    return; 
  }
  setTimeout(() => { showOwl.value = true; }, 100);
  setTimeout(() => { showButton.value = true; }, 800);
});
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas">
      
      <SimpleConfetti :isActive="true" />
      
      <div class="header-mentor">
          <div class="mentor-avatar">
              <img :src="userIcon" alt="Usuario" />
          </div>
          <div class="mentor-info text-white">
              <h3 class="font-bold text-sm leading-tight drop-shadow-md">Jorge Andrade</h3>
              <p class="text-[10px] font-medium opacity-90 uppercase">Mentor Digital & IA</p>
          </div>
      </div>

      <div class="main-hero-area">
        <h1 class="main-title animate-pop-in">
          Búho <span class="block text-yellow-300">Matemático</span>
        </h1>
        
        <div v-if="showOwl" class="owl-hero-container animate-pop-in">
            <OwlImage customClass="owl-img-responsive" />
        </div>

        <button v-if="showButton" @click="handleStartButton" class="btn-empezar group relative bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black py-4 rounded-full shadow-[0_8px_0_rgb(180,83,9)] active:translate-y-2 transition-all">
          <span class="relative z-10 uppercase">¡Empezar!</span>
          <div class="absolute inset-0 rounded-full bg-white/40 animate-ping-slow pointer-events-none"></div>
        </button>
      </div>

      <footer class="footer-anclado !pb-24">
          <div class="flex flex-col items-center gap-1 text-white">
              <p class="text-sm font-bold drop-shadow-sm">@Copyright 2026</p>
              <p class="text-xs font-medium opacity-100 drop-shadow-sm">Búho Mate v2.9.1</p>
          </div>
      </footer>

      <div v-if="showModal" class="absolute inset-0 bg-indigo-900/60 z-[100] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm overflow-hidden">
        <div class="bg-white w-full max-w-md sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-x-0 sm:border-4 border-yellow-400 relative flex flex-col h-full sm:h-[85vh] animate-pop-in">
          
          <div class="p-5 border-b flex justify-between items-center bg-slate-50 shrink-0 z-10">
              <button v-if="activeSubView !== 'auth'" @click="activeSubView = 'auth'" class="flex items-center gap-1 text-indigo-600 font-black text-xs uppercase bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                  <ChevronLeft :size="16"/> Volver
              </button>
              <div v-else class="w-8"></div>
              <h2 class="text-xs font-black text-indigo-900 uppercase tracking-widest text-center flex-1 px-2">
                  {{ activeSubView === 'auth' ? (authMode === 'register' ? 'Nuevo Alumno' : 'Entrar al Nido') : (activeSubView === 'guide' ? 'Guía de Uso' : activeSubView === 'settings' ? 'Mi Cuenta' : 'Marco Legal') }}
              </h2>
              <button @click="closeAndReset" class="bg-indigo-50 text-indigo-900 p-2 rounded-full shadow-md active:scale-90">
                <X :size="26" stroke-width="3.5" />
              </button>
          </div>

          <div class="flex-1 overflow-y-auto scroll-interno bg-white relative">
              
              <div v-if="activeSubView === 'auth'" class="p-6 h-full flex flex-col justify-between">
                  <template v-if="!showRecovery">
                    <div class="space-y-4">
                      <div v-if="authMode === 'register'">
                        <label class="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre del Alumno</label>
                        <input v-model="form.username" placeholder="¿Cómo te llamas?" class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" />
                      </div>
                      <div>
                        <label class="text-[10px] font-black uppercase text-slate-400 ml-2">Correo Electrónico</label>
                        <input v-model="form.email" placeholder="ejemplo@mail.com" class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" />
                      </div>
                      <div class="relative">
                        <label class="text-[10px] font-black uppercase text-slate-400 ml-2">Contraseña</label>
                        <input :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="Mínimo 6 letras" class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" />
                        <button @click="showPassword = !showPassword" type="button" class="absolute right-3 bottom-3 text-slate-400"><component :is="showPassword ? EyeOff : Eye" :size="20"/></button>
                      </div>
                      <div v-if="authMode === 'register' || acceptedTerms" 
                           class="relative flex items-start gap-3 p-3 rounded-2xl border transition-all duration-300 bg-indigo-50/50 border-indigo-100">
                          <input type="checkbox" v-model="acceptedTerms" :disabled="hasReadLegal" @click="handleLegalCheckboxClick" class="mt-1 w-5 h-5 accent-indigo-600 cursor-pointer" />
                          <p class="text-[11px] leading-tight font-medium text-slate-600">
                            He leído y acepto el <span @click="activeSubView = 'legal'" class="text-indigo-600 font-bold underline cursor-pointer">Marco Legal y Privacidad</span>.
                          </p>
                      </div>
                    </div>

                    <div v-if="customError" class="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 mt-2">
                        <AlertCircle class="text-red-500 shrink-0" :size="18" />
                        <p class="text-xs font-bold text-red-700 leading-tight">{{ customError }}</p>
                    </div>

                    <div class="mt-8 space-y-4 mb-10">
                        <button @click="handleAuth" :disabled="isLoading" 
                                class="w-full bg-gradient-to-b from-[#6366f1] to-[#4338ca] 
                                       text-white font-black italic text-lg uppercase rounded-[2rem] 
                                       border-b-[8px] border-[#312e81] shadow-lg shadow-indigo-500/30
                                       active:translate-y-[4px] active:border-b-[4px] transition-all 
                                       flex items-center justify-center py-4 group">
                          <span v-if="!isLoading" class="flex items-center">
                            {{ authMode === 'register' ? 'Crear Cuenta' : 'Entrar al Nido' }}
                            <ChevronRight class="ml-2 group-hover:translate-x-1 transition-transform" />
                          </span>
                          <span v-else class="flex items-center gap-2">Cargando... <RefreshCw class="animate-spin" size="20" /></span>
                        </button>
                        
                        <div class="flex gap-2 w-full">
                          <button @click="activeSubView = 'guide'" class="flex-1 flex items-center justify-center gap-2 text-indigo-600 font-black text-[10px] uppercase bg-indigo-50 px-4 py-3.5 rounded-full border border-indigo-100 active:scale-95"><Info :size="16"/> Guía</button>
                          <button @click="activeSubView = 'settings'" class="flex-1 flex items-center justify-center gap-2 text-slate-600 font-black text-[10px] uppercase bg-slate-100 px-4 py-3.5 rounded-full border border-slate-200 active:scale-95"><Settings :size="16"/> Mi Cuenta</button>
                        </div>

                        <div class="text-center">
                          <button v-if="authMode === 'login'" @click="showRecovery = true" class="text-orange-700 font-black underline text-[10px] uppercase italic">¿Olvidaste algo?</button>
                          <p class="text-xs text-slate-500 mt-3 font-bold uppercase">
                            {{ authMode === 'register' ? '¿Ya tienes cuenta?' : '¿Eres nuevo?' }}
                            <button @click="authMode = authMode === 'register' ? 'login' : 'register'; customError = ''" class="text-indigo-700 font-black underline ml-1 uppercase">{{ authMode === 'register' ? 'ENTRA' : 'SUSCRÍBETE' }}</button>
                          </p>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="flex-1 flex flex-col justify-center animate-fade-in text-center space-y-6 mb-20">
                        <div class="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-black uppercase tracking-widest">
                          <button @click="recoveryMode = 'email'" :class="`flex-1 py-3 rounded-xl transition-all ${recoveryMode === 'email' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`">Correo</button>
                          <button @click="recoveryMode = 'username'" :class="`flex-1 py-3 rounded-xl transition-all ${recoveryMode === 'username' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`">Nombre</button>
                        </div>
                        <input v-if="recoveryMode === 'email'" v-model="form.username" placeholder="Nombre del Alumno" class="w-full p-4 border-2 border-orange-200 rounded-2xl text-center font-bold" />
                        <input v-else v-model="form.email" placeholder="Tu Correo" class="w-full p-4 border-2 border-orange-200 rounded-2xl text-center font-bold" />
                        <button @click="recoveryMode === 'email' ? findEmailClue() : findUsernameClue()" class="w-full bg-orange-500 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-sm">Mostrar Ayuda 🦉</button>
                        <button @click="showRecovery = false" class="text-orange-700 font-black text-xs uppercase underline">Volver Atrás</button>
                    </div>
                  </template>
              </div>

              <div v-if="activeSubView === 'guide'" class="h-full flex flex-col">
                <div class="flex-1 overflow-y-auto p-4"> <GuideView /> </div>
                <div class="p-6 shrink-0 mb-10">
                   <button @click="activeSubView = 'auth'" 
                           class="w-full bg-gradient-to-b from-[#facc15] to-[#eab308] 
                                  text-indigo-900 font-black italic text-lg uppercase rounded-[2rem] 
                                  border-b-[8px] border-[#a16207] shadow-lg shadow-yellow-500/30
                                  active:translate-y-[4px] active:border-b-[4px] transition-all 
                                  flex items-center justify-center py-4">
                     ¡LO ENTENDÍ TODO!
                   </button>
                </div>
              </div>

              <div v-if="activeSubView === 'legal'" class="h-full flex flex-col">
                <div class="flex-1 overflow-y-auto p-4"> <LegalView :currentStatus="acceptedTerms" @accepted="handleLegalAcceptedFromInside" /> </div>
                <div class="h-16 shrink-0"></div> 
              </div>

              <div v-if="activeSubView === 'settings'" class="h-full">
                <AccountSettings @close="activeSubView = 'auth'" />
              </div>

          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.master-container { height: 100dvh; width: 100vw; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; position: fixed; top: 0; left: 0; touch-action: none; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; background: linear-gradient(to bottom right, #6366f1, #a855f7); transition: all 0.4s; user-select: none; touch-action: none; -webkit-tap-highlight-color: transparent; width: 100vw; height: 100dvh; }
.main-hero-area { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 1rem; }
.main-title { font-size: 3rem; font-weight: 900; color: white; line-height: 1; text-align: center; }
.owl-hero-container { width: 100%; max-width: 220px; max-height: 28vh; display: flex; justify-content: center; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.3)); margin: 1rem 0; }
.owl-img-responsive { width: 100%; height: 100%; object-fit: contain; }
.btn-empezar { width: 85%; max-width: 280px; font-size: 1.5rem; }
.footer-anclado { width: 100%; padding: 1rem; text-align: center; background: rgba(0,0,0,0.1); }

/* PC: El modal nunca desborda la pantalla */
@media (min-width: 1025px) {
  .app-canvas { width: 1024px; height: 90vh; border-radius: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); }
  .main-title { font-size: 5.5rem !important; }
  .btn-empezar { max-width: 320px; font-size: 2rem !important; }
}

.header-mentor { position: absolute; top: 1.5rem; left: 1.5rem; display: flex; align-items: center; gap: 0.75rem; z-index: 50; }
.mentor-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; overflow: hidden; border: 2px solid white; }
.mentor-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* Scroll invisible pero funcional para el zoom */
.scroll-interno { scrollbar-width: none; -ms-overflow-style: none; }
.scroll-interno::-webkit-scrollbar { display: none; }

.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.animate-ping-slow { animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
@keyframes pingSlow { 75%, 100% { transform: scale(1.5); opacity: 0; } }
</style>