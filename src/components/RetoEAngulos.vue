<script setup>
import { ref } from 'vue';

const emit = defineEmits(['completado']);

const rondaActual = ref(1);
const totalRondas = 5;
const aciertos = ref(0);
const mostrarPopup = ref(false); 
const estadoRespuesta = ref(''); 
const isShooting = ref(false);

// Ángulos de 45 en 45 grados
const angulosDisponibles = [0, 45, 90, 135, 180, 225, 270, 315];
const anguloObjetivo = ref(0);
const anguloActual = ref(0);

const generarRonda = () => {
  isShooting.value = false;
  estadoRespuesta.value = '';
  
  const indexObjetivo = Math.floor(Math.random() * angulosDisponibles.length);
  anguloObjetivo.value = angulosDisponibles[indexObjetivo];
  
  let indexInicio;
  do {
    indexInicio = Math.floor(Math.random() * angulosDisponibles.length);
  } while (indexInicio === indexObjetivo);
  
  anguloActual.value = angulosDisponibles[indexInicio];
};

generarRonda();

const rotarPrisma = (grados) => {
  if (isShooting.value || estadoRespuesta.value === 'correcto') return;
  
  anguloActual.value = (anguloActual.value + grados + 360) % 360;
  
  const audioClic = new Audio('/audios/switch.mp3'); 
  audioClic.play().catch(() => {});
};

const dispararLaser = () => {
  if (isShooting.value || estadoRespuesta.value === 'correcto') return;
  
  isShooting.value = true;
  const audioLaser = new Audio('/audios/switch.mp3'); 
  audioLaser.play().catch(()=>{});

  setTimeout(() => {
    if (anguloActual.value === anguloObjetivo.value) {
      estadoRespuesta.value = 'correcto';
      aciertos.value++;
      
      const audioWin = new Audio('/audios/ding.mp3'); 
      audioWin.play().catch(()=>{});

      setTimeout(() => {
        if (rondaActual.value < totalRondas) {
          rondaActual.value++;
          generarRonda();
        } else {
          emit('completado', aciertos.value);
          
          // 🛠️ FIX: Auto-Reset silencioso para carrusel infinito
          setTimeout(() => {
            rondaActual.value = 1;
            aciertos.value = 0;
            generarRonda();
          }, 1500);
        }
      }, 1500);
    } else {
      estadoRespuesta.value = 'error';
      const audioError = new Audio('/audios/lightning.mp3'); 
      audioError.play().catch(()=>{});
      
      setTimeout(() => { 
        estadoRespuesta.value = ''; 
        isShooting.value = false;
      }, 1000);
    }
  }, 400);
};
</script>

<template>
  <div class="reto-contenedor w-full h-full flex flex-col items-center justify-start pt-14 md:pt-20 relative">
    
    <div class="absolute top-[18px] md:top-[45px] left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 rounded-lg px-3 py-1 flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] z-50 whitespace-nowrap">
      <span class="text-[10px] md:text-xs text-cyan-200 font-bold uppercase tracking-widest">Premio:</span>
      <img src="/images/coin-silver.png" class="w-4 h-4 object-contain" />
      <span class="text-emerald-400 font-black text-sm">2</span>
    </div>

    <button id="btn-abrir-reglas-4" @click="mostrarPopup = true" class="hidden"></button>

    <transition name="fade-popup">
        <div v-if="mostrarPopup" class="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div class="bg-cyan-950/90 border border-cyan-400 p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] max-w-sm text-center">
                <h2 class="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-widest">Prisma Óptico</h2>
                <p class="text-cyan-100 mb-6 text-sm md:text-base text-left">Gira el prisma central para apuntar a los grados exactos. Cuando la línea guía coincida con la Gema de Energía, ¡dispara el láser!</p>
                <button @click="mostrarPopup = false" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all w-full">¡Comenzar!</button>
            </div>
        </div>
    </transition>

    <div class="instruccion bg-cyan-950/60 border border-cyan-400/50 backdrop-blur-md px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] text-center z-40 mx-4 w-[85%] md:w-auto">
      <div class="flex justify-between items-center mb-1 border-b border-cyan-500/30 pb-1 gap-4">
        <span class="text-xs font-bold text-emerald-400">RONDA {{ rondaActual }}/{{ totalRondas }}</span>
        <span class="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">Ángulos</span>
      </div>
      <p class="text-lg md:text-xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase tracking-widest">
        Apunta a la Gema
      </p>
    </div>

    <div class="radar-arena mt-2 md:mt-3" :class="estadoRespuesta">
      
      <div v-for="a in angulosDisponibles" :key="'label'+a" class="etiqueta-grado"
           :style="{ '--rot': `${a}deg` }">
        {{ a }}°
      </div>

      <div class="anillo-exterior"></div>
      <div class="anillo-interior"></div>
      
      <div class="prisma-central">
        <div class="nucleo-prisma"></div>
      </div>

      <div class="gema-objetivo" :class="{ 'gema-cargada': estadoRespuesta === 'correcto' }"
           :style="{ transform: `rotate(${anguloObjetivo}deg) translateY(-110px) rotate(-${anguloObjetivo}deg)` }">
        <span class="text-[10px] md:text-xs font-bold text-emerald-100 z-10 block" :style="{ transform: `rotate(${anguloObjetivo}deg)` }">{{ anguloObjetivo }}°</span>
        <div class="gema-brillo"></div>
      </div>

      <div class="canon-rotatorio" :style="{ transform: `rotate(${anguloActual}deg)` }">
        <div class="linea-guia"></div>
        <div class="rayo-laser" :class="{ 'disparando': isShooting, 'laser-correcto': estadoRespuesta === 'correcto', 'laser-error': estadoRespuesta === 'error' }"></div>
      </div>
    </div>

    <div class="controles-angulos mt-8 md:mt-4 z-40 flex flex-col items-center gap-3 md:gap-4 w-[90%] max-w-sm">
      
      <div class="bg-slate-900 border-2 border-cyan-500 rounded-lg px-6 py-1 md:py-2 shadow-[inset_0_0_10px_rgba(34,211,238,0.4)]">
        <span class="font-mono text-2xl md:text-3xl font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
          {{ anguloActual }}°
        </span>
      </div>

      <div class="flex gap-4 w-full">
        <button @click="rotarPrisma(-45)" :disabled="isShooting || estadoRespuesta === 'correcto'" 
                class="flex-1 py-2 md:py-3 bg-cyan-900 hover:bg-cyan-800 text-cyan-100 font-black rounded-xl border-2 border-cyan-600 shadow-md active:scale-95 transition-all disabled:opacity-50">
          - 45°
        </button>
        <button @click="rotarPrisma(45)" :disabled="isShooting || estadoRespuesta === 'correcto'" 
                class="flex-1 py-2 md:py-3 bg-cyan-900 hover:bg-cyan-800 text-cyan-100 font-black rounded-xl border-2 border-cyan-600 shadow-md active:scale-95 transition-all disabled:opacity-50">
          + 45°
        </button>
      </div>

      <button @click="dispararLaser" :disabled="isShooting || estadoRespuesta === 'correcto'" 
              class="w-full px-8 py-2 md:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base md:text-xl rounded-xl border-2 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 transition-all tracking-widest uppercase disabled:opacity-50 disabled:grayscale">
        Disparar Láser
      </button>

    </div>

  </div>
</template>

<style scoped>
.fade-popup-enter-active, .fade-popup-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-popup-enter-from, .fade-popup-leave-to { opacity: 0; transform: scale(0.95); }

/* RADAR ARENA */
.radar-arena {
  position: relative;
  width: 250px;
  height: 250px;
  aspect-ratio: 1 / 1; 
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.2) 100%);
}
@media (min-width: 768px) {
  .radar-arena { width: 300px; height: 300px; }
}

.radar-arena.error { animation: shakeError 0.4s cubic-bezier(.36,.07,.19,.97) both; }

/* CÍRCULOS DE FONDO */
.anillo-exterior { position: absolute; inset: 0; border: 2px dashed rgba(34, 211, 238, 0.3); border-radius: 50%; animation: spin 20s linear infinite; }
.anillo-interior { position: absolute; inset: 40px; border: 1px solid rgba(34, 211, 238, 0.1); border-radius: 50%; }

/* PRISMA CENTRAL */
.prisma-central {
  position: absolute;
  width: 35px; height: 35px;
  background: rgba(255,255,255,0.1);
  border: 2px solid #22d3ee;
  transform: rotate(45deg); 
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 15px rgba(34,211,238,0.5), inset 0 0 10px rgba(34,211,238,0.5);
  z-index: 20;
}
@media (min-width: 768px) { .prisma-central { width: 40px; height: 40px; } }
.nucleo-prisma { width: 14px; height: 14px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #fff; }

/* 🛠️ ETIQUETAS DE GRADOS (COLOR BLANCO Y ROTACIÓN ARREGLADA) */
.etiqueta-grado {
  position: absolute;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  font-weight: 900;
  color: #ffffff; /* BLANCO */
  text-shadow: 0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(34,211,238,0.8);
  backface-visibility: hidden;
  z-index: 5;
  transform: rotate(var(--rot)) translateY(-145px) rotate(calc(var(--rot) * -1));
}
@media (min-width: 768px) {
  .etiqueta-grado { 
    font-size: 14px; 
    transform: rotate(var(--rot)) translateY(-165px) rotate(calc(var(--rot) * -1));
  }
}

/* LA GEMA OBJETIVO */
.gema-objetivo {
  position: absolute;
  width: 32px; height: 32px; 
  background: rgba(16, 185, 129, 0.2);
  border: 2px solid #10b981;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); 
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
  z-index: 15;
}
@media (min-width: 768px) { .gema-objetivo { width: 40px; height: 40px; } }

.gema-brillo { position: absolute; width: 50%; height: 50%; background: #fff; opacity: 0.3; clip-path: inherit; }

/* GEMA CUANDO ACIERTA */
.gema-cargada {
  background: #10b981;
  box-shadow: 0 0 30px #10b981, 0 0 50px #10b981;
  border-color: #fff;
  transform: scale(1.3) !important; 
}
.gema-cargada .gema-brillo { opacity: 1; }

/* CAÑÓN Y LÁSER */
.canon-rotatorio {
  position: absolute;
  width: 4px;
  height: 110px;
  bottom: 50%; 
  transform-origin: bottom center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}
@media (min-width: 768px) { .canon-rotatorio { height: 140px; } }

.linea-guia {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 100%;
  background: repeating-linear-gradient(to top, transparent, transparent 4px, rgba(34, 211, 238, 0.3) 4px, rgba(34, 211, 238, 0.3) 8px);
}

.rayo-laser {
  position: absolute;
  bottom: 0; left: -2px;
  width: 8px; height: 0; 
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 0 10px #22d3ee, 0 0 20px #22d3ee;
  transition: height 0.2s ease-out;
}

.rayo-laser.disparando { height: 100%; }
.rayo-laser.laser-correcto { box-shadow: 0 0 15px #10b981, 0 0 30px #10b981; }
.rayo-laser.laser-error { background: #fca5a5; box-shadow: 0 0 15px #ef4444, 0 0 30px #ef4444; }

@keyframes spin { 100% { transform: rotate(360deg); } }

@keyframes shakeError {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
  40%, 60% { transform: translate3d(8px, 0, 0); }
}
</style>