<script setup>
import { ref, watch } from 'vue';

const emit = defineEmits(['completado']);

const rondaActual = ref(1);
const totalRondas = 5;
const aciertos = ref(0);
const mostrarPopup = ref(false); 
const estadoRespuesta = ref(''); 

const objetivo = ref({ numerador: 1, denominador: 2 });
const divisionesActuales = ref(1);
const partesSeleccionadas = ref([false]);

const generarRonda = () => {
  estadoRespuesta.value = '';
  const d = Math.floor(Math.random() * 7) + 2; 
  const n = Math.floor(Math.random() * (d - 1)) + 1; 
  objetivo.value = { numerador: n, denominador: d };
  
  divisionesActuales.value = 1;
  partesSeleccionadas.value = [false];
};

generarRonda();

watch(divisionesActuales, (newVal) => {
  const num = parseInt(newVal);
  partesSeleccionadas.value = new Array(num).fill(false);
});

const tocarParte = (index) => {
  if (estadoRespuesta.value === 'correcto') return;
  partesSeleccionadas.value[index] = !partesSeleccionadas.value[index];
  new Audio('/audios/switch.mp3').play().catch(() => {});
};

const validarCorte = () => {
  if (estadoRespuesta.value === 'correcto') return;

  const partesEncendidas = partesSeleccionadas.value.filter(p => p).length;

  if (divisionesActuales.value == objetivo.value.denominador && partesEncendidas == objetivo.value.numerador) {
    estadoRespuesta.value = 'correcto';
    aciertos.value++;
    new Audio('/audios/ding.mp3').play().catch(()=>{});

    setTimeout(() => {
      if (rondaActual.value < totalRondas) {
        rondaActual.value++;
        generarRonda();
      } else {
        emit('completado', aciertos.value);
        // 🛠️ AUTO-RESET
        setTimeout(() => {
          rondaActual.value = 1;
          aciertos.value = 0;
          generarRonda();
        }, 1500);
      }
    }, 1500);
  } else {
    estadoRespuesta.value = 'error';
    new Audio('/audios/lightning.mp3').play().catch(()=>{});
    setTimeout(() => { estadoRespuesta.value = ''; }, 800);
  }
};
</script>

<template>
  <div class="reto-contenedor w-full h-full flex flex-col items-center justify-start pt-20 md:pt-28 relative">
    
    <div class="absolute top-[48px] md:top-[75px] left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 rounded-lg px-3 py-1 flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] z-50 whitespace-nowrap">
      <span class="text-[10px] md:text-xs text-cyan-200 font-bold uppercase tracking-widest">Premio:</span>
      <img src="/images/coin-silver.png" class="w-4 h-4 object-contain" />
      <span class="text-emerald-400 font-black text-sm">2</span>
    </div>

    <button id="btn-abrir-reglas-5" @click="mostrarPopup = true" class="hidden"></button>

    <transition name="fade-popup">
        <div v-if="mostrarPopup" class="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div class="bg-cyan-950/90 border border-cyan-400 p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] max-w-sm text-center">
                <h2 class="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-widest">Corte de Gema</h2>
                <p class="text-cyan-100 mb-6 text-sm md:text-base text-left">Divide el cristal en las partes del denominador y selecciona las del numerador para extraer la energía pura.</p>
                <button @click="mostrarPopup = false" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all w-full">¡Entendido!</button>
            </div>
        </div>
    </transition>

    <div class="instruccion bg-cyan-950/60 border border-cyan-400/50 backdrop-blur-md px-6 py-2 md:py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] text-center z-40 mx-4 w-[85%] md:w-auto flex flex-col items-center">
      <div class="flex justify-between items-center w-full mb-1 border-b border-cyan-500/30 pb-1 gap-4">
        <span class="text-xs font-bold text-emerald-400">RONDA {{ rondaActual }}/{{ totalRondas }}</span>
        <span class="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">Fracciones</span>
      </div>
      <p class="text-[10px] md:text-xs text-cyan-100 font-bold tracking-[0.2em] uppercase mt-1">Extrae la carga cuántica:</p>
      
      <div class="fraccion-display mt-2 flex flex-col items-center justify-center">
        <span class="text-3xl md:text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{{ objetivo.numerador }}</span>
        <div class="w-12 h-1 bg-emerald-400 my-1 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        <span class="text-3xl md:text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{{ objetivo.denominador }}</span>
      </div>
    </div>

    <div class="cristal-area mt-10 md:mt-16 w-[90%] md:w-[500px]" :class="estadoRespuesta">
      <div class="cristal-bar" :style="{ gridTemplateColumns: `repeat(${divisionesActuales}, 1fr)` }">
        <div v-for="(parte, index) in partesSeleccionadas" :key="index" 
             class="cristal-fragmento" 
             :class="{ 'activo': parte, 'extremo-izq': index === 0, 'extremo-der': index === divisionesActuales - 1 }"
             @click="tocarParte(index)">
          <div class="fragmento-brillo"></div>
          <div class="cara-top"></div>
        </div>
      </div>
    </div>

    <div class="controles-fraccion mt-12 md:mt-14 z-40 flex flex-col items-center gap-4 md:gap-6 w-[90%] max-w-sm bg-slate-900/80 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-cyan-500/50">
      
      <div class="w-full flex flex-col gap-2">
        <div class="flex justify-between items-center px-1">
          <span class="text-cyan-200 font-bold text-[10px] uppercase tracking-widest">Cortes del Cristal:</span>
          <span class="text-emerald-400 font-black text-lg bg-emerald-950/50 px-3 py-0.5 rounded border border-emerald-500/50">{{ divisionesActuales }}</span>
        </div>
        <input type="range" min="1" max="8" v-model="divisionesActuales" class="slider-cristal w-full">
      </div>

      <button @click="validarCorte" 
              class="w-full px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-lg rounded-xl border-2 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)] active:scale-95 transition-all tracking-widest uppercase">
        Confirmar Corte
      </button>

    </div>

  </div>
</template>

<style scoped>
.fade-popup-enter-active, .fade-popup-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-popup-enter-from, .fade-popup-leave-to { opacity: 0; transform: scale(0.95); }

/* ÁREA DEL CRISTAL */
.cristal-area { height: 80px; position: relative; transition: all 0.3s; perspective: 1000px; }
@media (min-width: 768px) { .cristal-area { height: 100px; } }

.cristal-area.correcto .cristal-bar { border-color: #10b981; box-shadow: 0 0 30px rgba(16, 185, 129, 0.5); }
.cristal-area.error { animation: shakeError 0.4s both; }

.cristal-bar {
  width: 100%; height: 100%;
  display: grid; gap: 4px;
  background: rgba(2, 6, 23, 0.4);
  border: 3px solid rgba(34, 211, 238, 0.4);
  border-radius: 12px;
  padding: 4px;
  box-shadow: inset 0 0 20px rgba(34, 211, 238, 0.2);
  transform: rotateX(20deg);
}

.cristal-fragmento {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(34, 211, 238, 0.05));
  position: relative; cursor: pointer;
  overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(34, 211, 238, 0.2);
}

.cristal-fragmento.extremo-izq { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
.cristal-fragmento.extremo-der { border-top-right-radius: 6px; border-bottom-right-radius: 6px; }

/* Efecto 2.5D al estar activo */
.cristal-fragmento.activo {
  background: linear-gradient(135deg, #10b981, #064e3b);
  border-color: #34d399;
  transform: translateZ(15px) translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.6);
}

.cara-top {
  position: absolute; top: 0; left: 0; width: 100%; height: 4px;
  background: rgba(255, 255, 255, 0.3); opacity: 0; transition: 0.3s;
}
.cristal-fragmento.activo .cara-top { opacity: 1; }

.fragmento-brillo {
  position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
  transform: skewX(-20deg);
}
.cristal-fragmento.activo .fragmento-brillo { animation: reflejo 2.5s infinite; }

@keyframes reflejo { 0% { left: -100%; } 100% { left: 200%; } }

.slider-cristal { -webkit-appearance: none; width: 100%; height: 8px; background: #0f172a; border-radius: 4px; border: 1px solid rgba(34, 211, 238, 0.3); }
.slider-cristal::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #22d3ee; cursor: pointer; border: 3px solid #fff; box-shadow: 0 0 10px #22d3ee; }

@keyframes shakeError { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
</style>