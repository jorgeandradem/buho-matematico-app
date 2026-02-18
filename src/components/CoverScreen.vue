<script setup>
import { ref, onMounted, reactive } from 'vue';
import { auth, db } from '../firebaseConfig'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
// Importamos X para el botón de cerrar
import { X } from 'lucide-vue-next';
import OwlImage from './OwlImage.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import userIcon from '@/assets/icono.png'; 
import { playOwlHoot } from '../utils/sound';

const emit = defineEmits(['start']);
const showOwl = ref(false);
const showButton = ref(false);
const showModal = ref(false);
const showRecovery = ref(false); 
const recoveryMode = ref('email'); 
const showPassword = ref(false); 
const authMode = ref('register'); 
const isLoading = ref(false); 
const emailClue = ref(""); 
const usernameClue = ref("");

const form = reactive({
  username: '',
  email: '',
  password: '',
});

const SESSION_LIMIT = 3 * 24 * 60 * 60 * 1000;

const checkAccess = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
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
      authMode.value = 'register';
      showModal.value = true;
    }
  });
};

const handleStartButton = () => {
  playOwlHoot();
  checkAccess();
};

const findEmailClue = async () => {
  if (!form.username.trim()) {
    alert("⚠️ Escribe el Nombre de Alumno para darte la pista.");
    return;
  }
  isLoading.value = true;
  try {
    const q = query(collection(db, "users"), where("username", "==", form.username.trim()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      alert("⛔ El Nombre de Alumno no existe.");
    } else {
      const userData = querySnapshot.docs[0].data();
      const [name, domain] = userData.email.split('@');
      const masked = name.length > 4 
        ? `${name.substring(0, 4)}...${name.slice(-1)}` 
        : `${name.substring(0, 2)}...`;
      emailClue.value = `${masked}@${domain}`;
    }
  } catch (error) {
    alert("⛔ Error al buscar la pista.");
  } finally {
    isLoading.value = false;
  }
};

const findUsernameClue = async () => {
  if (!form.email.trim() || !form.email.includes('@')) {
    alert("⚠️ Escribe tu correo para recordarte tu nombre.");
    return;
  }
  isLoading.value = true;
  try {
    const q = query(collection(db, "users"), where("email", "==", form.email.trim()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      alert("⛔ Este correo no está registrado.");
    } else {
      const userData = querySnapshot.docs[0].data();
      usernameClue.value = userData.username;
    }
  } catch (error) {
    alert("⛔ Error al buscar el nombre.");
  } finally {
    isLoading.value = false;
  }
};

const handleForgotPassword = async () => {
  if (!form.email || !form.email.includes('@')) {
    alert("⚠️ Escribe tu correo en la casilla de arriba para enviarte la ayuda.");
    return;
  }
  isLoading.value = true;
  try {
    const q = query(collection(db, "users"), where("email", "==", form.email.trim()));
    const snap = await getDocs(q);
    if (snap.empty) {
       alert("⛔ Este correo no está registrado en el sistema del Búho.");
       return;
    }
    await sendPasswordResetEmail(auth, form.email.trim());
    alert(`📧 ¡Enviado! Revisa tu bandeja de entrada o spam en: ${form.email}`);
  } catch (error) {
    alert("⛔ Error al procesar la recuperación.");
  } finally {
    isLoading.value = false;
  }
};

const handleAuth = async () => {
  if (!form.email.includes('@')) {
    alert("⚠️ El correo ingresado no es válido."); return;
  }
  if (form.password.length < 6) {
    alert("⚠️ La contraseña es muy corta (mínimo 6 caracteres)."); return;
  }
  if (authMode.value === 'register' && form.username.trim() === '') {
    alert("⚠️ Escribe el Nombre del Alumno."); return;
  }
  isLoading.value = true; 
  try {
    if (authMode.value === 'register') {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: form.username, 
        email: form.email,
        createdAt: Date.now(),
        stats: { puntos: 0, racha: 0 } 
      });
    } else {
      await signInWithEmailAndPassword(auth, form.email, form.password);
    }
    localStorage.setItem('buho_last_login', Date.now());
    showModal.value = false;
    emit('start');
  } catch (error) {
    if (error.code === 'auth/wrong-password') alert("⛔ La contraseña es incorrecta.");
    else if (error.code === 'auth/user-not-found') alert("⛔ No existe ninguna cuenta con este correo.");
    else if (error.code === 'auth/email-already-in-use') alert("⛔ Este correo ya está registrado por otro alumno.");
    else if (error.code === 'auth/invalid-credential') alert("⛔ Los datos de acceso son incorrectos.");
    else alert("⛔ Error: " + error.message);
  } finally {
    isLoading.value = false; 
  }
};

onMounted(() => {
  setTimeout(() => { showOwl.value = true; }, 100);
  setTimeout(() => { showButton.value = true; }, 800);
});
</script>

<template>
  <div class="h-[100dvh] w-full bg-slate-100 flex justify-center overflow-hidden font-sans select-none text-indigo-900">
    <div class="w-full max-w-xl h-full flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl relative overflow-hidden">
      <SimpleConfetti :isActive="true" />
      
      <div class="absolute top-[-10%] left-[-10%] w-60 h-60 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow delay-700"></div>

      <div class="absolute top-4 left-4 flex items-center gap-3 z-50">
          <div class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center border-2 border-indigo-200 overflow-hidden shadow-lg">
              <img :src="userIcon" alt="Usuario" class="w-full h-full object-cover" />
          </div>
          <div class="block">
              <h3 class="font-bold text-white text-sm md:text-base leading-tight drop-shadow-md">Jorge Andrade</h3>
              <p class="text-xs md:text-sm text-white font-medium tracking-wide drop-shadow-sm">Mentor Digital & IA</p>
          </div>
      </div>

      <div class="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center">
        <h1 class="text-5xl sm:text-6xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
          Búho <span class="block text-yellow-300 text-6xl sm:text-7xl mt-1">Matemático</span>
        </h1>
        
        <div v-if="showOwl" class="w-48 h-48 sm:w-60 sm:h-60 mb-8 relative animate-pop-in">
           <div class="absolute inset-0 bg-white/20 rounded-full scale-110 blur-xl animate-pulse-slow"></div>
           <OwlImage customClass="w-full h-full object-contain drop-shadow-2xl relative z-10" />
        </div>

        <button v-if="showButton" @click="handleStartButton" class="group relative bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black text-2xl py-4 px-12 rounded-full shadow-[0_8px_0_rgb(180,83,9)] active:translate-y-2 transition-all">
          <span class="relative z-10">¡EMPEZAR!</span>
          <div class="absolute inset-0 rounded-full bg-white/40 animate-ping-slow pointer-events-none"></div>
        </button>
      </div>

      <div v-if="showModal" class="fixed inset-0 bg-indigo-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-4 border-yellow-400 relative">
          
          <button @click="showModal = false; showRecovery = false" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1">
            <X :size="28" />
          </button>

          <template v-if="!showRecovery">
            <h2 class="text-2xl font-black text-center mb-4 text-indigo-900">
              {{ authMode === 'register' ? '¡Crea tu Cuenta!' : '¡Hola de nuevo!' }}
            </h2>
            
            <div class="space-y-3">
              <input v-if="authMode === 'register'" v-model="form.username" placeholder="Nombre del Alumno" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none" />
              <input v-model="form.email" placeholder="Correo del Usuario" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none" />
              
              <div class="relative w-full">
                  <input :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="Contraseña" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none pr-16" />
                  <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded">
                      {{ showPassword ? 'Ocultar' : 'Ver' }}
                  </button>
              </div>
            </div>

            <button @click="handleAuth" :disabled="isLoading" class="w-full mt-6 bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black py-4 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 transition-all">
              <span v-if="!isLoading">{{ authMode === 'register' ? 'REGISTRARME' : 'ENTRAR' }}</span>
              <span v-else>Validando... ⏳</span>
            </button>

            <div class="mt-4 text-center space-y-3">
              <div v-if="authMode === 'login'" class="flex flex-col gap-2">
                 <button @click="handleForgotPassword" class="text-indigo-500 hover:text-indigo-700 font-medium underline text-xs">¿Olvidaste tu contraseña?</button>
                 <button @click="showRecovery = true; recoveryMode = 'email'" class="text-orange-600 font-bold underline italic text-xs">¿No recuerdas tu correo o nombre?</button>
              </div>
              <p class="text-sm text-gray-600 pt-2 border-t border-gray-100">
                {{ authMode === 'register' ? '¿Ya tienes cuenta?' : '¿Eres nuevo?' }}
                <button @click="authMode = authMode === 'register' ? 'login' : 'register'" class="text-indigo-600 font-bold hover:underline ml-1">
                  {{ authMode === 'register' ? 'Entra aquí' : 'Regístrate gratis' }}
                </button>
              </p>
            </div>
          </template>

          <template v-else>
            <h2 class="text-xl font-black text-center mb-2 text-orange-600 uppercase italic">Centro de Ayuda 🦉</h2>
            <div class="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button @click="recoveryMode = 'email'; usernameClue = ''; emailClue = ''" :class="`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${recoveryMode === 'email' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`">Buscar Correo</button>
              <button @click="recoveryMode = 'username'; usernameClue = ''; emailClue = ''" :class="`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${recoveryMode === 'username' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`">Recordar Nombre</button>
            </div>
            <div v-if="recoveryMode === 'email'" class="animate-fade-in">
              <p class="text-xs text-slate-500 mb-3 text-center">Escribe tu <b>Nombre de Alumno</b> para ver una pista.</p>
              <input v-model="form.username" placeholder="Nombre del Alumno" class="w-full p-3 border-2 border-orange-200 rounded-xl outline-none mb-3" />
              <div v-if="emailClue" class="bg-indigo-50 border-2 border-indigo-100 p-3 rounded-xl mb-3 text-center">
                <p class="text-[10px] text-indigo-400 font-bold uppercase">Tu correo empieza por:</p>
                <p class="text-base font-black text-indigo-900">{{ emailClue }}</p>
              </div>
              <button @click="findEmailClue" class="w-full bg-orange-500 text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all">MOSTRAR PISTA</button>
            </div>
            <div v-else class="animate-fade-in">
              <p class="text-xs text-slate-500 mb-3 text-center">Escribe tu <b>Correo del Usuario</b> para recordarte tu nombre.</p>
              <input v-model="form.email" placeholder="Correo del Usuario" class="w-full p-3 border-2 border-orange-200 rounded-xl outline-none mb-3" />
              <div v-if="usernameClue" class="bg-green-50 border-2 border-green-100 p-3 rounded-xl mb-3 text-center">
                <p class="text-[10px] text-green-600 font-bold uppercase">Tu Nombre de Alumno es:</p>
                <p class="text-lg font-black text-green-700">{{ usernameClue }}</p>
              </div>
              <button @click="findUsernameClue" class="w-full bg-orange-500 text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all">RECORDAR NOMBRE</button>
            </div>
            <button @click="showRecovery = false; emailClue = ''; usernameClue = ''" class="w-full text-indigo-600 font-bold text-sm hover:underline mt-4">Regresar al Inicio</button>
          </template>
        </div>
      </div>

      <div class="p-4 text-center relative z-10 flex flex-col items-center mb-2">
          <div class="flex flex-col items-center gap-1">
              <p class="text-white text-sm font-bold drop-shadow-sm">@Copyright 2026</p>
              <p class="text-white text-xs font-medium drop-shadow-sm opacity-100">v2.6 Secure Edition</p>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pop-in { animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { opacity: 0; transform: scale(0.5) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.animate-pulse-slow { animation: pulseSlow 4s infinite ease-in-out; }
@keyframes pulseSlow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
.animate-ping-slow { animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
@keyframes pingSlow { 75%, 100% { transform: scale(1.5); opacity: 0; } }
</style>