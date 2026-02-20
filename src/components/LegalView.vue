<script setup>
import { ref } from 'vue';
import { 
  ChevronDown, ShieldCheck, Lock, Gavel, Cpu, Info 
} from 'lucide-vue-next';

const emit = defineEmits(['accepted']);
const isAccepted = ref(false);
const activeTab = ref(null);

const toggle = (id) => {
  activeTab.value = activeTab.value === id ? null : id;
};

/**
 * Datos del acordeón integrando las sugerencias legales de experto 2026
 * Se incluye: Protección de menores (14/13 años) y Cookies Técnicas.
 */
const sections = [
  {
    id: 1,
    title: 'I. AVISO LEGAL Y TÉRMINOS DE USO',
    icon: Gavel,
    content: `1.1. Responsable: Jorge Augusto Andrade Mascobetto (NIE: Y9947804L). Ubicación: Barcelona, España. Contacto: info@jorgeandradementor.com. 1.2. Tecnología: Desarrollado con VS Code, GitHub, Vercel, NameCheap y Google Workspace. Incluye asistencia de IA Google Gemini Pro para optimización de lógica. 1.3. Protección de Menores: Conforme al RGPD (UE) y COPPA (EE.UU.), si el usuario es menor de 14 años (España) o 13 años (Resto del mundo), el registro debe ser realizado por un padre o tutor legal.`
  },
  {
    id: 2,
    title: 'II. PRIVACIDAD Y PROTECCIÓN DE DATOS',
    icon: ShieldCheck,
    content: `Cumplimos con RGPD (UE) y LOPDGDD (ES). 2.1. Gestión: Google Firebase (Autenticación y Firestore). 2.2. Cookies Técnicas: Utilizamos LocalStorage y Firebase Tokens estrictamente necesarios para mantener tu sesión y progreso; no requieren banner de cookies publicitarias. 2.3. WhatsApp: El número telefónico se usa solo para notificaciones opcionales de logros; no se comparte con terceros y es revocable en cualquier momento. 2.4. Transferencia: Datos protegidos bajo el "Data Privacy Framework" (UE-EE.UU.).`
  },
  {
    id: 3,
    title: 'III. COPYRIGHT Y PROPIEDAD INTELECTUAL',
    icon: Lock,
    content: `3.1. Propiedad: Todo el contenido está protegido por la Ley de Propiedad Intelectual (España) y la OMPI. El Código: Programación Vue.js 3/Vite asistida por Gemini Pro. El Arte: Personaje "Búho Profesor" (OwlImage.vue), logotipos y diseño de interfaz. La Marca: Nombre "Búho Matemático" y metodología pedagógica de Jorge Andrade. 3.2. Prohibiciones: Prohibida la reproducción o transformación sin autorización expresa del titular.`
  },
  {
    id: 4,
    title: 'IV. SEGURIDAD Y ACTUALIZACIONES',
    icon: Cpu,
    content: `Actualización Automática: Sistema CI/CD con GitHub y Vercel para una versión siempre segura. Seguridad Real-Time: Protección de activos virtuales contra accesos no autorizados. Modo Reposo: Tecnología "Sleep Mode" que optimiza recursos y protege la vida útil de la batería de tu dispositivo cuando la app no está activa.`
  }
];
</script>

<template>
  <div class="flex flex-col h-full bg-white text-slate-800 font-sans">
    <header class="text-center mb-4 shrink-0 px-2">
      <div class="flex justify-center mb-1">
        <span class="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">v2.5 Secure Edition</span>
      </div>
      <h1 class="text-lg font-black text-indigo-900 uppercase italic tracking-tight">Marco Legal e Integral</h1>
      <p class="text-[10px] text-slate-400 italic font-medium">Actualización: 20 de febrero de 2026</p>
      <p class="mt-2 text-[10px] text-slate-500 leading-tight max-w-xs mx-auto">
        Compromiso de transparencia entre <strong>Jorge Augusto Andrade Mascobetto</strong> y los usuarios.
      </p>
    </header>

    <div class="flex-1 space-y-2 mb-4 overflow-y-auto pr-1 custom-scrollbar">
      <div 
        v-for="sec in sections" 
        :key="sec.id" 
        class="border-2 rounded-xl transition-all duration-200" 
        :class="activeTab === sec.id ? 'border-indigo-500 shadow-sm' : 'border-slate-100'"
      >
        <button 
          @click="toggle(sec.id)" 
          class="w-full p-3 flex items-center justify-between bg-slate-50 text-left hover:bg-slate-100 transition-colors"
        >
          <span class="text-[10px] font-black text-indigo-800 uppercase flex items-center gap-2">
            <component :is="sec.icon" :size="14" class="text-indigo-600" /> {{ sec.title }}
          </span>
          <ChevronDown 
            :size="14" 
            class="transition-transform duration-300 text-slate-400" 
            :class="activeTab === sec.id ? 'rotate-180 text-indigo-500' : ''" 
          />
        </button>
        
        <div 
          v-if="activeTab === sec.id" 
          class="p-3 text-[11px] text-slate-600 bg-white border-t border-slate-100 animate-fade-in leading-relaxed font-medium"
        >
          {{ sec.content }}
        </div>
      </div>
    </div>

    <div class="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 shrink-0">
      <div class="flex items-center gap-2 mb-3">
        <Info :size="14" class="text-indigo-600" />
        <h3 class="text-[10px] font-black text-indigo-900 uppercase tracking-wide">V. ACEPTACIÓN OBLIGATORIA</h3>
      </div>
      
      <label class="flex items-start gap-3 cursor-pointer mb-4 group">
        <div class="relative flex items-center">
          <input 
            type="checkbox" 
            v-model="isAccepted" 
            class="peer h-5 w-5 opacity-0 absolute cursor-pointer" 
          />
          <div class="h-5 w-5 border-2 border-indigo-300 rounded-md bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
            <svg v-if="isAccepted" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <span class="text-[10px] font-bold text-slate-700 leading-tight group-hover:text-indigo-900 transition-colors">
          He leído y acepto la Política de Privacidad, los Términos de Uso y el Copyright de Búho Matemático.
        </span>
      </label>

      <button 
        @click="emit('accepted')" 
        :disabled="!isAccepted" 
        :class="[
          'w-full py-3 rounded-xl font-black text-xs uppercase transition-all duration-300 tracking-widest', 
          isAccepted 
            ? 'bg-indigo-600 text-white shadow-md hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        ]"
      >
        Aceptar y Continuar 🦉
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { 
  animation: fadeIn 0.25s ease-out forwards; 
}

@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(-4px); } 
  to { opacity: 1; transform: translateY(0); } 
}

.custom-scrollbar::-webkit-scrollbar { 
  width: 4px; 
}

.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: #cbd5e1; 
  border-radius: 10px; 
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover { 
  background: #94a3b8; 
}

/* Optimización para dispositivos táctiles PWA */
@media (max-width: 640px) {
  .custom-scrollbar {
    -webkit-overflow-scrolling: touch;
  }
}
</style>