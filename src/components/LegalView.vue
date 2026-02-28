<script setup>
import { ref, nextTick, computed } from 'vue';
import { 
  ChevronDown, ShieldCheck, Lock, Gavel, Cpu, Info,
  ZoomIn, Shrink, Type
} from 'lucide-vue-next';

const emit = defineEmits(['accepted']);
const isAccepted = ref(false);
const activeTab = ref(null);
const isZoomed = ref(false);
const sectionRefs = ref([]);

// --- 🧪 ESTADO DE LECTURA INMERSIVA ---
const fontSize = ref(24); 
const readingTheme = ref('light'); // 'light', 'sepia', 'dark'

// 🎨 ESTILOS REACTIVOS (El truco para que la fuente obedezca al 100%)
const readingStyles = computed(() => ({
  fontSize: `${fontSize.value}px`,
  fontFamily: '"Inter Variable", sans-serif',
  transition: 'all 0.3s ease'
}));

/**
 * Lógica para abrir secciones y posicionar la lectura al inicio.
 */
const toggle = async (id) => {
  activeTab.value = activeTab.value === id ? null : id;
  
  if (activeTab.value !== null) {
    await nextTick();
    const index = id - 1;
    const element = sectionRefs.value[index];
    
    if (element) {
      setTimeout(() => {
        const container = isZoomed.value ? document.getElementById('scroll-container') : null;
        if (container) {
          container.scrollTo({
            top: element.offsetTop - 10,
            behavior: 'smooth'
          });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }
};

// ✅ RESET AL SALIR: Restablece todo al valor por defecto
const toggleZoom = () => {
  if (isZoomed.value) {
    readingTheme.value = 'light';
    fontSize.value = 24;
    activeTab.value = null;
  }
  isZoomed.value = !isZoomed.value;
};

const handleAcceptance = () => {
  if (isAccepted.value) {
    emit('accepted', true);
  }
};

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
  <div class="flex flex-col h-full bg-white text-slate-800 font-sans relative">
    
    <header 
      class="text-center mb-4 shrink-0 px-2 relative border-b border-slate-50 pb-2" 
      style="font-family: 'Inter Variable', sans-serif;"
    >
      <div class="flex justify-center mb-1">
        <span class="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
          Búho Mate v2.8.2
        </span>
      </div>
      <div class="flex items-center justify-center gap-4">
        <h1 class="text-lg font-black text-indigo-900 uppercase tracking-tight">
          Marco Legal e Integral
        </h1>
        <button 
          @click="toggleZoom" 
          class="p-2 bg-indigo-600 text-white rounded-full shadow-xl active:scale-90 transition-all"
        >
          <ZoomIn :size="32" stroke-width="2.5" />
        </button>
      </div>
      <p class="text-[10px] text-slate-400 font-bold">
        Actualización: 20 de febrero de 2026
      </p>
    </header>

    <div class="flex-1 space-y-2 mb-4 overflow-y-auto pr-1 custom-scrollbar">
      <div v-for="sec in sections" :key="sec.id" class="border-2 rounded-xl border-slate-100">
        <button @click="toggle(sec.id)" class="w-full p-3 flex items-center justify-between bg-slate-50 rounded-xl">
          <span class="text-[10px] font-black text-indigo-800 uppercase flex items-center gap-2">
            <component :is="sec.icon" :size="14" /> {{ sec.title }}
          </span>
          <ChevronDown :size="14" :class="activeTab === sec.id ? 'rotate-180 text-indigo-500' : ''" />
        </button>
        <div v-if="activeTab === sec.id" class="p-3 text-[11px] text-slate-600 leading-relaxed font-medium">
          {{ sec.content }}
        </div>
      </div>
    </div>

    <div class="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 shrink-0">
      <label class="flex items-start gap-3 cursor-pointer mb-4 group">
        <input type="checkbox" v-model="isAccepted" class="h-5 w-5 accent-indigo-600 cursor-pointer" />
        <span class="text-[10px] font-bold text-slate-700 leading-tight">Acepto la Política de Privacidad y el Copyright de Búho Matemático.</span>
      </label>
      <button 
        @click="handleAcceptance" 
        :disabled="!isAccepted" 
        :class="['w-full py-3 rounded-xl font-black text-xs uppercase transition-all', isAccepted ? 'bg-indigo-600 text-white shadow-md active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed']"
      >
        Aceptar y Continuar 🦉
      </button>
    </div>

    <Teleport to="body">
      <div v-if="isZoomed" class="fixed inset-0 z-[9999] bg-slate-900/40 flex justify-center overflow-hidden animate-fade-in backdrop-blur-md">
        <div class="w-full max-w-[500px] h-full bg-white shadow-2xl border-x border-slate-200 flex flex-col animate-pop-in relative">
          
          <header class="bg-indigo-900 text-white p-5 flex justify-between items-center shadow-xl shrink-0 z-10">
            <div class="flex flex-col text-left">
              <span class="text-[10px] font-black text-yellow-300 uppercase tracking-widest italic leading-none">Lectura Inmersiva</span>
              <h1 class="text-xl font-black uppercase tracking-tighter">Búho Matemático</h1>
            </div>
            <button @click="toggleZoom" class="bg-yellow-400 text-indigo-900 p-3 rounded-2xl shadow-xl active:scale-95 transition-transform">
              <Shrink :size="40" stroke-width="3" />
            </button>
          </header>

          <div class="p-3 border-b flex items-center justify-center gap-4 bg-slate-50 shrink-0">
            <button @click="fontSize > 16 && fontSize--" 
                    class="flex-1 max-w-[120px] h-10 bg-indigo-100 text-indigo-700 rounded-xl font-black text-2xl active:scale-95 transition-all flex items-center justify-center shadow-sm">
              -
            </button>
            <div class="flex items-center gap-1 px-4 bg-white py-1 rounded-full border border-slate-200 shadow-inner">
              <Type :size="14" class="text-indigo-400" />
              <span class="text-xs font-black text-indigo-900 w-4 text-center">{{ fontSize }}</span>
            </div>
            <button @click="fontSize < 48 && fontSize++" 
                    class="flex-1 max-w-[120px] h-10 bg-indigo-100 text-indigo-700 rounded-xl font-black text-2xl active:scale-95 transition-all flex items-center justify-center shadow-sm">
              +
            </button>
            <div class="flex gap-2 ml-2">
              <button @click="readingTheme = 'light'" class="w-6 h-6 rounded-full bg-white border-2 border-slate-300 shadow-sm" :class="{'ring-2 ring-indigo-500': readingTheme === 'light'}"></button>
              <button @click="readingTheme = 'sepia'" class="w-6 h-6 rounded-full bg-[#f4ecd8] border-2 border-[#d3c5a3] shadow-sm" :class="{'ring-2 ring-indigo-500': readingTheme === 'sepia'}"></button>
              <button @click="readingTheme = 'dark'" class="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-600 shadow-sm" :class="{'ring-2 ring-indigo-500': readingTheme === 'dark'}"></button>
            </div>
          </div>

          <div id="scroll-container" 
               class="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-smooth transition-colors duration-500"
               :style="readingStyles"
               :class="{
                 'bg-white text-slate-700': readingTheme === 'light',
                 'bg-[#f4ecd8] text-[#5b4636]': readingTheme === 'sepia',
                 'bg-slate-800 text-slate-100': readingTheme === 'dark'
               }">
            <div class="space-y-6 pb-20">
              <div 
                v-for="(sec, index) in sections" 
                :key="sec.id" 
                :ref="el => sectionRefs[index] = el" 
                class="border-2 rounded-[2rem] overflow-hidden shadow-lg transition-all"
                :class="[
                  activeTab === sec.id ? 'border-indigo-600' : 'border-slate-100/50',
                  readingTheme === 'dark' ? 'bg-slate-700/50' : 'bg-white/80'
                ]"
              >
                <button @click="toggle(sec.id)" class="w-full p-8 flex items-center justify-between text-left" 
                        :class="readingTheme === 'dark' ? 'bg-slate-900/20' : 'bg-indigo-50/30'">
                  <span class="font-black uppercase flex items-center gap-4">
                    <component :is="sec.icon" :size="fontSize * 1.2" class="text-indigo-600 shrink-0" /> {{ sec.title }}
                  </span>
                  <ChevronDown :size="fontSize * 1.2" :class="activeTab === sec.id ? 'rotate-180 text-indigo-600' : ''" />
                </button>
                <div v-if="activeTab === sec.id" class="p-10 leading-snug font-medium border-t-2 border-slate-100/20 animate-fade-in">
                  {{ sec.content }}
                </div>
              </div>
            </div>
          </div>
          <div class="h-8 bg-white flex justify-center items-center shrink-0 border-t border-slate-100">
              <div class="w-20 h-1.5 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>