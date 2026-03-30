<script setup>
import { ref, computed, watch } from 'vue';

const emit = defineEmits(['completado']);

const rondaActual = ref(1);
const totalRondas = 5;
const aciertos = ref(0);

// 🛠️ Añadido estado para mostrar el popup de reglas al inicio
const mostrarPopup = ref(true);

const objetivo = ref({ base: 0, profundidad: 0, altura: 0 });
const volumenObjetivo = computed(() => objetivo.value.base * objetivo.value.profundidad * objetivo.value.altura);

const base = ref(1);
const profundidad = ref(1);
const altura = ref(1);
const retoCompletadoRonda = ref(false);

const volumenActual = computed(() => base.value * profundidad.value * altura.value);

const generarRonda = () => {
  retoCompletadoRonda.value = false;
  // Valores aleatorios entre 1 y 5 (o 4 para que no sea inmenso)
  objetivo.value = {
    base: Math.floor(Math.random() * 4) + 2,
    profundidad: Math.floor(Math.random() * 3) + 1,
    altura: Math.floor(Math.random() * 4) + 2
  };
  // Resetea los controles del usuario
  base.value = 1; profundidad.value = 1; altura.value = 1;
};

generarRonda();

watch([base, profundidad, altura], () => {
  if (retoCompletadoRonda.value) return;

  const audioFill = new Audio('/audios/water-fill.mp3'); audioFill.volume = 0.5; audioFill.play().catch(() => {});

  if (base.value == objetivo.value.base && profundidad.value == objetivo.value.profundidad && altura.value == objetivo.value.altura) {
    retoCompletadoRonda.value = true;
    aciertos.value++;
    
    const audioWin = new Audio('/audios/ding.mp3'); audioWin.play().catch(() => {});

    setTimeout(() => {
      if (rondaActual.value < totalRondas) {
        rondaActual.value++;
        generarRonda();
      } else {
        emit('completado', aciertos.value);
      }
    }, 2500); 
  }
});
</script>

<template>
  <div class="reto-contenedor w-full h-full flex flex-col items-center justify-start pt-4 relative">
    
    <button id="btn-abrir-reglas-2" @click="mostrarPopup = true" class="hidden"></button>

    <transition name="fade-popup">
        <div v-if="mostrarPopup" class="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div class="bg-cyan-950/90 border border-cyan-400 p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] max-w-sm text-center">
                <h2 class="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-widest">Calculadora de Volumen</h2>
                <p class="text-cyan-100 mb-6 text-sm md:text-base text-left">Ajusta la Base, Profundidad y Altura usando los controles para llenar el contenedor con el volumen exacto de líquido cuántico.</p>
                <button @click="mostrarPopup = false" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all w-full">¡Comenzar!</button>
            </div>
        </div>
    </transition>

    <div class="instruccion bg-cyan-950/60 border border-cyan-400/50 backdrop-blur-md px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] text-center z-40 relative w-[90%] md:w-auto">
      <div class="flex justify-between items-center mb-1 border-b border-cyan-500/30 pb-1 gap-4">
        <span class="text-xs font-bold text-emerald-400">RONDA {{ rondaActual }}/{{ totalRondas }}</span>
        <span class="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">Calculadora</span>
      </div>
      <p class="text-sm md:text-lg text-white mb-1">
        Crea el bloque exacto de <span class="text-emerald-400 font-bold text-xl">Volumen {{ volumenObjetivo }}</span>
      </p>
      <p class="text-xs md:text-sm font-mono text-cyan-300">
        (Base: {{ objetivo.base }}, Profundidad: {{ objetivo.profundidad }}, Altura: {{ objetivo.altura }})
      </p>
    </div>

    <div class="area-interactiva w-full flex flex-col md:flex-row items-center justify-center gap-10 mt-4 md:mt-10">
      
      <div class="espacio-3d relative">
        <div class="contenedor-cristal">
          <div class="cristal-fondo"></div>
          <div class="cristal-izquierda"></div>
          <div class="cristal-base"></div>
        </div>

        <div class="liquido-volumen" :style="{ '--b': base, '--p': profundidad, '--h': altura }">
          <div class="liquido-top" :class="{ 'ondas-activas': retoCompletadoRonda }"></div>
          <div class="liquido-frente"></div>
          <div class="liquido-derecha"></div>
          
          <div v-if="retoCompletadoRonda" class="burbujas-contenedor">
            <div class="burbuja b1"></div><div class="burbuja b2"></div><div class="burbuja b3"></div><div class="burbuja b4"></div>
          </div>
        </div>
      </div>

      <div class="controles flex flex-col gap-6 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/30">
        <div class="text-center mb-2">
          <p class="text-cyan-400 text-sm uppercase tracking-wider">Tu Volumen</p>
          <p class="text-4xl font-black font-mono" :class="retoCompletadoRonda ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'text-white'">
            {{ volumenActual }}
          </p>
        </div>

        <div class="slider-group"><label class="text-emerald-300 font-mono text-sm">Base (X): {{ base }}</label><input type="range" min="1" max="5" v-model="base" class="hologram-slider slider-x" :disabled="retoCompletadoRonda"></div>
        <div class="slider-group"><label class="text-blue-300 font-mono text-sm">Prof (Y): {{ profundidad }}</label><input type="range" min="1" max="5" v-model="profundidad" class="hologram-slider slider-y" :disabled="retoCompletadoRonda"></div>
        <div class="slider-group"><label class="text-pink-300 font-mono text-sm">Alt (Z): {{ altura }}</label><input type="range" min="1" max="5" v-model="altura" class="hologram-slider slider-z" :disabled="retoCompletadoRonda"></div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.reto-contenedor { perspective: 1000px; --u: 30px; }
@media (min-width: 768px) { .reto-contenedor { --u: 40px; } }

.fade-popup-enter-active, .fade-popup-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-popup-enter-from, .fade-popup-leave-to { opacity: 0; transform: scale(0.95); }

.espacio-3d { width: calc(var(--u) * 5); height: calc(var(--u) * 5); transform: rotateX(60deg) rotateZ(45deg); transform-style: preserve-3d; margin-bottom: 20px; }

.contenedor-cristal { position: absolute; width: 100%; height: 100%; transform-style: preserve-3d; }
.cristal-base { position: absolute; width: 100%; height: 100%; border: 1px solid rgba(255,255,255,0.2); background: repeating-linear-gradient(0deg, transparent, transparent calc(var(--u) - 1px), rgba(255, 255, 255, 0.1) calc(var(--u) - 1px), rgba(255, 255, 255, 0.1) var(--u)), repeating-linear-gradient(90deg, transparent, transparent calc(var(--u) - 1px), rgba(255, 255, 255, 0.1) calc(var(--u) - 1px), rgba(255, 255, 255, 0.1) var(--u)); }
.cristal-fondo { position: absolute; width: 100%; height: calc(var(--u) * 5); background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(34, 211, 238, 0.3); transform-origin: top; transform: rotateX(-90deg); }
.cristal-izquierda { position: absolute; width: calc(var(--u) * 5); height: 100%; background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(34, 211, 238, 0.3); transform-origin: left; transform: rotateY(90deg); }

.liquido-volumen { position: absolute; top: 0; left: 0; width: calc(var(--b) * var(--u)); height: calc(var(--p) * var(--u)); transform-style: preserve-3d; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.liquido-top { position: absolute; width: 100%; height: 100%; background: rgba(16, 185, 129, 0.8); box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(16, 185, 129, 0.6); border: 2px solid #34d399; transform: translateZ(calc(var(--h) * var(--u))); transition: all 0.4s ease-out; }
.ondas-activas::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px); animation: olas 2s linear infinite; }
.liquido-frente { position: absolute; bottom: 0; left: 0; width: 100%; height: calc(var(--h) * var(--u)); background: rgba(16, 185, 129, 0.6); transform-origin: bottom; transform: rotateX(-90deg); transition: all 0.4s ease-out; }
.liquido-derecha { position: absolute; bottom: 0; right: 0; height: 100%; width: calc(var(--h) * var(--u)); background: rgba(5, 150, 105, 0.7); transform-origin: right; transform: rotateY(-90deg); transition: all 0.4s ease-out; }

.burbujas-contenedor { position: absolute; width: 100%; height: 100%; transform-style: preserve-3d; }
.burbuja { position: absolute; width: 8px; height: 8px; background: white; border-radius: 50%; box-shadow: 0 0 10px white; opacity: 0; transform: translateZ(0); }
.b1 { left: 20%; top: 30%; animation: subirBurbuja 1.5s ease-in infinite; } .b2 { left: 70%; top: 50%; animation: subirBurbuja 2s ease-in infinite 0.3s; } .b3 { left: 40%; top: 70%; animation: subirBurbuja 1.2s ease-in infinite 0.6s; } .b4 { left: 80%; top: 20%; animation: subirBurbuja 1.8s ease-in infinite 0.9s; }

@keyframes subirBurbuja { 0% { transform: translateZ(0) scale(0.5); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateZ(calc(var(--h) * var(--u))) scale(1.2); opacity: 0; } }
@keyframes olas { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }

.slider-group { display: flex; flex-direction: column; gap: 4px; }
.hologram-slider { -webkit-appearance: none; width: 180px; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; outline: none; border: 1px solid rgba(255,255,255,0.2); }
.hologram-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; box-shadow: 0 0 15px currentColor; }
.slider-x::-webkit-slider-thumb { background: #10b981; color: #10b981; } .slider-y::-webkit-slider-thumb { background: #3b82f6; color: #3b82f6; } .slider-z::-webkit-slider-thumb { background: #ec4899; color: #ec4899; }
</style>