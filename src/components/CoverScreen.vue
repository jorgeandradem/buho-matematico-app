<script setup>
import { ref, onMounted, reactive } from 'vue';
import { auth, db } from '../firebaseConfig'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import OwlImage from './OwlImage.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import userIcon from '@/assets/icono.png'; 
import { playOwlHoot } from '../utils/sound';

const emit = defineEmits(['start']);
const showOwl = ref(false);
const showButton = ref(false);
const showModal = ref(false);
const showPassword = ref(false); 
const authMode = ref('register'); 
const isLoading = ref(false); 

const form = reactive({
  username: '',
  email: '',
  altEmail: '',
  password: '',
});

// Tiempo de sesión: 3 días
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

const handleForgotPassword = async () => {
  if (!form.email || !form.email.includes('@')) {
    alert("⚠️ Escribe primero tu correo en la casilla para saber a dónde enviarte la ayuda.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, form.email);
    alert(`📧 ¡Listo! Revisa tu correo ${form.email} para restablecer la contraseña.`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') alert("⛔ Ese correo no está registrado.");
    else alert("⛔ Error al enviar el correo.");
  }
};

const handleAuth = async () => {
  if (!form.email.includes('@')) {
    alert("⚠️ Correo inválido."); return;
  }
  if (form.password.length < 6) {
    alert("⚠️ La contraseña debe tener al menos 6 caracteres."); return;
  }

  if (authMode.value === 'register') {
    if (form.username.trim() === '') {
      alert("⚠️ ¡Falta el nombre del pequeño!"); return;
    }
    if (!form.altEmail.includes('@')) {
      alert("⚠️ El Correo de Recuperación es obligatorio."); return;
    }
  }

  isLoading.value = true; 

  try {
    if (authMode.value === 'register') {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: form.username, 
        email: form.email,
        altEmail: form.altEmail,
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
    let mensaje = "¡Ups! Algo salió mal.";
    if (error.code === 'auth/wrong-password') mensaje = "⛔ Contraseña incorrecta.";
    if (error.code === 'auth/user-not-found') mensaje = "⛔ No existe cuenta con este correo.";
    if (error.code === 'auth/email-already-in-use') mensaje = "⛔ Correo ya registrado. Usa el botón 'Entra aquí' abajo.";
    if (error.code === 'auth/invalid-credential') mensaje = "⛔ Datos incorrectos.";
    alert(mensaje); 
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

      <div class="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <h1 class="text-5xl sm:text-6xl font-black text-white mb-2 tracking-tight drop-shadow-lg text-center">
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
          <h2 class="text-2xl font-black text-center mb-4 text-indigo-900">
            {{ authMode === 'register' ? '¡Únete a la Aventura!' : '¡Hola de nuevo!' }}
          </h2>
          
          <div class="space-y-3">
            <input v-if="authMode === 'register'" v-model="form.username" placeholder="Nombre del Pequeño" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none transition-colors" />
            <input v-model="form.email" placeholder="Correo del Mentor (Usuario)" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none transition-colors" />
            <input v-if="authMode === 'register'" v-model="form.altEmail" placeholder="Correo de Recuperación" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none transition-colors" />
            
            <div class="relative w-full">
                <input :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="Contraseña" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none pr-16 transition-colors" />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">
                    {{ showPassword ? 'Ocultar' : 'Ver' }}
                </button>
            </div>
          </div>

          <button @click="handleAuth" :disabled="isLoading" class="w-full mt-6 bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-50">
            <span v-if="!isLoading">{{ authMode === 'register' ? 'CREAR CUENTA' : 'ENTRAR' }}</span>
            <span v-else>Procesando... ⏳</span>
          </button>

          <div class="mt-4 text-center space-y-2">
            <p v-if="authMode === 'login'" class="text-xs">
               <button @click="handleForgotPassword" class="text-indigo-500 hover:text-indigo-700 font-medium underline">¿Olvidaste tu contraseña?</button>
            </p>
            <p class="text-sm text-gray-600">
              {{ authMode === 'register' ? '¿Ya tienes cuenta?' : '¿Eres nuevo?' }}
              <button @click="authMode = authMode === 'register' ? 'login' : 'register'" class="text-indigo-600 font-bold hover:underline ml-1">
                {{ authMode === 'register' ? 'Entra aquí' : 'Regístrate gratis' }}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div class="p-4 text-center relative z-10 flex flex-col items-center mb-2">
          <div class="flex flex-col items-center gap-1">
              <p class="text-white text-sm sm:text-base font-bold drop-shadow-sm">@Copyright 2026</p>
              <p class="text-white text-xs sm:text-sm font-medium drop-shadow-sm opacity-100">v2.4 Cloud Edition Pro</p>
          </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-pop-in { animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; }
@keyframes popIn { from { opacity: 0; transform: scale(0.5) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* ANIMACIONES RECUPERADAS */
.animate-pulse-slow { animation: pulseSlow 4s infinite ease-in-out; }
@keyframes pulseSlow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }

.animate-ping-slow { animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
@keyframes pingSlow { 75%, 100% { transform: scale(1.5); opacity: 0; } }
</style>