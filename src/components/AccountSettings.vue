<script setup>
/** * ARCHIVO: AccountSettings.vue
 * NOTA INTERNA: v2.9.5 - UI COMPACTA SMARTPHONE + FIX MENSAJE ERROR
 */
import { ref, reactive } from 'vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { UserX, ShieldAlert, ArrowLeft, RefreshCw, Eye, EyeOff, Mail, Lock } from 'lucide-vue-next';

const emit = defineEmits(['close']);
const store = useGamificationStore();
const isDeleting = ref(false);
const showPassword = ref(false);
const credentials = reactive({ email: '', password: '' });

const confirmDelete = async () => {
    if (!credentials.email || !credentials.password) {
        alert("⚠️ Por favor, escribe tu correo y contraseña.");
        return;
    }
    const firstCheck = confirm("¿Deseas eliminar permanentemente tu progreso?");
    if (!firstCheck) return;

    isDeleting.value = true;
    const result = await store.deleteAccountPermanently(credentials.email.trim(), credentials.password);

    if (result.success) {
        alert("✅ Cuenta eliminada. ¡Adiós!");
        window.location.reload(); 
    } else if (result.error === 'not-found') {
        alert("⚠️ No existe ninguna cuenta con esos datos o la contraseña es incorrecta.");
        isDeleting.value = false;
    } else {
        alert("❌ Error de conexión. Inténtalo más tarde.");
        isDeleting.value = false;
    }
};
</script>

<template>
  <div class="flex flex-col h-full bg-white font-inter animate-fade-in overflow-hidden">
    <header class="p-4 flex items-center gap-3 border-b border-slate-50 shrink-0">
      <button @click="emit('close')" class="p-1.5 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-all">
        <ArrowLeft size="20" />
      </button>
      <h1 class="text-lg font-black text-indigo-950 uppercase italic tracking-tighter">Baja de Usuario</h1>
    </header>

    <div class="flex-1 flex flex-col justify-between p-5 py-2">
      <div class="flex flex-col items-center text-center space-y-2 mt-2">
        <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center border-2 border-white shadow-md">
          <ShieldAlert size="28" class="text-red-600" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-800 uppercase italic">Confirmar Identidad</h2>
          <p class="text-slate-500 font-light text-[12px] leading-tight">Introduce tus datos para borrar todo.</p>
        </div>
      </div>

      <div class="space-y-3 bg-slate-50 p-4 rounded-[2rem] border border-red-50">
        <div class="space-y-1">
          <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Correo</label>
          <div class="relative">
             <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size="16" />
             <input v-model="credentials.email" type="email" placeholder="mail@ejemplo.com" class="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-red-400 text-sm font-medium" />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Contraseña</label>
          <div class="relative">
             <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size="16" />
             <input :type="showPassword ? 'text' : 'password'" v-model="credentials.password" placeholder="••••••••" class="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-red-400 text-sm font-medium" />
             <button @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><component :is="showPassword ? EyeOff : Eye" size="18" /></button>
          </div>
        </div>

        <button @click="confirmDelete" :disabled="isDeleting" class="w-full bg-gradient-to-b from-[#EF4444] to-[#B91C1C] text-white font-black italic text-base uppercase rounded-[1.5rem] border-b-[6px] border-[#7F1D1D] active:translate-y-[2px] active:border-b-[2px] transition-all py-3.5 mt-2 flex items-center justify-center">
          <span v-if="!isDeleting" class="flex items-center">BORRAR TODO <UserX class="ml-2" size="18" /></span>
          <RefreshCw v-else class="animate-spin" size="20" />
        </button>
      </div>

      <button @click="emit('close')" class="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 mb-4">CANCELAR Y VOLVER</button>
    </div>
  </div>
</template>