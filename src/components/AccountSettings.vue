<script setup>
/** * ARCHIVO: AccountSettings.vue
 * NOTA INTERNA: v2.9.8 - DOBLE CONFIRMACIÓN INTEGRADA + AJUSTES VISUALES
 */
import { ref, reactive, watch } from 'vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { UserX, ShieldAlert, RefreshCw, Eye, EyeOff, Mail, Lock, X, AlertCircle, CheckCircle } from 'lucide-vue-next';

const emit = defineEmits(['close']);
const store = useGamificationStore();
const isDeleting = ref(false);
const showPassword = ref(false);
const credentials = reactive({ email: '', password: '' });

// 🛡️ ESTADO DE DOBLE CONFIRMACIÓN
const pendingConfirmation = ref(false);

// 🛡️ CANALES DE FEEDBACK
const customError = ref("");
const customSuccess = ref("");
let confirmationTimer = null;

const clearMessages = () => {
  customError.value = "";
  customSuccess.value = "";
};

// Si el usuario edita los campos, se cancela la confirmación pendiente
watch(() => [credentials.email, credentials.password], () => {
  pendingConfirmation.value = false;
  clearMessages();
  clearTimeout(confirmationTimer);
});

const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return re.test(email.toLowerCase());
};

const confirmDelete = async () => {
    clearMessages();
    const cleanEmail = credentials.email.trim();
    
    if (!cleanEmail || !credentials.password) {
        customError.value = "⚠️ Por favor, escribe tu correo y contraseña.";
        return;
    }
    
    if (!isValidEmail(cleanEmail)) {
        customError.value = "⚠️ El formato del correo no es válido.";
        return;
    }

    // 🛑 FASE 1: PEDIR CONFIRMACIÓN
    if (!pendingConfirmation.value) {
        pendingConfirmation.value = true;
        customError.value = "⚠️ ADVERTENCIA: Esta acción no se puede deshacer. Presiona nuevamente para confirmar.";
        
        // El botón vuelve a la normalidad si no confirman en 5 segundos
        confirmationTimer = setTimeout(() => {
            pendingConfirmation.value = false;
            clearMessages();
        }, 5000);
        return;
    }

    // 🚀 FASE 2: EJECUTAR EL BORRADO
    clearTimeout(confirmationTimer);
    isDeleting.value = true;
    const result = await store.deleteAccountPermanently(cleanEmail, credentials.password);

    if (result.success) {
        pendingConfirmation.value = false;
        customSuccess.value = "✅ Cuenta eliminada. ¡Adiós!";
        setTimeout(() => { window.location.reload(); }, 2000);
    } else {
        isDeleting.value = false;
        pendingConfirmation.value = false;
        const err = result.error || '';
        
        if (err.includes('user-not-found') || err === 'not-found') {
            customError.value = "⚠️ Revisa tus datos, tu cuenta no está registrada.";
        } else if (err.includes('wrong-password') || err.includes('invalid-credential')) {
            customError.value = "⚠️ La contraseña que ingresaste es incorrecta.";
        } else if (err.includes('network')) {
            customError.value = "🔌 Error de conexión. Verifica tu internet.";
        } else if (err.includes('too-many-requests')) {
            customError.value = "⛔ Demasiados intentos fallidos. Espera unos minutos.";
        } else {
            customError.value = "⚠️ Revisa tus datos, tu cuenta no está registrada.";
        }
    }
};
</script>

<template>
  <div class="relative flex flex-col h-full bg-white font-inter animate-fade-in overflow-hidden">
    
    <Teleport to="body">
      <div v-if="customError || customSuccess" class="fixed top-8 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none font-inter">
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
    </Teleport>

    <div class="flex-1 flex flex-col justify-between p-5 py-2">
      <div class="flex flex-col items-center text-center space-y-2 mt-4">
        
        <h2 class="text-lg font-black text-red-600 uppercase italic mb-1">Eliminar Cuenta</h2>
        
        <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center border-2 border-white shadow-md">
          <ShieldAlert size="28" class="text-red-600" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-800 uppercase italic">Confirmar Identidad</h2>
          <p class="text-slate-500 font-light text-[12px] leading-tight">Introduce tus datos para borrar todo.</p>
        </div>
      </div>

      <div class="space-y-3 bg-slate-50 p-4 rounded-[2rem] border border-red-50 mt-4">
        <div class="space-y-1">
          <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Correo</label>
          <div class="relative">
             <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size="16" />
             <input 
                v-model="credentials.email" 
                type="email" 
                autocapitalize="none" 
                autocorrect="off" 
                spellcheck="false" 
                placeholder="mail@ejemplo.com" 
                class="lowercase w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-red-400 text-sm font-medium transition-colors"
                :class="{'border-red-300 bg-red-50': pendingConfirmation}"
             />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Contraseña</label>
          <div class="relative">
             <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size="16" />
             <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="credentials.password" 
                autocapitalize="none"
                placeholder="••••••••" 
                class="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-red-400 text-sm font-medium transition-colors" 
                :class="{'border-red-300 bg-red-50': pendingConfirmation}"
             />
             <button @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><component :is="showPassword ? EyeOff : Eye" size="18" /></button>
          </div>
        </div>

        <button 
          @click="confirmDelete" 
          :disabled="isDeleting" 
          class="w-full font-black italic text-base uppercase rounded-[1.5rem] border-b-[6px] active:translate-y-[2px] active:border-b-[2px] transition-all py-3.5 mt-2 flex items-center justify-center"
          :class="pendingConfirmation 
            ? 'bg-gradient-to-b from-[#991B1B] to-[#7F1D1D] text-white border-[#450a0a] animate-pulse shadow-inner' 
            : 'bg-gradient-to-b from-[#EF4444] to-[#B91C1C] text-white border-[#7F1D1D] shadow-lg'"
        >
          <span v-if="!isDeleting" class="flex items-center text-sm sm:text-base">
             {{ pendingConfirmation ? '¡SÍ, ELIMINAR MI CUENTA!' : 'BORRAR TODO' }} 
             <UserX class="ml-2" size="18" />
          </span>
          <RefreshCw v-else class="animate-spin" size="20" />
        </button>
      </div>

      <button @click="emit('close')" class="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 mt-6 mb-4">CANCELAR Y VOLVER</button>
    </div>
  </div>
</template>

<style scoped>
.animate-toast-down { animation: toastDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes toastDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>