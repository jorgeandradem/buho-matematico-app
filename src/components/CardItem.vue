<script setup>
import { computed } from 'vue';

const props = defineProps({
  card: {
    type: Object,
    required: true
  }
});

// Traducción visual de los valores
const displayValue = computed(() => {
  const vals = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  return vals[props.card.value] || props.card.value.toString();
});

// Selección del degradado 2.5D
const fillUrl = computed(() => {
  return props.card.color === 'red' ? 'url(#red-gradient)' : 'url(#black-gradient)';
});

// Color de texto complementario para el número
const colorClass = computed(() => {
  return props.card.color === 'red' ? 'text-rose-700' : 'text-slate-800';
});

// 🚀 VECTORES PREMIUM (Curvas de Bézier perfectas para cartas reales)
const suitPath = computed(() => {
  switch (props.card.suit) {
    case 'hearts':
      return 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
    case 'diamonds':
      return 'M12 1.5 L2.5 12 L12 22.5 L21.5 12 Z';
    case 'spades':
      return 'M12 2C8 6.5 3 11.5 3 15.5c0 2.5 2 4.5 4.5 4.5 1.5 0 2.9-.8 3.5-2v4h2v-4c.6 1.2 2 2 3.5 2 2.5 0 4.5-2 4.5-4.5C21 11.5 16 6.5 12 2z';
    case 'clubs':
      return 'M12 2c-2.2 0-4 1.8-4 4 0 1.6 1 3.1 2.4 3.7C7.6 9.8 5 12 5 15c0 2.8 2.2 5 5 5h.5l-1 4h5l-1-4h.5c2.8 0 5-2.2 5-5 0-3-2.6-5.2-5.4-5.3 1.4-.6 2.4-2.1 2.4-3.7 0-2.2-1.8-4-4-4z';
    default: 
      return '';
  }
});
</script>

<template>
  <div class="w-full h-full relative rounded-md sm:rounded-lg overflow-hidden flex flex-col transition-all duration-200">
    
    <div v-if="!card.isFaceUp" class="absolute inset-0 card-back border-2 border-white shadow-sm">
      <div class="absolute inset-1 border border-white/20 rounded-[4px]"></div>
      <div class="flex items-center justify-center w-full h-full">
        <div class="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
          <span class="text-white text-xs font-black opacity-80">🦉</span>
        </div>
      </div>
    </div>

    <div v-else class="absolute inset-0 bg-white border border-slate-300 shadow-sm flex flex-col justify-between p-1 sm:p-2 card-front" :class="colorClass">
      
      <svg width="0" height="0" class="absolute">
        <defs>
          <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e" /> <stop offset="100%" stop-color="#9f1239" /> </linearGradient>
          <linearGradient id="black-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#334155" /> <stop offset="100%" stop-color="#0f172a" /> </linearGradient>
        </defs>
      </svg>

      <div class="flex flex-col items-center leading-none self-start">
        <span class="text-sm sm:text-xl font-black tracking-tighter" style="text-shadow: 1px 1px 0px rgba(0,0,0,0.1);">{{ displayValue }}</span>
        <svg viewBox="0 0 24 24" class="w-3 h-3 sm:w-4 sm:h-4 svg-emboss">
          <path :d="suitPath" :fill="fillUrl" />
        </svg>
      </div>

      <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 sm:opacity-100">
        <svg viewBox="0 0 24 24" class="w-10 h-10 sm:w-16 sm:h-16 svg-emboss">
          <path :d="suitPath" :fill="fillUrl" />
        </svg>
      </div>

      <div class="hidden sm:flex flex-col items-center leading-none self-end rotate-180 opacity-60">
        <span class="text-xl font-black tracking-tighter">{{ displayValue }}</span>
        <svg viewBox="0 0 24 24" class="w-4 h-4">
          <path :d="suitPath" :fill="fillUrl" />
        </svg>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* DORSO: Patrón geométrico tipo "Bicycle" hecho con CSS puro */
.card-back {
  background-color: #1e293b;
  background-image: 
    linear-gradient(45deg, #0f172a 25%, transparent 25%, transparent 75%, #0f172a 75%, #0f172a),
    linear-gradient(45deg, #0f172a 25%, transparent 25%, transparent 75%, #0f172a 75%, #0f172a);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
}

/* FRENTE: Ligero degradado para dar textura de cartulina y no blanco nuclear */
.card-front {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

/* EL SECRETO 2.5D: Sombra proyectada que se adapta a la forma del vector (no cuadrada) */
.svg-emboss {
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.3));
}
</style>