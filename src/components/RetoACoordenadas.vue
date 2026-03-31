<script setup>
import { ref } from 'vue';

const emit = defineEmits(['completado']);

const rondaActual = ref(1);
const totalRondas = 5;
const aciertos = ref(0);
const objetivo = ref({ x: 0, y: 0, z: 0 });

const posX = ref(1); const posY = ref(1); const posZ = ref(1);
const waveActiva = ref(false);
const estadoRespuesta = ref(''); 
const mostrarPopup = ref(false); // 🛠️ FIX: Ahora inicia en FALSE (juego abierto)

const generarRonda = () => {
  waveActiva.value = false;
  estadoRespuesta.value = '';
  objetivo.value = {
    x: Math.floor(Math.random() * 4) + 1,
    y: Math.floor(Math.random() * 4) + 1,
    z: Math.floor(Math.random() * 4) + 1
  };
};

generarRonda();

const verificarCoordenada = () => {
  if (estadoRespuesta.value === 'correcto') return;

  if (posX.value == objetivo.value.x && posY.value == objetivo.value.y && posZ.value == objetivo.value.z) {
    estadoRespuesta.value = 'correcto';
    waveActiva.value = true;
    aciertos.value++;
    
    const audioWin = new Audio('/audios/ding.mp3'); audioWin.play().catch(()=>{});

    setTimeout(() => {
      if (rondaActual.value < totalRondas) {
        rondaActual.value++;
        generarRonda();
      } else {
        emit('completado', aciertos.value);
        
        // 🛠️ FIX: Auto-Reset silencioso para que quede listo si dan otra vuelta
        setTimeout(() => {
          rondaActual.value = 1;
          aciertos.value = 0;
          generarRonda();
        }, 1000);
      }
    }, 2000);
  } else {
    estadoRespuesta.value = 'error';
    const audioError = new Audio('/audios/switch.mp3'); audioError.play().catch(()=>{});
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

    <button id="btn-abrir-reglas-0" @click="mostrarPopup = true" class="hidden"></button>

    <transition name="fade-popup">
        <div v-if="mostrarPopup" class="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div class="bg-cyan-950/90 border border-cyan-400 p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] max-w-sm text-center">
                <h2 class="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-widest">Coordenadas</h2>
                <p class="text-cyan-100 mb-6 text-sm md:text-base text-left">Mueve los controles para ubicar tu orbe en el espacio 3D exacto.</p>
                <button @click="mostrarPopup = false" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all w-full">¡Comenzar!</button>
            </div>
        </div>
    </transition>

    <div class="instruccion bg-cyan-950/80 border border-cyan-400/50 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] text-center z-40 mt-4 mb-2 w-[85%] md:w-auto">
      <div class="flex justify-between items-center mb-1 border-b border-cyan-500/30 pb-1 gap-4">
        <span class="text-xs font-bold text-emerald-400">RONDA {{ rondaActual }}/{{ totalRondas }}</span>
        <span class="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">Ubica tu orbe:</span>
      </div>
      <p class="text-xl md:text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] font-mono whitespace-nowrap tracking-normal md:tracking-widest">
        (X: {{ objetivo.x }}, Y: {{ objetivo.y }}, Z: {{ objetivo.z }})
      </p>
    </div>

    <div class="espacio-cartesiano relative w-full flex-grow mt-4 md:mt-10">
      <div class="origen-cartesiano">
        <div class="origen-label">0</div>
        <div class="eje-x"><span class="etiqueta bg-emerald-900 border-emerald-400 text-emerald-300">X</span><div v-for="i in 5" :key="'x'+i" class="numero-eje" :style="{ left: `calc(var(--u) * ${i})`, top: '2px' }">{{ i }}</div></div>
        <div class="eje-y"><span class="etiqueta bg-blue-900 border-blue-400 text-blue-300">Y</span><div v-for="i in 5" :key="'y'+i" class="numero-eje" :style="{ bottom: `calc(var(--u) * ${i})`, left: '-12px' }">{{ i }}</div></div>
        <div class="eje-z"><span class="etiqueta bg-pink-900 border-pink-400 text-pink-300" style="transform: rotate(-135deg)">Z</span><div v-for="i in 5" :key="'z'+i" class="numero-eje" style="transform: rotate(-135deg);" :style="{ left: `calc(var(--u) * ${i})`, top: '2px' }">{{ i }}</div></div>
        <div class="pared-rejilla"></div>

        <div class="nodo-jugador" :class="estadoRespuesta" :style="{ '--nx': posX, '--ny': posY, '--nz': posZ }">
          <div class="nucleo"></div>
          <div class="linea-guia" :style="{ height: `calc(var(--ny) * var(--u))` }"></div>
        </div>
        <div v-if="waveActiva" class="onda-expansiva" :style="{ '--nx': objetivo.x, '--ny': objetivo.y, '--nz': objetivo.z }"></div>
      </div>
    </div>

    <div class="controles-grua w-[80%] md:w-[400px] bg-slate-900/80 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-cyan-500/50 flex flex-col gap-2 mb-10 md:mb-4 z-50 mr-12 md:mr-0">
      <div class="flex items-center gap-2"><span class="font-bold text-emerald-400 text-xs md:text-sm w-4">X:</span> <input type="range" min="0" max="5" v-model="posX" class="w-full h-1.5 md:h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer"> <span class="font-mono text-white text-xs w-2">{{ posX }}</span></div>
      <div class="flex items-center gap-2"><span class="font-bold text-blue-400 text-xs md:text-sm w-4">Y:</span> <input type="range" min="0" max="5" v-model="posY" class="w-full h-1.5 md:h-2 bg-blue-900 rounded-lg appearance-none cursor-pointer"> <span class="font-mono text-white text-xs w-2">{{ posY }}</span></div>
      <div class="flex items-center gap-2"><span class="font-bold text-pink-400 text-xs md:text-sm w-4">Z:</span> <input type="range" min="0" max="5" v-model="posZ" class="w-full h-1.5 md:h-2 bg-pink-900 rounded-lg appearance-none cursor-pointer"> <span class="font-mono text-white text-xs w-2">{{ posZ }}</span></div>
      
      <button @click="verificarCoordenada" class="mt-1 w-full py-1.5 md:py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm md:text-base rounded-lg border border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.4)] uppercase tracking-widest">Escanear</button>
    </div>
  </div>
</template>

<style scoped>
.reto-contenedor { --u: 22px; }
@media (min-width: 768px) { .reto-contenedor { --u: 50px; } }

.fade-popup-enter-active, .fade-popup-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-popup-enter-from, .fade-popup-leave-to { opacity: 0; transform: scale(0.95); }

.origen-cartesiano { position: absolute; top: 40%; left: 40%; }
@media (min-width: 768px) { .origen-cartesiano { top: 50%; left: 40%; } }
.origen-label { position: absolute; top: 2px; left: -12px; color: rgba(255,255,255,0.8); font-family: monospace; font-size: 10px; }
.numero-eje { position: absolute; color: rgba(255,255,255,0.7); font-family: monospace; font-size: 10px; font-weight: bold;}

.etiqueta { position: absolute; padding: 2px 4px; border-radius: 4px; font-size: 12px; font-family: monospace; font-weight: 900; border: 1px solid; display: flex; align-items: center; justify-content: center; }

.eje-x { position: absolute; top: 0; left: 0; width: calc(var(--u) * 5.5); height: 2px; background: #10b981; box-shadow: 0 0 10px #10b981; }
.eje-x .etiqueta { right: -20px; top: -10px; }

.eje-y { position: absolute; bottom: 0; left: 0; width: 2px; height: calc(var(--u) * 5.5); background: #3b82f6; box-shadow: 0 0 10px #3b82f6; }
.eje-y .etiqueta { top: -20px; left: -10px; }

.eje-z { position: absolute; top: 0; left: 0; width: calc(var(--u) * 5.5); height: 2px; background: #ec4899; box-shadow: 0 0 10px #ec4899; transform-origin: 0 0; transform: rotate(135deg); }
.eje-z .etiqueta { right: -20px; top: -10px; }

.pared-rejilla { position: absolute; bottom: 0; left: 0; width: calc(var(--u) * 5); height: calc(var(--u) * 5); background-image: repeating-linear-gradient(0deg, transparent, transparent calc(var(--u) - 1px), rgba(255, 255, 255, 0.15) calc(var(--u) - 1px), rgba(255, 255, 255, 0.15) var(--u)), repeating-linear-gradient(90deg, transparent, transparent calc(var(--u) - 1px), rgba(255, 255, 255, 0.15) calc(var(--u) - 1px), rgba(255, 255, 255, 0.15) var(--u)); z-index: -1; }

.nodo-jugador { position: absolute; left: calc(var(--nx) * var(--u) - var(--nz) * var(--u) * 0.7); top: calc(var(--ny) * var(--u) * -1 + var(--nz) * var(--u) * 0.7); z-index: 30; transition: all 0.3s ease-out; }
.nucleo { width: 16px; height: 16px; background: #a5f3fc; border-radius: 50%; box-shadow: 0 0 20px #a5f3fc; transform: translate(-50%, -50%); border: 2px solid white; }
@media (min-width: 768px) { .nucleo { width: 20px; height: 20px; } }

.linea-guia { position: absolute; width: 2px; background: repeating-linear-gradient(to bottom, transparent, transparent 4px, rgba(165,243,252,0.5) 4px, rgba(165,243,252,0.5) 8px); left: -1px; top: 0; }
.nodo-jugador.correcto .nucleo { background: #10b981; box-shadow: 0 0 30px #10b981; border-color: #10b981; }
.nodo-jugador.error .nucleo { background: #ef4444; box-shadow: 0 0 20px #ef4444; animation: sacudidaError 0.4s; }

.onda-expansiva { position: absolute; width: 10px; height: 10px; background: radial-gradient(circle, transparent 30%, rgba(16, 185, 129, 0.8) 70%); border-radius: 50%; animation: explotarOnda 1s ease-out forwards; pointer-events: none; z-index: 15; transform-origin: 0 0; left: calc(var(--nx) * var(--u) - var(--nz) * var(--u) * 0.7); top: calc(var(--ny) * var(--u) * -1 + var(--nz) * var(--u) * 0.7); }
@keyframes explotarOnda { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(20); opacity: 0; } }
@keyframes sacudidaError { 0%, 100% { transform: translate(-50%, -50%) translateX(0); } 25% { transform: translate(-50%, -50%) translateX(-4px); } 75% { transform: translate(-50%, -50%) translateX(4px); } }

input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: white; border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px rgba(255,255,255,0.8); }
</style>