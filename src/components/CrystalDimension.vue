<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { Box, Undo2, X, Info, RotateCcw, Trophy, LogOut } from 'lucide-vue-next';
import RetoACoordenadas from './RetoACoordenadas.vue';
import RetoBPoliedros from './RetoBPoliedros.vue'; 
import RetoCVolumen from './RetoCVolumen.vue';
import RetoDSimetria from './RetoDSimetria.vue'; 
import RetoEAngulos from './RetoEAngulos.vue'; 
import RetoFFracciones from './RetoFFracciones.vue'; 
import RetoGVistas from './RetoGVistas.vue'; 

const emit = defineEmits(['close', 'sumar-premios']);

const fase = ref('intro'); 
const rotationY = ref(0);
const retoActivo = ref(0); 
const resetKey = ref(0);

const retosGanadosRealmente = ref(0);
const plataSesion = computed(() => retosGanadosRealmente.value * 2);
const radioZ = ref(1000); 

// Variables globales del componente para blindar el audio
let audioCristal = null;
let audioTech = null;
let timerVoz = null;
let timerJuego = null;

const claseLluvia = computed(() => {
  if (retoActivo.value === 0) return 'lluvia-esferas';
  if (retoActivo.value === 1) return 'lluvia-poligonos';
  if (retoActivo.value === 2) return 'lluvia-cubos';
  if (retoActivo.value === 3) return 'lluvia-esferas';
  if (retoActivo.value === 4) return 'lluvia-poligonos';
  if (retoActivo.value === 5) return 'lluvia-cubos';
  if (retoActivo.value === 6) return 'lluvia-estrellas';
  return 'lluvia-estrellas'; 
});

const calcularRadioOctagono = () => {
  const ancho = window.innerWidth > 1024 ? 1024 : window.innerWidth;
  radioZ.value = Math.round((ancho / 2) / 0.4142) + 30; 
};

// Función para adelantar la evolución a los juegos
const saltarIntro = () => {
  clearTimeout(timerJuego);
  fase.value = 'jugando';
};

// NUEVO: Función maestra de cierre (Apaga audios y temporizadores antes de salir)
const goBack = () => {
  if (audioCristal) { audioCristal.pause(); audioCristal.currentTime = 0; }
  if (audioTech) { audioTech.pause(); audioTech.currentTime = 0; }
  clearTimeout(timerVoz);
  clearTimeout(timerJuego);
  emit('close');
};

onMounted(() => {
  calcularRadioOctagono();
  window.addEventListener('resize', calcularRadioOctagono);

  // --- SECUENCIA DE AUDIO BLINDADA ---
  audioCristal = new Audio('/audios/buho-cristal.mp3');
  audioCristal.volume = 1.0;
  
  audioTech = new Audio('/audios/buho_tech.mp3');
  audioTech.volume = 1.0;
  audioTech.playbackRate = 1.25; 
  audioTech.preservesPitch = false; 

  // Disparo 1 Inmediato
  audioCristal.play().catch(e => console.log("Bloqueo autoplay audio 1", e));
  
  // Disparo 2 (A los 3 segundos)
  timerVoz = setTimeout(() => {
    if(fase.value === 'intro') { // Solo suena si no ha saltado la intro
      audioTech.play().catch(e => console.log("Bloqueo autoplay audio 2", e));
    }
  }, 3000);

  // Disparo 3: Evolución automática a los juegos (11 segundos)
  timerJuego = setTimeout(() => { 
    saltarIntro(); 
  }, 11000);
});

onUnmounted(() => {
  window.removeEventListener('resize', calcularRadioOctagono);
  goBack(); // Seguro de vida por si se desmonta de golpe
});

const girarManual = () => {
  rotationY.value -= 45; 
  retoActivo.value = (retoActivo.value + 1) % 8;
};

const registrarExitoYVotar = () => {
  retosGanadosRealmente.value++; 
  
  const audioCoins = new Audio('/audios/coins.mp3'); 
  audioCoins.play().catch(()=> {});
  emit('sumar-premios', 2);

  setTimeout(() => {
     rotationY.value -= 45; 
     retoActivo.value = (retoActivo.value + 1) % 8; 
  }, 1000); 
};

const reiniciarTodos = () => {
  resetKey.value++; 
  retosGanadosRealmente.value = 0; 
  
  rotationY.value -= 45; 
  retoActivo.value = 0;
};

const abrirReglasActivas = () => {
  const btn = document.getElementById(`btn-abrir-reglas-${retoActivo.value}`);
  if (btn) btn.click();
};
</script>

<template>
  <div class="crystal-master">
    <main class="crystal-canvas crystal-bg relative">
        
        <div v-if="fase === 'jugando' && retoActivo < 7" class="absolute top-2 left-2 md:top-4 md:left-4 z-[100] flex items-center bg-slate-900/60 backdrop-blur-sm border border-cyan-500/50 rounded-full px-3 py-1.5 md:px-4 md:py-2 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <img src="/images/coin-silver.png" alt="Plata" class="w-5 h-5 md:w-6 md:h-6 mr-2 drop-shadow-md" />
          <span class="font-black text-cyan-100 text-sm md:text-base">{{ plataSesion }}</span>
        </div>

        <button v-if="fase !== 'premio'" @click="goBack" class="absolute top-2 right-2 md:top-4 md:right-4 z-[100] p-2 md:p-3 bg-white/10 rounded-full text-cyan-400 hover:bg-white/20 transition-all backdrop-blur-md border border-cyan-400/30">
          <X size="20" class="md:w-6 md:h-6" />
        </button>

        <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div v-for="n in 15" :key="n" class="cristal-caida" :class="claseLluvia"
               :style="{ left: `${Math.random() * 100}%`, animationDuration: `${Math.random() * 8 + 4}s`, animationDelay: `-${Math.random() * 10}s` }">
          </div>
        </div>

        <h1 v-if="fase === 'jugando'" class="absolute top-3 md:top-6 left-1/2 -translate-x-1/2 text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-emerald-400 font-black text-xl md:text-3xl tracking-widest uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] z-40 w-3/4 text-center leading-none">
            Dimensión Cuántica
        </h1>

        <transition name="fade-curtain">
          <div v-if="fase === 'intro'" class="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-[#050b14] overflow-hidden">
              
              <video 
                src="/videos/buho_tech.mp4" 
                autoplay 
                loop 
                muted 
                playsinline
                class="absolute inset-0 w-full h-full object-contain z-0"
              ></video>

              <button @click="saltarIntro" class="absolute bottom-6 right-6 z-[100] text-cyan-500/60 hover:text-cyan-300 font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2">
                Saltar Intro >
              </button>
          </div>
        </transition>

        <div v-show="fase === 'jugando'" class="camara-3d absolute top-[60px] md:top-[100px] bottom-0 left-0 right-0 z-10 flex items-center justify-center pb-10 md:pb-0">
            <div class="rotador-3d w-full h-full" :style="{ '--tz': `${radioZ}px`, transform: `translateZ(-${radioZ}px) rotateY(${rotationY}deg)` }">
                
                <div class="cara-escenario cara-1 w-full h-full">
                  <RetoACoordenadas :key="'A'+resetKey" @completado="registrarExitoYVotar" />
                </div>
                <div class="cara-escenario cara-2 w-full h-full">
                  <RetoBPoliedros :key="'B'+resetKey" @completado="registrarExitoYVotar" />
                </div>
                <div class="cara-escenario cara-3 w-full h-full">
                  <RetoCVolumen :key="'C'+resetKey" @completado="registrarExitoYVotar" />
                </div>
                <div class="cara-escenario cara-4 w-full h-full">
                  <RetoDSimetria :key="'D'+resetKey" @completado="registrarExitoYVotar" />
                </div>
                <div class="cara-escenario cara-5 w-full h-full">
                  <RetoEAngulos :key="'E'+resetKey" @completado="registrarExitoYVotar" />
                </div>
                <div class="cara-escenario cara-6 w-full h-full">
                  <RetoFFracciones :key="'F'+resetKey" @completado="registrarExitoYVotar" />
                </div>
                <div class="cara-escenario cara-7 w-full h-full">
                  <RetoGVistas :key="'G'+resetKey" @completado="registrarExitoYVotar" />
                </div>

                <div class="cara-escenario cara-8 w-full h-full flex flex-col items-center justify-center">
                    <div class="bg-slate-900/80 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-cyan-500/50 text-center shadow-[0_0_30px_rgba(34,211,238,0.3)] w-[90%] md:w-auto">
                        <Trophy size="60" class="text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                        <h2 class="text-2xl md:text-3xl font-black text-cyan-300 mb-2 uppercase tracking-widest">
                          Circuito Finalizado
                        </h2>
                        
                        <p v-if="retosGanadosRealmente > 0" class="mb-6 text-emerald-400 font-bold tracking-widest uppercase text-sm md:text-lg">
                           Has recolectado {{ plataSesion }} Monedas de Plata
                        </p>
                        <p v-else class="mb-6 text-slate-400 font-bold tracking-widest uppercase text-sm">
                           Completa los retos para ganar premios
                        </p>

                        <div class="flex flex-col gap-3">
                          <button @click="reiniciarTodos" class="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all active:scale-95 text-base md:text-lg w-full flex items-center justify-center gap-2">
                              <RotateCcw size="20" /> Volver a Jugar
                          </button>
                          
                          <button @click="goBack" class="px-8 py-3 bg-transparent hover:bg-white/10 text-cyan-300 font-bold rounded-xl border border-cyan-500/50 transition-all active:scale-95 text-base md:text-lg w-full flex items-center justify-center gap-2">
                              <LogOut size="20" /> Regresar al Portal
                          </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div v-show="fase === 'jugando'" class="ui-panel absolute bottom-6 right-2 md:top-1/2 md:bottom-auto md:transform md:-translate-y-1/2 z-50">
            <button class="ui-btn group" @click="abrirReglasActivas">
                <Info size="20" class="md:w-6 md:h-6 text-emerald-400 group-hover:text-emerald-300" />
                <span class="text-emerald-400">Reglas</span>
            </button>
            <button class="ui-btn group" @click="girarManual"> 
                <Box size="20" class="md:w-6 md:h-6 text-cyan-300 group-hover:text-white" />
                <span>Girar 3D</span>
            </button>
            <button @click="goBack" class="ui-btn group">
                <Undo2 size="20" class="md:w-6 md:h-6 text-cyan-300 group-hover:text-white" />
                <span>Retorno</span>
            </button>
        </div>

    </main>
  </div>
</template>

<style scoped>
.fade-curtain-enter-active, .fade-curtain-leave-active { transition: opacity 0.8s ease; }
.fade-curtain-enter-from, .fade-curtain-leave-to { opacity: 0; }

.cristal-caida { position: absolute; top: -10%; background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(34,211,238,0.1) 100%); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 0 10px rgba(34,211,238,0.2); animation: caerCristal linear infinite; }
.lluvia-esferas { border-radius: 50%; width: 45px; height: 45px; } 
.lluvia-poligonos { clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); width: 50px; height: 50px; } 
.lluvia-cubos { border-radius: 6px; width: 45px; height: 45px; } 
.lluvia-estrellas { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); width: 40px; height: 40px; }

@keyframes caerCristal { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
@keyframes pulse-glow { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 40px rgba(34,211,238,0.6)); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 80px rgba(16,185,129,0.9)); } }
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }

.crystal-master { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f8fafc; overflow: hidden; }
.crystal-bg { background-color: #020617; background-image: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%); }
.crystal-canvas { display: flex; flex-direction: column; position: relative; overflow: hidden; width: 100vw; height: 100dvh; }
@media (min-width: 1025px) { .crystal-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 4px solid rgba(34,211,238,0.3); } }

.camara-3d { perspective: 1000px; }
.rotador-3d { position: relative; transform-style: preserve-3d; transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1); }
.cara-escenario { position: absolute; backface-visibility: hidden; }

/* CSS OCTÁGONO DINÁMICO */
.cara-1 { transform: rotateY(0deg) translateZ(var(--tz)); }
.cara-2 { transform: rotateY(45deg) translateZ(var(--tz)); }
.cara-3 { transform: rotateY(90deg) translateZ(var(--tz)); }
.cara-4 { transform: rotateY(135deg) translateZ(var(--tz)); }
.cara-5 { transform: rotateY(180deg) translateZ(var(--tz)); }
.cara-6 { transform: rotateY(225deg) translateZ(var(--tz)); }
.cara-7 { transform: rotateY(270deg) translateZ(var(--tz)); }
.cara-8 { transform: rotateY(315deg) translateZ(var(--tz)); }

.ui-panel { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 12px; padding: 10px 4px; display: flex; flex-direction: column; gap: 12px; }
@media (min-width: 768px) { .ui-panel { right: 15px; padding: 15px 10px; gap: 20px; border-radius: 20px; } }
.ui-btn { background: transparent; border: none; color: white; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; transition: all 0.2s; opacity: 0.7; }
.ui-btn:hover { opacity: 1; transform: scale(1.05); } 
.ui-btn span { font-size: 6px; text-transform: uppercase; color: #a5f3fc; }
@media (min-width: 768px) { .ui-btn span { font-size: 9px; gap: 4px; } }
</style>