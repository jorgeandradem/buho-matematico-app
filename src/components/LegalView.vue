<script setup>
import { ref, nextTick } from 'vue';
import { 
  ChevronDown, ShieldCheck, Lock, Gavel, Cpu, Info,
  ZoomIn, Shrink 
} from 'lucide-vue-next';

const emit = defineEmits(['accepted']);
const isAccepted = ref(false);
const activeTab = ref(null);
const isZoomed = ref(false);
const sectionRefs = ref([]);

/**
 * Lógica para abrir secciones y posicionar la lectura al inicio.
 * Detecta si estamos en modo normal o modo zoom para aplicar el scroll correcto.
 */
const toggle = async (id) => {
  activeTab.value = activeTab.value === id ? null : id;
  
  if (activeTab.value !== null) {
    await nextTick();
    const index = id - 1;
    const element = sectionRefs.value[index];
    
    if (element) {
      setTimeout(() => {
        // Si estamos en modo Zoom, el scroll debe ocurrir dentro de su contenedor propio
        const container = isZoomed.value ? document.getElementById('scroll-container') : null;
        
        if (container) {
          // Ajuste fino para modo Smartphone
          container.scrollTo({
            top: element.offsetTop - 10,
            behavior: 'smooth'
          });
        } else {
          // Scroll estándar para vista normal
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }
};

const toggleZoom = () => {
  isZoomed.value = !isZoomed.value;
  if (!isZoomed.value) activeTab.value = null;
};

// Función para confirmar aceptación y cerrar
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
    
    <header class="text-center mb-4 shrink-0 px-2 relative">
      <div class="flex justify-center mb-1">
        <span class="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Búho Mate v2.8.2</span>
      </div>
      <div class="flex items-center justify-center gap-4">
        <h1 class="text-lg font-black text-indigo-900 uppercase italic tracking-tight">Marco Legal e Integral</h1>
        <button 
          @click="toggleZoom" 
          class="p-2 bg-indigo-600 text-white rounded-full shadow-xl active:scale-90 hover:bg-indigo-700 transition-all"
        >
          <ZoomIn :size="42" stroke-width="2.5" />
        </button>
      </div>
      <p class="text-[10px] text-slate-400 italic font-medium">Actualización: 20 de febrero de 2026</p>
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
      <div v-if="isZoomed" class="fixed inset-0 z-[9999] bg-white flex justify-center overflow-hidden animate-fade-in">
        
        <div class="w-full max-w-[500px] h-full bg-white shadow-[0_0_60px_rgba(0,0,0,0.15)] border-x border-slate-100 flex flex-col animate-pop-in relative">
          
          <header class="bg-indigo-900 text-white p-5 flex justify-between items-center shadow-xl shrink-0 z-10">
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-yellow-300 uppercase tracking-widest italic leading-none">Lectura Inmersiva</span>
              <h1 class="text-xl font-black uppercase tracking-tighter">Búho Matemático</h1>
            </div>
            <button @click="toggleZoom" class="bg-yellow-400 text-indigo-900 p-3 rounded-2xl shadow-xl active:scale-95 transition-transform">
              <Shrink :size="40" stroke-width="3" />
            </button>
          </header>

          <div id="scroll-container" class="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar scroll-smooth">
            <div class="space-y-6 pb-20">
              <div 
                v-for="(sec, index) in sections" 
                :key="sec.id" 
                :ref="el => sectionRefs[index] = el" 
                class="bg-white border-2 rounded-[2rem] overflow-hidden shadow-sm transition-all"
                :class="activeTab === sec.id ? 'border-indigo-600' : 'border-white'"
              >
                <button @click="toggle(sec.id)" class="w-full p-6 flex items-center justify-between text-left bg-indigo-50/50">
                  <span class="text-xl font-black text-indigo-900 uppercase flex items-center gap-4">
                    <component :is="sec.icon" :size="28" class="text-indigo-600" /> {{ sec.title }}
                  </span>
                  <ChevronDown :size="28" :class="activeTab === sec.id ? 'rotate-180 text-indigo-600' : ''" />
                </button>
                
                <div v-if="activeTab === sec.id" class="p-8 text-2xl text-slate-700 leading-snug font-medium border-t-2 border-slate-100 animate-fade-in">
                  {{ sec.content }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="h-6 bg-white flex justify-center items-center shrink-0 border-t border-slate-50">
              <div class="w-16 h-1 bg-slate-200 rounded-full"></div>
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