<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['completado']);

const rondaActual = ref(1);
const totalRondas = 5;
const aciertos = ref(0);
const retoCompletadoRonda = ref(false);
const mostrarPopup = ref(true);

// Coordenadas locales para los vértices (1 es = R)
const figuras = [
  { nombre: 'CUBO', puntos: [[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1]] },
  { nombre: 'PIRÁMIDE', puntos: [[0,1.5,0], [1,-1,1],[1,-1,-1],[-1,-1,1],[-1,-1,-1]] },
  { nombre: 'PRISMA', puntos: [[0,1,1],[0,1,-1], [1,-1,1],[1,-1,-1], [-1,-1,1],[-1,-1,-1]] }
];

const figuraActual = ref(figuras[0]);
const verticesEstado = ref([]); 

const generarRonda = () => {
  retoCompletadoRonda.value = false;
  figuraActual.value = figuras[Math.floor(Math.random() * figuras.length)];
  verticesEstado.value = new Array(figuraActual.value.puntos.length).fill(false);
};

generarRonda();

const verticesEncontrados = computed(() => verticesEstado.value.filter(v => v).length);

const tocarVertice = (index) => {
  if (verticesEstado.value[index] || retoCompletadoRonda.value) return;
  verticesEstado.value[index] = true;
  const audioClic = new Audio('/audios/switch.mp3'); audioClic.play().catch(() => {});

  if (verticesEncontrados.value === figuraActual.value.puntos.length) {
    retoCompletadoRonda.value = true;
    aciertos.value++;
    const audioUnlock = new Audio('/audios/ding.mp3'); audioUnlock.play().catch(() => {});
    setTimeout(() => {
      if (rondaActual.value < totalRondas) {
        rondaActual.value++; generarRonda();
      } else {
        emit('completado', aciertos.value);
      }
    }, 1500);
  }
};
</script>

<template>
  <div class="reto-contenedor w-full h-full flex flex-col items-center justify-start pt-4 md:pt-12 relative">
    
    <button id="btn-abrir-reglas-1" @click="mostrarPopup = true" class="hidden"></button>

    <transition name="fade-popup">
        <div v-if="mostrarPopup" class="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div class="bg-cyan-950/90 border border-cyan-400 p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] max-w-sm text-center">
                <h2 class="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-widest">El Arquitecto</h2>
                <p class="text-cyan-100 mb-6 text-sm md:text-base text-left">Haz clic en todos los vértices (esquinas) brillantes de la figura holográfica antes de que cambie de forma.</p>
                <button @click="mostrarPopup = false" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all w-full">¡Comenzar!</button>
            </div>
        </div>
    </transition>

    <div class="instruccion bg-cyan-950/60 border border-cyan-400/50 backdrop-blur-md px-6 py-2 md:py-4 rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)] text-center z-40 mt-1 md:mt-0 mx-4 md:mx-0 w-[85%] md:w-auto">
      <div class="flex justify-between items-center mb-1 border-b border-cyan-500/30 pb-1 gap-4">
        <span class="text-xs font-bold text-emerald-400">RONDA {{ rondaActual }}/{{ totalRondas }}</span>
        <span class="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">El Arquitecto</span>
      </div>
      <p class="text-lg md:text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase">
        Encuentra los <span class="text-emerald-400">{{ figuraActual.puntos.length }}</span> Vértices del <br>{{ figuraActual.nombre }}
      </p>
      <div class="mt-2 flex items-center justify-center gap-3">
        <div class="px-6 py-1 bg-slate-900/80 border border-emerald-400/50 rounded-full font-mono text-emerald-400 font-bold text-xl md:text-2xl shadow-[inset_0_0_10px_rgba(16,185,129,0.3)]">
          {{ verticesEncontrados }} / {{ figuraActual.puntos.length }}
        </div>
      </div>
    </div>

    <div class="espacio-3d mt-10 md:mt-24">
      <div class="figura-holografica" :class="{ 'brillo-victoria': retoCompletadoRonda }">
        
        <template v-if="figuraActual.nombre === 'CUBO'">
            <div class="cara-fantasma frontal"></div><div class="cara-fantasma trasera"></div>
            <div class="cara-fantasma derecha"></div><div class="cara-fantasma izquierda"></div>
            <div class="cara-fantasma arriba"></div><div class="cara-fantasma abajo"></div>
        </template>

        <template v-if="figuraActual.nombre === 'PIRÁMIDE'">
            <div class="cara-fantasma base-piramide"></div>
            <div class="cara-fantasma tri tri-frente"></div>
            <div class="cara-fantasma tri tri-atras"></div>
            <div class="cara-fantasma tri tri-izq"></div>
            <div class="cara-fantasma tri tri-der"></div>
        </template>

        <template v-if="figuraActual.nombre === 'PRISMA'">
            <div class="cara-fantasma base-piramide"></div> <div class="cara-fantasma tri tri-prisma-frente"></div>
            <div class="cara-fantasma tri tri-prisma-atras"></div>
            <div class="cara-fantasma rect-prisma-izq"></div>
            <div class="cara-fantasma rect-prisma-der"></div>
        </template>

        <button v-for="(pto, index) in figuraActual.puntos" :key="index" class="vertice" :class="{ 'activo': verticesEstado[index] }" 
          :style="{ transform: `translate3d(calc(${pto[0]} * var(--r)), calc(${pto[1]} * var(--r) * -1), calc(${pto[2]} * var(--r)))` }"
          @click="tocarVertice(index)">
        </button>

      </div>
    </div>

  </div>
</template>

<style scoped>
.reto-contenedor { perspective: 1200px; --tamano-cubo: 120px; --r: calc(var(--tamano-cubo) / 2); }
@media (min-width: 768px) { .reto-contenedor { --tamano-cubo: 180px; } }

.fade-popup-enter-active, .fade-popup-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-popup-enter-from, .fade-popup-leave-to { opacity: 0; transform: scale(0.95); }

.espacio-3d { position: relative; width: var(--tamano-cubo); height: var(--tamano-cubo); margin-right: 20px; }

.figura-holografica { width: 100%; height: 100%; position: absolute; transform-style: preserve-3d; animation: girarCubo 15s infinite linear; }
.brillo-victoria { animation: girarCubo 15s infinite linear, destelloVictoria 1s ease-out forwards; }

.cara-fantasma { position: absolute; width: var(--tamano-cubo); height: var(--tamano-cubo); background: rgba(34, 211, 238, 0.05); border: 1px solid rgba(34, 211, 238, 0.3); backdrop-filter: blur(2px); pointer-events: none; }

/* Caras del Cubo */
.frontal   { transform: rotateY(  0deg) translateZ(var(--r)); }
.derecha   { transform: rotateY( 90deg) translateZ(var(--r)); }
.trasera   { transform: rotateY(180deg) translateZ(var(--r)); }
.izquierda { transform: rotateY(-90deg) translateZ(var(--r)); }
.arriba    { transform: rotateX( 90deg) translateZ(var(--r)); }
.abajo     { transform: rotateX(-90deg) translateZ(var(--r)); }

/* Caras Pirámide & Prisma */
.base-piramide { transform: rotateX(90deg) translateZ(var(--r)); }
.tri { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); height: calc(var(--tamano-cubo) * 1.25); top: calc(var(--tamano-cubo) * -0.25); }
/* Inclinamos las caras para que se junten arriba */
.tri-frente { transform: rotateY(0deg) translateZ(var(--r)) rotateX(25deg); transform-origin: bottom; }
.tri-atras { transform: rotateY(180deg) translateZ(var(--r)) rotateX(25deg); transform-origin: bottom; }
.tri-izq { transform: rotateY(-90deg) translateZ(var(--r)) rotateX(25deg); transform-origin: bottom; }
.tri-der { transform: rotateY(90deg) translateZ(var(--r)) rotateX(25deg); transform-origin: bottom; }

/* Prisma: Triángulos rectos, caras inclinadas */
.tri-prisma-frente { transform: rotateY(0deg) translateZ(var(--r)); }
.tri-prisma-atras { transform: rotateY(180deg) translateZ(var(--r)); }
.rect-prisma-izq { height: calc(var(--tamano-cubo) * 1.25); top: calc(var(--tamano-cubo) * -0.25); transform: rotateY(-90deg) translateZ(var(--r)) rotateX(25deg); transform-origin: bottom; }
.rect-prisma-der { height: calc(var(--tamano-cubo) * 1.25); top: calc(var(--tamano-cubo) * -0.25); transform: rotateY(90deg) translateZ(var(--r)) rotateX(25deg); transform-origin: bottom; }


/* VÉRTICES */
.vertice { position: absolute; top: 50%; left: 50%; width: 28px; height: 28px; margin: -14px 0 0 -14px; background: rgba(255, 255, 255, 0.4); border: 2px solid #fff; border-radius: 50%; transform-style: preserve-3d; cursor: pointer; transition: all 0.3s ease; z-index: 20; }
@media (min-width: 768px) { .vertice { width: 36px; height: 36px; margin: -18px 0 0 -18px; } }
.vertice:hover { background: #a5f3fc; box-shadow: 0 0 20px #a5f3fc; filter: brightness(1.5); }
.vertice.activo { background: #10b981; border-color: #10b981; box-shadow: 0 0 20px #10b981, 0 0 40px #10b981; }

@keyframes girarCubo { 0% { transform: rotateX(-20deg) rotateY(0deg) rotateZ(0deg); } 100% { transform: rotateX(-20deg) rotateY(360deg) rotateZ(360deg); } }
@keyframes destelloVictoria { 0% { filter: brightness(1); } 50% { filter: brightness(3) drop-shadow(0 0 100px #fff); } 100% { filter: brightness(1); } }
</style>