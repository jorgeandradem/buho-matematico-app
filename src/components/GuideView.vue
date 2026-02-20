<script setup>
import { ref } from 'vue';
import { 
  BookOpen, Sparkles, ChevronDown, MousePointer2, Eye, 
  Eraser, Keyboard, GraduationCap, Trophy, User, 
  ShieldCheck, Heart, MessageCircle 
} from 'lucide-vue-next';
import OwlImage from './OwlImage.vue';

const activeSection = ref(null);
const toggle = (id) => activeSection.value = activeSection.value === id ? null : id;
</script>

<template>
  <div class="space-y-4 pb-6 font-sans">
    <div class="flex flex-col items-center text-center bg-white p-6 rounded-[2rem] border-2 border-yellow-200 shadow-sm mb-6">
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
          <p><strong>¿Quién la creó?:</strong> Esta aplicación es una iniciativa personal de <strong>Jorge Andrade</strong>, mentor digital. Nació como un regalo para su nieto y hoy es una herramienta abierta para usuarios de cualquier edad que deseen fortalecer su agilidad mental.</p>
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
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>