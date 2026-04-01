<script setup>
import { ref } from 'vue';

const emit = defineEmits(['completado']);

const rondaActual = ref(1);
const totalRondas = 5;
const aciertos = ref(0);
const mostrarPopup = ref(false); 
const estadoRespuesta = ref(''); 

const figurasCatálogo = [
  { id: 'cubo', nombre: 'CUBO', sombra: 'sombra-cuadrado', clase3D: 'cristal-cubo' },
  { id: 'esfera', nombre: 'ESFERA', sombra: 'sombra-circulo', clase3D: 'cristal-esfera' },
  { id: 'piramide', nombre: 'PIRÁMIDE', sombra: 'sombra-triangulo', clase3D: 'cristal-piramide' },
  { id: 'cilindro', nombre: 'CILINDRO', sombra: 'sombra-rectangulo', clase3D: 'cristal-cilindro' },
  { id: 'diamante', nombre: 'DIAMANTE', sombra: 'sombra-rombo', clase3D: 'cristal-diamante' },
  { id: 'octaedro', nombre: 'OCTAEDRO', sombra: 'sombra-diamante-largo', clase3D: 'cristal-octaedro' },
  { id: 'cono', nombre: 'CONO', sombra: 'sombra-triangulo', clase3D: 'cristal-cono' },
  { id: 'capsula', nombre: 'CÁPSULA', sombra: 'sombra-capsula', clase3D: 'cristal-capsula' },
  { id: 'pentagono', nombre: 'PRISMA PENTA', sombra: 'sombra-penta', clase3D: 'cristal-penta' },
  { id: 'estrella', nombre: 'ESTRELLA', sombra: 'sombra-estrella', clase3D: 'cristal-estrella' }
];

const sombraObjetivo = ref('');
const opcionesEscenario = ref([]);
const indexSeleccionado = ref(null);

const generarRonda = () => {
  estadoRespuesta.value = '';
  indexSeleccionado.value = null;

  const indexCorrecto = Math.floor(Math.random() * figurasCatálogo.length);
  const figuraCorrecta = figurasCatálogo[indexCorrecto];
  sombraObjetivo.value = figuraCorrecta.sombra;

  let distractores = figurasCatálogo.filter(f => f.id !== figuraCorrecta.id);
  distractores = distractores.sort(() => 0.5 - Math.random()).slice(0, 2);

  let opciones = [figuraCorrecta, ...distractores];
  opcionesEscenario.value = opciones.sort(() => 0.5 - Math.random());
};

generarRonda();

const verificarProyeccion = (figura, index) => {
  if (estadoRespuesta.value === 'correcto') return;
  indexSeleccionado.value = index;

  if (figura.sombra === sombraObjetivo.value) {
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
    setTimeout(() => { estadoRespuesta.value = ''; indexSeleccionado.value = null; }, 800);
  }
};
</script>

<template>
  <div class="reto-contenedor w-full h-full flex flex-col items-center justify-start pt-20 md:pt-28 relative">
    
    <div class="absolute top-[28px] md:top-[55px] left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 rounded-lg px-3 py-1 flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] z-50 whitespace-nowrap">
      <span class="text-[10px] md:text-xs text-cyan-200 font-bold uppercase tracking-widest">Premio:</span>
      <img src="/images/coin-silver.png" class="w-4 h-4 object-contain" />
      <span class="text-emerald-400 font-black text-sm">2</span>
    </div>

    <button id="btn-abrir-reglas-6" @click="mostrarPopup = true" class="hidden"></button>

    <transition name="fade-popup">
        <div v-if="mostrarPopup" class="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div class="bg-cyan-950/90 border border-cyan-400 p-6 md:p-8 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] max-w-sm text-center">
                <h2 class="text-xl md:text-2xl font-bold text-white mb-4 uppercase tracking-widest">El Origen 3D</h2>
                <p class="text-cyan-100 mb-6 text-sm md:text-base text-left">Observa la silueta proyectada en el sensor 2D. Debes identificar cuál de los tres cristales holográficos genera exactamente esa sombra.</p>
                <button @click="mostrarPopup = false" class="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all w-full">¡Comenzar!</button>
            </div>
        </div>
    </transition>

    <div class="instruccion bg-cyan-950/60 border border-cyan-400/50 backdrop-blur-md px-6 py-2 md:py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] text-center z-40 mx-4 w-[85%] md:w-auto">
      <div class="flex justify-between items-center mb-1 border-b border-cyan-500/30 pb-1 gap-4">
        <span class="text-xs font-bold text-emerald-400">RONDA {{ rondaActual }}/{{ totalRondas }}</span>
        <span class="text-[10px] font-semibold text-cyan-200 uppercase tracking-widest">Identificación Espacial</span>
      </div>
      <p class="text-lg md:text-xl font-black text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase tracking-widest">Encuentra el Origen 3D</p>
    </div>

    <div class="escenario-sombras mt-8 md:mt-10 w-full flex flex-col items-center">
      
      <div class="pared-proyeccion mb-8 md:mb-12" :class="estadoRespuesta">
         <div class="sombra-oscura" :class="[sombraObjetivo, { 'brillo-correcto': estadoRespuesta === 'correcto' }]"></div>
      </div>

      <div class="flex justify-center items-end gap-4 md:gap-14 w-full z-20 px-2">
         <div v-for="(opcion, index) in opcionesEscenario" :key="'opcion'+index"
              @click="verificarProyeccion(opcion, index)"
              class="pedestal cursor-pointer group"
              :class="{ 
                'opcion-seleccionada': indexSeleccionado === index && estadoRespuesta === 'correcto',
                'opcion-error': indexSeleccionado === index && estadoRespuesta === 'error'
              }">
            
            <div class="contenedor-figura group-hover:scale-110 transition-transform duration-300">
               <div :class="opcion.clase3D"></div>
            </div>

            <div class="base-energia"></div>
            
            <div class="etiqueta-nombre mt-4">
              <span class="text-[9px] md:text-[11px] font-black tracking-tighter">{{ opcion.nombre }}</span>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-popup-enter-active, .fade-popup-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-popup-enter-from, .fade-popup-leave-to { opacity: 0; transform: scale(0.95); }

/* --- ESCENARIO --- */
.pared-proyeccion {
  width: 160px; height: 110px; background: rgba(2, 6, 23, 0.4); border: 2px solid rgba(34, 211, 238, 0.3);
  border-radius: 15px; display: flex; align-items: center; justify-content: center; position: relative; transition: all 0.3s;
}
@media (min-width: 768px) { .pared-proyeccion { width: 200px; height: 140px; } }
.pared-proyeccion::before { content: 'SENSOR 2D'; position: absolute; top: -12px; background: #082f49; color: #38bdf8; font-size: 8px; font-weight: 900; padding: 2px 10px; border-radius: 10px; border: 1px solid #38bdf8; }
.pared-proyeccion.correcto { border-color: #10b981; box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }

/* --- SOMBRAS --- */
.sombra-oscura { background: rgba(0, 0, 0, 0.85); transition: all 0.3s; filter: blur(1px); }
.brillo-correcto { background: #10b981 !important; box-shadow: 0 0 30px #10b981 !important; border-bottom-color: #10b981 !important; }

.sombra-cuadrado { width: 50px; height: 50px; }
.sombra-circulo { width: 55px; height: 55px; border-radius: 50%; }
.sombra-triangulo { width: 0; height: 0; background: transparent; border-left: 30px solid transparent; border-right: 30px solid transparent; border-bottom: 55px solid rgba(0, 0, 0, 0.85); }
.sombra-rectangulo { width: 40px; height: 70px; border-radius: 4px; }
.sombra-rombo { width: 50px; height: 50px; transform: rotate(45deg); }
.sombra-diamante-largo { width: 35px; height: 65px; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
.sombra-capsula { width: 35px; height: 70px; border-radius: 50px; }
.sombra-penta { width: 60px; height: 60px; clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); }
.sombra-estrella { width: 60px; height: 60px; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }

/* --- GEOMETRÍA 2.5D CSS 100% --- */
.pedestal { position: relative; width: 100px; display: flex; flex-direction: column; align-items: center; }
.contenedor-figura { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; animation: flotar 3s infinite ease-in-out; transform-style: preserve-3d; }

/* 1. Cubo */
.cristal-cubo { width: 40px; height: 40px; background: #22d3ee; position: relative; transform: rotateX(-20deg) rotateY(25deg); box-shadow: inset -10px -10px 20px rgba(0,0,0,0.2); }
.cristal-cubo::before { content:''; position:absolute; top:-15px; left:0; width:40px; height:15px; background:#a5f3fc; transform: skewX(-45deg); transform-origin: bottom; }
.cristal-cubo::after { content:''; position:absolute; top:0; right:-15px; width:15px; height:40px; background:#0891b2; transform: skewY(-45deg); transform-origin: left; }

/* 2. Esfera */
.cristal-esfera { width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff 0%, #22d3ee 40%, #082f49 100%); border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 10px 20px rgba(0,0,0,0.4); }

/* 3. Piramide */
.cristal-piramide { width: 0; height: 0; border-left: 25px solid transparent; border-right: 25px solid transparent; border-bottom: 50px solid #22d3ee; position: relative; }
.cristal-piramide::after { content: ''; position: absolute; top: 0; left: -25px; border-left: 25px solid transparent; border-right: 0px solid transparent; border-bottom: 50px solid rgba(0,0,0,0.2); }

/* 4. Cilindro */
.cristal-cilindro { width: 35px; height: 55px; background: linear-gradient(90deg, #0e7490, #22d3ee 50%, #0e7490); border-radius: 0 0 5px 5px; position: relative; }
.cristal-cilindro::before { content:''; position:absolute; top:-8px; left:0; width:100%; height:16px; background:#a5f3fc; border-radius:50%; border: 1px solid #22d3ee; }

/* 5. Diamante */
.cristal-diamante { width: 45px; height: 45px; background: #22d3ee; transform: rotate(45deg); position: relative; box-shadow: inset 5px 5px 15px #fff, inset -5px -5px 15px rgba(0,0,0,0.3); border: 1px solid #fff; }

/* 6. Octaedro */
.cristal-octaedro { width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-bottom: 35px solid #22d3ee; position: relative; }
.cristal-octaedro::after { content: ''; position: absolute; top: 35px; left: -20px; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 35px solid #0e7490; }

/* 7. Cono */
.cristal-cono { width: 0; height: 0; border-left: 25px solid transparent; border-right: 25px solid transparent; border-bottom: 55px solid #22d3ee; position: relative; border-radius: 50%; }
.cristal-cono::before { content:''; position:absolute; bottom:-60px; left:-25px; width:50px; height:12px; background:#086e89; border-radius:50%; }

/* 8. Cápsula */
.cristal-capsula { width: 30px; height: 55px; background: linear-gradient(90deg, #0e7490, #22d3ee 50%, #0e7490); border-radius: 20px; position: relative; box-shadow: inset 0 10px 10px rgba(255,255,255,0.4), inset 0 -10px 10px rgba(0,0,0,0.3); }

/* 9. Prisma Penta */
.cristal-penta { width: 45px; height: 45px; background: #22d3ee; clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); position: relative; }
.cristal-penta::after { content:''; position:absolute; inset: 4px; background: rgba(255,255,255,0.3); clip-path: inherit; }

/* 10. Estrella */
.cristal-estrella { width: 55px; height: 55px; background: #22d3ee; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); position: relative; }
.cristal-estrella::after { content:''; position:absolute; inset: 0; background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%); clip-path: inherit; }

/* ESTADOS */
.etiqueta-nombre { background: rgba(15, 23, 42, 0.9); border: 1px solid #22d3ee; color: #a5f3fc; padding: 3px 10px; border-radius: 6px; text-align: center; width: 100%; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
.opcion-seleccionada .etiqueta-nombre { border-color: #10b981; color: #fff; background: #064e3b; box-shadow: 0 0 20px #10b981; }
.opcion-error .etiqueta-nombre { border-color: #ef4444; color: #fca5a5; background: #450a0a; }

.base-energia { width: 70px; height: 10px; background: radial-gradient(ellipse, #22d3ee, transparent 70%); border-radius: 50%; opacity: 0.3; margin-top: -5px; }

@keyframes flotar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@keyframes shakeError { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
</style>