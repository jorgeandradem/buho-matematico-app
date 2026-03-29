<script setup>
import { ref, nextTick, computed, watch } from 'vue';
import { 
  BookOpen, Sparkles, ChevronDown, MousePointer2, Eye, 
  Eraser, Keyboard, GraduationCap, Trophy, User, 
  ShieldCheck, Heart, MessageCircle, ZoomIn, Shrink,
  Type
} from 'lucide-vue-next';
import OwlImage from './OwlImage.vue';

// --- ESTADO ORIGINAL ---
const activeSection = ref(null);
const isZoomed = ref(false);
const sectionRefs = ref([]);

// --- 🧪 ESTADO DE LECTURA INMERSIVA ---
const fontSize = ref(22);      // Tamaño inicial para modo lectura
const readingTheme = ref('light'); // 'light', 'sepia', 'dark'

// 🎨 ESTILOS REACTIVOS (Herencia directa para que el contenido obedezca)
const readingStyles = computed(() => ({
  fontSize: `${fontSize.value}px`,
  fontFamily: '"Inter", sans-serif',
  transition: 'all 0.3s ease'
}));

// Restablecer el zoom a 22 cada vez que se abre el modo inmersivo
watch(isZoomed, (isOpen) => {
    if (isOpen) {
        fontSize.value = 22;
    }
});

// Lógica de Scroll Original
const toggle = async (id) => {
  activeSection.value = activeSection.value === id ? null : id;
  
  if (activeSection.value !== null) {
    await nextTick();
    const index = id - 1;
    const element = sectionRefs.value[index];
    if (element) {
      setTimeout(() => {
        const container = isZoomed.value ? document.getElementById('guide-scroll-box') : null;
        if (container) {
          container.scrollTo({
            top: element.offsetTop - 20,
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
    fontSize.value = 22;
    activeSection.value = null;
  }
  isZoomed.value = !isZoomed.value;
};
</script>

<template>
  <div class="flex flex-col h-full bg-white text-slate-800 font-sans relative">
    
    <div class="space-y-4 pb-6 font-sans">
      <div class="flex flex-col items-center text-center bg-white p-6 rounded-[2rem] border-2 border-yellow-200 shadow-sm mb-6 relative">
        <button 
          @click="toggleZoom" 
          class="absolute top-4 right-4 p-2 bg-indigo-600 text-white rounded-full shadow-xl active:scale-90 transition-all"
        >
          <ZoomIn :size="32" stroke-width="2.5" />
        </button>

        <OwlImage customClass="w-24 h-24 mb-3 drop-shadow-lg" />
        <h4 class="text-indigo-900 font-black text-xl mb-1 italic">¡Hola! Soy el Profesor Búho</h4>
        <p class="text-slate-500 text-xs font-medium">Te guiaré paso a paso en tu aprendizaje. 🦉</p>
      </div>

      <div class="border-2 rounded-2xl overflow-hidden transition-all duration-300" 
           :class="activeSection === 1 ? 'border-indigo-500 bg-white shadow-md' : 'border-slate-100 bg-slate-50'">
        <button @click="toggle(1)" class="w-full p-4 flex items-center justify-between text-left">
          <div class="flex items-center gap-3 text-indigo-700 font-black uppercase text-xs tracking-widest">
            <BookOpen :size="20" /> 📌 SECCIÓN 1: PROPÓSITO Y ORIGEN
          </div>
          <ChevronDown :size="20" class="transition-transform duration-300" :class="activeSection === 1 ? 'rotate-180' : ''" />
        </button>
        
        <div v-if="activeSection === 1" class="p-5 pt-0 text-[11px] text-slate-600 leading-relaxed space-y-4 animate-fade-in">
          <div class="flex gap-3">
            <User :size="18" class="text-indigo-500 shrink-0" />
            <p><strong>¿Quién la creó?:</strong> Esta aplicación es una iniciativa personal de <strong>Jorge Andrade</strong>, mentor digital. Nació como un regalo para sus nietos y hoy es una herramienta abierta para usuarios de cualquier edad que deseen fortalecer su agilidad mental.</p>
          </div>
          <div class="flex gap-3">
            <ShieldCheck :size="18" class="text-green-500 shrink-0" />
            <p><strong>Sin Distracciones:</strong> Nuestra misión es ofrecer un espacio seguro y ético. Por ello, la App es totalmente gratuita y está libre de publicidad.</p>
          </div>
          <div class="flex gap-3">
            <Heart :size="18" class="text-rose-500 shrink-0" />
            <p><strong>Ayuda Universal:</strong> Está diseñada tanto para niños en etapa escolar como para adultos que quieran dejar de depender de la calculadora en su día a día.</p>
          </div>
        </div>
      </div>

      <div class="border-2 rounded-2xl overflow-hidden transition-all duration-300" 
           :class="activeSection === 2 ? 'border-indigo-500 bg-white shadow-md' : 'border-slate-100 bg-slate-50'">
        <button @click="toggle(2)" class="w-full p-4 flex items-center justify-between text-left">
          <div class="flex items-center gap-3 text-indigo-700 font-black uppercase text-xs tracking-widest">
            <Sparkles :size="20" /> 🎮 SECCIÓN 2: FUNCIONALIDADES Y MAGIA
          </div>
          <ChevronDown :size="20" class="transition-transform duration-300" :class="activeSection === 2 ? 'rotate-180' : ''" />
        </button>

        <div v-if="activeSection === 2" class="p-5 pt-0 text-[11px] text-slate-600 space-y-4 animate-fade-in leading-relaxed">
          <div class="flex gap-3">
            <MousePointer2 :size="18" class="text-yellow-500 shrink-0" />
            <p><strong>Foco Inteligente:</strong> No perderás tiempo buscando dónde pulsar. Verás un foco guía con bordes amarillos que late suavemente para orientarte. Además, la navegación es automática: el cursor salta solo a la siguiente casilla al responder correctamente.</p>
          </div>
          <div class="flex gap-3">
            <Eye :size="18" class="text-blue-500 shrink-0" />
            <p><strong>Ojos de Ayuda Continua:</strong> Si te sientes atascado en una tabla, ¡no te detengas! Despliega los ojos de ayuda para visualizar la tabla de multiplicar en práctica. Es un aprendizaje dinámico pensado para que nunca te detengas.</p>
          </div>
          <div class="flex gap-3">
            <Eraser :size="18" class="text-slate-500 shrink-0" />
            <p><strong>Cambio y Reinicio:</strong> ¿Quieres otro reto? Usa el icono del borrador para resetear la pantalla o cambiar el tipo de ejercicio de forma aleatoria en cualquier momento.</p>
          </div>
          <div class="flex gap-3">
            <Keyboard :size="18" class="text-indigo-500 shrink-0" />
            <p><strong>Teclado Virtual:</strong> Hemos integrado un teclado virtual exclusivo dentro de la app para que resolver los ejercicios sea rápido, cómodo y táctil, sin que el teclado del móvil te estorbe.</p>
          </div>
          <div class="flex gap-3">
            <GraduationCap :size="18" class="text-indigo-800 shrink-0" />
            <p><strong>Mentoría del Búho:</strong> Dentro de cada cuaderno, yo (el Profesor Búho) te daré instrucciones precisas sobre qué paso sigue en cada operación.</p>
          </div>
          <div class="flex gap-3">
            <Trophy :size="18" class="text-orange-500 shrink-0" />
            <div class="space-y-1">
              <p><strong>Premios y Rachas:</strong> Gana monedas de Cobre, Plata y Oro por cada acierto.</p>
              <p class="flex items-center gap-1"><MessageCircle :size="12" class="text-green-500"/> Mantén tu racha diaria para ver efectos de sonido especiales y recibir notificaciones de tus logros vía WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isZoomed" class="fixed inset-0 z-[9999] bg-slate-900/40 flex justify-center overflow-hidden animate-fade-in backdrop-blur-md">
        
        <div class="w-full max-w-[500px] h-full bg-white shadow-2xl border-x border-slate-200 flex flex-col animate-pop-in relative">
          
          <header class="bg-indigo-900 text-white p-6 flex justify-between items-center shadow-xl shrink-0 z-10">
            <div class="flex flex-col text-left">
              <span class="text-[10px] font-black text-yellow-300 uppercase tracking-widest italic leading-none">Modo Inmersivo</span>
              <h1 class="text-xl font-black uppercase tracking-tighter">Guía de Uso</h1>
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

            <button @click="fontSize < 40 && fontSize++" 
                    class="flex-1 max-w-[120px] h-10 bg-indigo-100 text-indigo-700 rounded-xl font-black text-2xl active:scale-95 transition-all flex items-center justify-center shadow-sm">
              +
            </button>

            <div class="flex gap-2 ml-2">
              <button @click="readingTheme = 'light'" class="w-6 h-6 rounded-full bg-white border-2 border-slate-300" :class="{'ring-2 ring-indigo-500': readingTheme === 'light'}"></button>
              <button @click="readingTheme = 'sepia'" class="w-6 h-6 rounded-full bg-[#f4ecd8] border-2 border-[#d3c5a3]" :class="{'ring-2 ring-indigo-500': readingTheme === 'sepia'}"></button>
              <button @click="readingTheme = 'dark'" class="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-600" :class="{'ring-2 ring-indigo-500': readingTheme === 'dark'}"></button>
            </div>
          </div>

          <div id="guide-scroll-box" 
               class="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-smooth transition-colors duration-500"
               :style="readingStyles"
               :class="{
                 'bg-white text-slate-700': readingTheme === 'light',
                 'bg-[#f4ecd8] text-[#5b4636]': readingTheme === 'sepia',
                 'bg-slate-800 text-slate-100': readingTheme === 'dark'
               }">
            <div class="space-y-6">
              
              <div class="flex flex-col items-center text-center p-8 rounded-[3rem] border-4 border-yellow-200 shadow-md mb-8"
                   :class="readingTheme === 'dark' ? 'bg-slate-700' : 'bg-white'">
                <OwlImage customClass="w-32 h-32 mb-4 drop-shadow-xl" />
                <h4 class="font-black mb-1 italic" :class="readingTheme === 'dark' ? 'text-yellow-400' : 'text-indigo-900'">¡Hola! Soy el Profesor Búho</h4>
                <p class="font-medium leading-tight opacity-80 text-center">Te guiaré paso a paso en tu aprendizaje. 🦉</p>
              </div>

              <div v-for="sec in [1, 2]" :key="sec" 
                :ref="el => sectionRefs[sec - 1] = el" 
                class="border-2 rounded-[2.5rem] overflow-hidden shadow-lg transition-all"
                :class="[
                  activeSection === sec ? 'border-indigo-600' : 'border-slate-100/50',
                  readingTheme === 'dark' ? 'bg-slate-700/50' : 'bg-white/80'
                ]"
              >
                <button @click="toggle(sec)" class="w-full p-8 flex items-center justify-between text-left" :class="readingTheme === 'dark' ? 'bg-slate-900/20' : 'bg-indigo-50/30'">
                  <span class="font-black uppercase flex items-center gap-4">
                    <component :is="sec === 1 ? BookOpen : Sparkles" :size="fontSize * 1.2" class="text-indigo-600 shrink-0" /> 
                    SECCIÓN {{ sec }}: {{ sec === 1 ? 'PROPÓSITO Y ORIGEN' : 'FUNCIONALIDADES Y MAGIA' }}
                  </span>
                  <ChevronDown :size="fontSize * 1.2" :class="activeSection === sec ? 'rotate-180 text-indigo-600' : ''" />
                </button>
                
                <div v-if="activeSection === sec" class="p-10 leading-snug font-medium border-t-2 border-slate-100/20 animate-fade-in space-y-8">
                  <template v-if="sec === 1">
                    <div class="flex gap-4"><User :size="fontSize" class="text-indigo-500 shrink-0" /><p><strong>¿Quién la creó?:</strong> Esta aplicación es una iniciativa personal de <strong>Jorge Andrade</strong>, mentor digital. Nació como un regalo para sus nietos y hoy es una herramienta abierta para usuarios de cualquier edad que deseen fortalecer su agilidad mental.</p></div>
                    <div class="flex gap-4"><ShieldCheck :size="fontSize" class="text-green-500 shrink-0" /><p><strong>Sin Distracciones:</strong> Nuestra misión es ofrecer un espacio seguro y ético. Por ello, la App es totalmente gratuita y está libre de publicidad.</p></div>
                    <div class="flex gap-4"><Heart :size="fontSize" class="text-rose-500 shrink-0" /><p><strong>Ayuda Universal:</strong> Está diseñada tanto para niños en etapa escolar como para adultos que quieran dejar de depender de la calculadora en su día a día.</p></div>
                  </template>

                  <template v-else>
                    <div class="flex gap-4"><MousePointer2 :size="fontSize" class="text-yellow-500 shrink-0" /><p><strong>Foco Inteligente:</strong> No perderás tiempo buscando dónde pulsar. Verás un foco guía con bordes amarillos que late suavemente para orientarte. Además, la navegación es automática: el cursor salta solo a la siguiente casilla al responder correctamente.</p></div>
                    <div class="flex gap-4"><Eye :size="fontSize" class="text-blue-500 shrink-0" /><p><strong>Ojos de Ayuda Continua:</strong> Si te sientes atascado en una tabla, ¡no te detengas! Despliega los ojos de ayuda para visualizar la tabla de multiplicar en práctica. Es un aprendizaje dinámico pensado para que nunca te detengas.</p></div>
                    <div class="flex gap-4"><Eraser :size="fontSize" class="text-slate-500 shrink-0" /><p><strong>Cambio y Reinicio:</strong> ¿Quieres otro reto? Usa el icono del borrador para resetear la pantalla o cambiar el tipo de ejercicio de forma aleatoria en cualquier momento.</p></div>
                    <div class="flex gap-4"><Keyboard :size="fontSize" class="text-indigo-500 shrink-0" /><p><strong>Teclado Virtual:</strong> Hemos integrado un teclado virtual exclusivo dentro de la app para que resolver los ejercicios sea rápido, cómodo y táctil, sin que el teclado del móvil te estorbe.</p></div>
                    <div class="flex gap-4"><GraduationCap :size="fontSize" class="text-indigo-800 shrink-0" /><p><strong>Mentoría del Búho:</strong> Dentro de cada cuaderno, yo (el Profesor Búho) te daré instrucciones precisas sobre qué paso sigue en cada operación.</p></div>
                    <div class="flex gap-4"><Trophy :size="fontSize" class="text-orange-500 shrink-0" /><div class="space-y-2"><p><strong>Premios y Rachas:</strong> Gana monedas de Cobre, Plata y Oro por cada acierto.</p><p class="flex items-center gap-2 text-green-700 font-black"><MessageCircle :size="fontSize * 0.8"/> Mantén tu racha diaria para ver efectos de sonido especiales y recibir notificaciones de tus logros vía WhatsApp.</p></div></div>
                  </template>
                </div>
              </div>
            </div>
            <div class="h-32"></div>
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