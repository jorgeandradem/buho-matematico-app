<script setup>
import { ref, onMounted, computed } from 'vue';
import { Box, Undo2, X, Info, RotateCcw, Trophy } from 'lucide-vue-next';
import RetoACoordenadas from './RetoACoordenadas.vue';
import RetoBPoliedros from './RetoBPoliedros.vue'; 
import RetoCVolumen from './RetoCVolumen.vue';

const emit = defineEmits(['close', 'sumar-premios']);

const fase = ref('intro'); 
const rotationY = ref(0);
const retoActivo = ref(0); 
const resetKey = ref(0);

// 🛠️ NUEVO: Contador de retos ganados realmente
const retosGanadosRealmente = ref(0);

const claseLluvia = computed(() => {
  if (retoActivo.value === 0) return 'lluvia-esferas';
  if (retoActivo.value === 1) return 'lluvia-poligonos';
  if (retoActivo.value === 2) return 'lluvia-cubos';
  return 'lluvia-estrellas'; 
});

onMounted(() => {
  const audioBienvenida = new Audio('/audios/owl.mp3');
  audioBienvenida.play().catch(e => console.log("Bloqueo autoplay audio."));
  setTimeout(() => { fase.value = 'jugando'; }, 3500);
});

// 🛠️ FUNCIÓN PARA EL GIRO VISUAL (Boton de la derecha)
// Solo gira, no entrega premios.
const girarManual = () => {
  rotationY.value -= 90; 
  retoActivo.value = (retoActivo.value + 1) % 4;
};

// 🛠️ FUNCIÓN PARA EL PROGRESO REAL (Cuando ganan un juego)
const registrarExitoYVotar = () => {
  retosGanadosRealmente.value++; // Sumamos un éxito real
  
  // Giramos
  rotationY.value -= 90; 
  retoActivo.value = (retoActivo.value + 1) % 4; 

  // SOLO entregamos premios si llegamos a la cara 3 Y han ganado los 3 juegos
  if (retoActivo.value === 3 && retosGanadosRealmente.value >= 3) {
    const audioCoins = new Audio('/audios/coins.mp3'); 
    setTimeout(() => audioCoins.play().catch(()=> {}), 500);
    emit('sumar-premios', 5);
  }
};

const reiniciarTodos = () => {
  resetKey.value++; 
  retosGanadosRealmente.value = 0; // 🛠️ Reseteamos el contador de éxitos
  rotationY.value -= 90; 
  retoActivo.value = 0;
};

const abrirReglasActivas = () => {
  const btn = document.getElementById(`btn-abrir-reglas-${retoActivo.value}`);
  if (btn) btn.click();
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas crystal-bg relative">
        
        <button v-if="fase !== 'premio'" @click="emit('close')" class="absolute top-2 right-2 md:top-4 md:right-4 z-[100] p-2 md:p-3 bg-white/10 rounded-full text-cyan-400 hover:bg-white/20 transition-all backdrop-blur-md border border-cyan-400/30">
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
          <div v-if="fase === 'intro'" class="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-[#050b14] backdrop-blur-xl">
              <h2 class="text-3xl md:text-5xl font-black text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] mb-10 text-center uppercase tracking-widest">Bienvenido a la<br>Dimensión</h2>
              <div class="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center animate-pulse-glow">
                  <div class="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"></div>
                  <img src="@/assets/cristal-3d/buho-cristal.png" class="w-full h-full object-contain relative z-10 filter drop-shadow-[0_0_40px_rgba(34,211,238,0.9)]" />
              </div>
          </div>
        </transition>

        <div v-show="fase === 'jugando'" class="camara-3d absolute top-[60px] md:top-[100px] bottom-0 left-0 right-0 z-10 flex items-center justify-center pb-10 md:pb-0">
            <div class="rotador-3d w-full h-full" :style="{ transform: `translateZ(-300px) rotateY(${rotationY}deg)` }">
                
                <div class="cara-escenario frontal w-full h-full">
                  <RetoACoordenadas :key="'A'+resetKey" @completado="registrarExitoYVotar" />
                </div>
                
                <div class="cara-escenario derecha w-full h-full">
                  <RetoBPoliedros :key="'B'+resetKey" @completado="registrarExitoYVotar" />
                </div>
                
                <div class="cara-escenario trasera w-full h-full">
                  <RetoCVolumen :key="'C'+resetKey" @completado="registrarExitoYVotar" />
                </div>

                <div class="cara-escenario izquierda w-full h-full flex flex-col items-center justify-center">
                    <div class="bg-slate-900/80 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-cyan-500/50 text-center shadow-[0_0_30px_rgba(34,211,238,0.3)] w-[90%] md:w-auto">
                        
                        <div v-if="retoActivo === 3 && retosGanadosRealmente >= 3" class="flex justify-center gap-2 md:gap-4 mb-6">
                            <div v-for="i in 5" :key="i" class="moneda-plata" :style="{ animationDelay: `${i * 0.15}s` }">
                              <div class="moneda-brillo"></div><span class="moneda-texto">1</span>
                            </div>
                        </div>

                        <h2 class="text-2xl md:text-3xl font-black text-cyan-300 mb-2 uppercase tracking-widest">
                          {{ retosGanadosRealmente >= 3 ? '¡Portal Completado!' : 'Circuito Finalizado' }}
                        </h2>
                        
                        <p v-if="retosGanadosRealmente >= 3" class="mb-8 text-emerald-400 font-bold tracking-widest uppercase text-sm md:text-lg">+5 Platas Obtenidas</p>
                        <p v-else class="mb-8 text-slate-400 font-bold tracking-widest uppercase text-sm">Completa los 3 juegos para ganar premios</p>

                        <button @click="reiniciarTodos" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all active:scale-95 text-lg md:text-xl w-full flex items-center justify-center gap-2">
                            <RotateCcw size="24" /> Volver a Jugar
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <div v-show="fase === 'jugando'" class="ui-panel top-[45%] md:top-1/2 transform -translate-y-1/2 z-50">
            <button class="ui-btn group" @click="abrirReglasActivas">
                <Info size="20" class="md:w-6 md:h-6 text-emerald-400 group-hover:text-emerald-300" />
                <span class="text-emerald-400">Reglas</span>
            </button>
            
            <button class="ui-btn group" @click="girarManual"> 
                <Box size="20" class="md:w-6 md:h-6 text-cyan-300 group-hover:text-white" />
                <span>Girar 3D</span>
            </button>
            
            <button @click="emit('close')" class="ui-btn group">
                <Undo2 size="20" class="md:w-6 md:h-6 text-cyan-300 group-hover:text-white" />
                <span>Retorno</span>
            </button>
        </div>

    </main>
  </div>
</template>

<style scoped>
/* (Se mantienen los estilos del código original proporcionado por el usuario) */
.fade-curtain-enter-active, .fade-curtain-leave-active { transition: opacity 0.8s ease; }
.fade-curtain-enter-from, .fade-curtain-leave-to { opacity: 0; }

.moneda-plata { position: relative; width: 40px; height: 40px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #ffffff 0%, #cbd5e1 40%, #64748b 100%); border: 2px solid #f1f5f9; box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 5px 15px rgba(0,0,0,0.8), 0 0 15px rgba(203,213,225,0.6); display: flex; align-items: center; justify-content: center; animation: saltarMoneda 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; transform-style: preserve-3d; }
@media (min-width: 768px) { .moneda-plata { width: 60px; height: 60px; border-width: 3px; } }
.moneda-texto { font-family: serif; font-size: 20px; font-weight: 900; color: #334155; text-shadow: 1px 1px 2px rgba(255,255,255,0.8); }
@media (min-width: 768px) { .moneda-texto { font-size: 26px; } }
.moneda-brillo { position: absolute; inset: 0; border-radius: 50%; background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 50%); }

@keyframes saltarMoneda { 0% { transform: translateY(100px) scale(0) rotateY(180deg); opacity: 0; } 100% { transform: translateY(0) scale(1) rotateY(0deg); opacity: 1; } }

.cristal-caida { position: absolute; top: -10%; background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(34,211,238,0.1) 100%); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 0 10px rgba(34,211,238,0.2); animation: caerCristal linear infinite; }
.lluvia-esferas { border-radius: 50%; width: 45px; height: 45px; } 
.lluvia-poligonos { clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); width: 50px; height: 50px; } 
.lluvia-cubos { border-radius: 6px; width: 45px; height: 45px; } 
.lluvia-estrellas { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); width: 40px; height: 40px; }

@keyframes caerCristal { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
@keyframes pulse-glow { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 40px rgba(34,211,238,0.6)); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 80px rgba(16,185,129,0.9)); } }
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }

.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f8fafc; overflow: hidden; }
.crystal-bg { background-color: #020617; background-image: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%); }
.app-canvas { display: flex; flex-direction: column; position: relative; overflow: hidden; width: 100vw; height: 100dvh; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 4px solid rgba(34,211,238,0.3); } }

.camara-3d { perspective: 1000px; }
.rotador-3d { position: relative; transform-style: preserve-3d; transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1); }
.cara-escenario { position: absolute; backface-visibility: hidden; }

.frontal { transform: rotateY(0deg) translateZ(300px); }
.derecha { transform: rotateY(90deg) translateZ(300px); }
.trasera { transform: rotateY(180deg) translateZ(300px); }
.izquierda { transform: rotateY(-90deg) translateZ(300px); }

.ui-panel { position: absolute; right: 4px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 12px; padding: 10px 4px; display: flex; flex-direction: column; gap: 12px; z-index: 60; }
@media (min-width: 768px) { .ui-panel { right: 15px; padding: 15px 10px; gap: 20px; border-radius: 20px; } }
.ui-btn { background: transparent; border: none; color: white; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; transition: all 0.2s; opacity: 0.7; }
.ui-btn:hover { opacity: 1; transform: scale(1.05); } 
.ui-btn span { font-size: 6px; text-transform: uppercase; color: #a5f3fc; }
@media (min-width: 768px) { .ui-btn span { font-size: 9px; gap: 4px; } }
</style>