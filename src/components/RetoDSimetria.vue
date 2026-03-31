<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['completado']);

const rondaActual = ref(1);
const totalRondas = 5;
const aciertos = ref(0);
const mostrarPopup = ref(false); 
const estadoRespuesta = ref(''); 

const celdasIzquierda = ref(new Array(10).fill(false));
const celdasDerecha = ref(new Array(10).fill(false));
const nombreFiguraActual = ref("");
const colorActual = ref("");

// 🎨 PALETA DE COLORES CUÁNTICOS
const temasColor = [
  { nombre: 'Esmeralda', hex: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
  { nombre: 'Rubí', hex: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
  { nombre: 'Zafiro', hex: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  { nombre: 'Amatista', hex: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  { nombre: 'Ámbar', hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
  { nombre: 'Turquesa', hex: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  { nombre: 'Oro', hex: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' }
];

const figurasMaster = [
  { nombre: "EL RAYO", celdas: [0, 2, 3, 5, 6, 8] },
  { nombre: "LA CRUZ", celdas: [1, 2, 3, 5, 7] },
  { nombre: "EL TRONO", celdas: [0, 2, 4, 6, 8, 9] },
  { nombre: "LA COLUMNA", celdas: [1, 3, 5, 7, 9] },
  { nombre: "EL DIAMANTE", celdas: [1, 2, 3, 4, 5, 7] },
  { nombre: "LA ESCALERA", celdas: [0, 2, 3, 5, 6, 7] },
  { nombre: "EL PUENTE", celdas: [0, 1, 4, 5, 8, 9] },
  { nombre: "LA TORRE", celdas: [1, 3, 5, 6, 7, 8, 9] },
  { nombre: "EL ESCUDO", celdas: [0, 1, 2, 3, 5, 7, 9] },
  { nombre: "LA FLECHA", celdas: [1, 2, 3, 5, 9] }
];

const generarRonda = () => {
  estadoRespuesta.value = '';
  celdasDerecha.value = new Array(10).fill(false);
  celdasIzquierda.value = new Array(10).fill(false);
  const colorObj = temasColor[Math.floor(Math.random() * temasColor.length)];
  colorActual.value = colorObj.hex;
  const figura = figurasMaster[Math.floor(Math.random() * figurasMaster.length)];
  nombreFiguraActual.value = figura.nombre;
  figura.celdas.forEach(idx => { celdasIzquierda.value[idx] = true; });
};

generarRonda();

const tocarCeldaDerecha = (index) => {
  if (estadoRespuesta.value === 'correcto') return;
  celdasDerecha.value[index] = !celdasDerecha.value[index];
  new Audio('/audios/switch.mp3').play().catch(() => {});
};

const verificarReflejo = () => {
  if (estadoRespuesta.value === 'correcto') return;
  let esCorrecto = true;
  for (let i = 0; i < 10; i++) {
    const fila = Math.floor(i / 2);
    const col = i % 2;
    const indiceReflejo = (fila * 2) + (1 - col); 
    if (celdasIzquierda.value[i] !== celdasDerecha.value[indiceReflejo]) {
      esCorrecto = false;
      break;
    }
  }
  if (esCorrecto) {
    estadoRespuesta.value = 'correcto';
    aciertos.value++;
    new Audio('/audios/ding.mp3').play().catch(()=>{});
    setTimeout(() => {
      if (rondaActual.value < totalRondas) {
        rondaActual.value++;
        generarRonda();
      } else {
        emit('completado', aciertos.value);
        setTimeout(() => {
          rondaActual.value = 1; aciertos.value = 0; generarRonda();
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
  <div class="reto-contenedor w-full h-full flex flex-col items-center justify-start pt-28 md:pt-32 relative overflow-hidden">
    
    <div class="absolute top-[42px] md:top-[70px] left-1/2 -translate-x-1/2 z-[100] whitespace-nowrap">
        <div class="bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 rounded-lg px-3 py-1 flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <span class="text-[10px] md:text-xs text-cyan-200 font-bold uppercase tracking-widest">Premio:</span>
            <img src="/images/coin-silver.png" class="w-4 h-4 object-contain" />
            <span class="text-emerald-400 font-black text-sm">2</span>
        </div>
    </div>

    <button id="btn-abrir-reglas-3" @click="mostrarPopup = true" class="hidden"></button>

    <transition name="fade-popup">
        <div v-if="mostrarPopup" class="absolute inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div class="bg-cyan-950/90 border border-cyan-400 p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] max-w-sm text-center">
                <h2 class="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-widest">El Espejo</h2>
                <p class="text-cyan-100 mb-6 text-sm md:text-base text-left">El láser central divide el espacio. Toca las casillas de la derecha para crear un reflejo (simetría) exacto del patrón de la izquierda.</p>
                <button @click="mostrarPopup = false" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all w-full">¡Comenzar!</button>
            </div>
        </div>
    </transition>

    <div class="instruccion mt-4 bg-cyan-950/60 border border-cyan-400/50 backdrop-blur-md px-4 py-2 md:py-3 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] text-center z-40 mx-4 w-[90%] md:w-auto">
      <div class="flex justify-between items-center mb-1 border-b border-cyan-500/30 pb-1 gap-4">
        <span class="text-[10px] font-bold text-emerald-400">RONDA {{ rondaActual }}/{{ totalRondas }}</span>
        <span class="text-[9px] font-semibold text-cyan-200 uppercase tracking-widest">Simetría Axial</span>
      </div>
      <p class="text-[9px] font-black text-cyan-400 tracking-[0.1em] mb-0.5 uppercase">PROYECTANDO: {{ nombreFiguraActual }}</p>
      <p class="text-sm md:text-lg font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase">Dibuja el Reflejo</p>
    </div>

    <div class="espejo-area flex items-center justify-center mt-4 md:mt-6 gap-1 md:gap-2" :class="estadoRespuesta">
      <div class="grid-espejo">
        <div v-for="(celda, index) in celdasIzquierda" :key="'izq'+index" 
             class="celda-cristal celda-sistema" :class="{ 'activa': celda }"
             :style="{ '--color-main': colorActual }">
             <div class="cara-frontal"></div>
             <div class="brillo-interno"></div>
        </div>
      </div>

      <div class="laser-central" :style="{ boxShadow: `0 0 15px ${colorActual}` }"></div>

      <div class="grid-espejo">
        <div v-for="(celda, index) in celdasDerecha" :key="'der'+index" 
             @click="tocarCeldaDerecha(index)"
             class="celda-cristal celda-jugador" :class="{ 'activa': celda }"
             :style="{ '--color-main': colorActual }">
             <div class="cara-frontal"></div>
             <div class="brillo-interno"></div>
        </div>
      </div>
    </div>

    <button @click="verificarReflejo" 
            class="mt-4 md:mt-8 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm md:text-lg rounded-xl border-2 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95 transition-all tracking-widest uppercase z-40">
      Escanear Reflejo
    </button>

  </div>
</template>

<style scoped>
.fade-popup-enter-active, .fade-popup-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-popup-enter-from, .fade-popup-leave-to { opacity: 0; transform: scale(0.95); }

.espejo-area { position: relative; padding: 12px; background: rgba(2, 6, 23, 0.8); border-radius: 20px; border: 1px solid rgba(34, 211, 238, 0.2); box-shadow: inset 0 0 40px rgba(0,0,0,0.9); transition: all 0.3s; }
.espejo-area.correcto { border-color: #10b981; box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
.espejo-area.error { border-color: #ef4444; animation: shakeError 0.4s both; }

.laser-central { width: 3px; height: 100%; min-height: 180px; background: #fff; border-radius: 4px; box-shadow: 0 0 8px #fff; margin: 0 4px; }
@media (min-width: 768px) { .laser-central { min-height: 280px; margin: 0 15px; width: 5px; } }

.grid-espejo { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
@media (min-width: 768px) { .grid-espejo { gap: 10px; } }

.celda-cristal { width: 38px; height: 38px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; position: relative; transition: all 0.2s; perspective: 400px; }
@media (min-width: 768px) { .celda-cristal { width: 52px; height: 52px; border-radius: 10px; } }

.celda-cristal.activa { background: var(--color-main); box-shadow: 0 4px 10px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.5), 0 0 15px var(--color-main); transform: translateZ(8px) translateY(-1px); }
.celda-cristal.activa .cara-frontal { border: 2px solid rgba(255, 255, 255, 0.5); position: absolute; inset: 0; border-radius: inherit; }
.celda-jugador { cursor: pointer; }
.brillo-interno { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%); transform: rotate(45deg) translate(-100%, -100%); pointer-events: none; }
.celda-cristal.activa .brillo-interno { animation: brillarCristal 3s infinite; }

@keyframes brillarCristal { 0% { transform: rotate(45deg) translate(-100%, -100%); } 100% { transform: rotate(45deg) translate(100%, 100%); } }
@keyframes shakeError { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
</style>