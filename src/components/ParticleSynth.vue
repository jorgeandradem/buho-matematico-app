<template>
  <div class="master-container font-inter">
    <main class="app-canvas bg-slate-900 relative">
      
      <!-- CONTROLES SUPERIORES GLOBALES -->
      
      <!-- 1. Botón Cerrar (X) - Siempre visible a la derecha, devuelve al Lobby -->
      <button 
        @click="handleClose" 
        class="absolute top-4 right-4 sm:top-6 sm:right-6 z-[100] w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90"
      >
        <CloseIcon size="22" strokeWidth="2.5" />
      </button>

      <!-- 2. Botón de Reglas - Visible solo en la pantalla de selección (Izquierda) -->
      <button 
        v-if="!isStarted"
        @click="showRules = true" 
        class="absolute top-4 left-4 sm:top-6 sm:left-6 z-[100] w-10 h-10 sm:w-12 sm:h-12 bg-fuchsia-500/20 hover:bg-fuchsia-500/40 backdrop-blur-md border border-fuchsia-400/50 rounded-full flex items-center justify-center text-fuchsia-100 shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all active:scale-90"
      >
        <InfoIcon size="22" strokeWidth="2.5" />
      </button>

      <!-- 3. Botón Volver a Selección - Visible solo en el Canvas (Izquierda) -->
      <button 
        v-if="isStarted"
        @click="goBackToSelection" 
        class="absolute top-4 left-4 sm:top-6 sm:left-6 z-[100] px-4 h-10 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center gap-2 text-white shadow-lg transition-all active:scale-90"
      >
        <ArrowLeftIcon size="20" strokeWidth="2.5" />
        <span class="text-xs sm:text-sm font-black uppercase tracking-wider hidden sm:block">Cambiar Tabla</span>
      </button>

      <!-- POPUP DE REGLAS (MODAL) -->
      <Transition name="fade">
        <div v-if="showRules" class="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div class="bg-slate-900 w-full max-w-sm rounded-[2rem] border-2 border-fuchsia-500/50 shadow-[0_0_50px_rgba(217,70,239,0.2)] overflow-hidden flex flex-col">
            
            <!-- Cabecera Modal -->
            <div class="bg-gradient-to-br from-fuchsia-600 to-pink-600 p-6 text-center relative">
              <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30">
                <MusicIcon size="32" class="text-white" />
              </div>
              <h2 class="text-2xl font-black text-white uppercase tracking-tighter leading-none">Manual del Sintetizador</h2>
              <button @click="showRules = false" class="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                <CloseIcon size="24" strokeWidth="3" />
              </button>
            </div>

            <!-- Contenido Modal -->
            <div class="p-6 flex flex-col gap-5 text-left">
              <div class="flex gap-4 items-start">
                <div class="bg-fuchsia-500/20 p-2.5 rounded-xl shrink-0"><SparklesIcon size="20" class="text-fuchsia-400" /></div>
                <div>
                  <h3 class="text-fuchsia-300 font-black text-sm uppercase tracking-wider mb-1">Interacción</h3>
                  <p class="text-slate-300 text-xs leading-relaxed font-medium">Toca el lienzo para generar una onda expansiva. Las partículas se reorganizarán formando el siguiente múltiplo de la tabla elegida.</p>
                </div>
              </div>
              
              <div class="flex gap-4 items-start">
                <div class="bg-pink-500/20 p-2.5 rounded-xl shrink-0"><BrainCircuitIcon size="20" class="text-pink-400" /></div>
                <div>
                  <h3 class="text-pink-300 font-black text-sm uppercase tracking-wider mb-1">El Ciclo Lógico</h3>
                  <p class="text-slate-300 text-xs leading-relaxed font-medium">La progresión llegará hasta el 10º múltiplo (ej. 8x10 = 80). Luego, el bucle se reiniciará para que sigas memorizando.</p>
                </div>
              </div>

              <div class="flex gap-4 items-start">
                <div class="bg-teal-500/20 p-2.5 rounded-xl shrink-0"><CheckCircle2Icon size="20" class="text-teal-400" /></div>
                <div>
                  <h3 class="text-teal-300 font-black text-sm uppercase tracking-wider mb-1">Recompensa Sensorial</h3>
                  <p class="text-slate-300 text-xs leading-relaxed font-medium">Aquí no hay presiones ni puntos. El premio es relajar la mente conectando el sonido con la secuencia numérica.</p>
                </div>
              </div>

              <button @click="showRules = false" class="w-full py-4 mt-2 bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white rounded-2xl font-black text-sm shadow-[0_4px_0_rgb(157,23,77)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest">
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- PANTALLA 1: SELECCIÓN DE TABLA (GAMIFICADA) -->
      <div 
        v-if="!isStarted"
        class="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-900 overflow-y-auto"
      >
        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-fuchsia-500/20 rounded-full border-4 border-fuchsia-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(217,70,239,0.5)] shrink-0">
          <span class="text-3xl sm:text-4xl">🦉</span>
        </div>
        
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-fuchsia-400 to-pink-500 bg-clip-text text-transparent uppercase tracking-tighter text-center">
          Sintetizador Lógico
        </h1>
        <p class="text-slate-300 font-bold tracking-widest text-[10px] sm:text-xs mb-8 uppercase text-center border-b border-slate-700 pb-2">
          Elige una tabla para afinar el instrumento
        </p>

        <!-- Cuadrícula 1 al 10 -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 w-full max-w-2xl px-2">
          <button 
            v-for="n in 10" :key="n"
            @click="startExperience(n)"
            class="group relative aspect-square bg-slate-800 rounded-2xl border border-slate-700 shadow-lg hover:border-fuchsia-400 transition-all active:scale-95 flex items-center justify-center overflow-hidden"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span class="text-4xl font-black text-slate-200 group-hover:text-white group-hover:scale-110 transition-all z-10 font-numbers drop-shadow-md">
              {{ n }}
            </span>
          </button>
        </div>
      </div>

      <!-- PANTALLA 2: EL SINTETIZADOR (CANVAS) -->
      <div v-show="isStarted" class="absolute inset-0 w-full h-full">
        <!-- UI superpuesta sutil -->
        <div class="absolute bottom-6 left-0 right-0 z-10 text-center pointer-events-none px-4">
          <p class="text-fuchsia-300 text-[10px] sm:text-xs tracking-widest uppercase font-black bg-slate-900/80 backdrop-blur-sm inline-block px-5 py-2.5 rounded-full border border-fuchsia-500/30 shadow-2xl">
            Tabla del {{ currentStep }} <span class="mx-2 text-fuchsia-500/50">|</span> Múltiplo actual: {{ currentValue / currentStep }}
          </p>
        </div>

        <!-- Contenedor del Canvas para ajuste de tamaño exacto -->
        <div ref="canvasContainer" class="w-full h-full overflow-hidden">
          <canvas 
            ref="canvasRef" 
            class="block w-full h-full cursor-crosshair touch-none"
            @pointerdown="handleInteraction"
          ></canvas>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { 
  X as CloseIcon, 
  ArrowLeft as ArrowLeftIcon, 
  Info as InfoIcon,
  Music as MusicIcon,
  Sparkles as SparklesIcon,
  BrainCircuit as BrainCircuitIcon,
  CheckCircle2 as CheckCircle2Icon
} from 'lucide-vue-next';

const emit = defineEmits(['close']);

const canvasContainer = ref(null);
const canvasRef = ref(null);
const isStarted = ref(false);
const showRules = ref(false);

const currentStep = ref(1); 
const currentValue = ref(1);

// --- MOTOR DE PARTÍCULAS AISLADO ---
function useParticles() {
    let canvas, ctx, animationFrameId, container;
    let particles = [];
    let targetNumber = 1;
    let mouseX = -1000;
    let mouseY = -1000;
    let isActive = false;
    const colors = ['#d946ef', '#ec4899', '#f43f5e', '#8b5cf6', '#3b82f6']; // Tonos Synthwave

    class Particle {
        constructor(x, y, targetX, targetY, color) {
            this.x = x;
            this.y = y;
            this.targetX = targetX;
            this.targetY = targetY;
            this.vx = (Math.random() - 0.5) * 15;
            this.vy = (Math.random() - 0.5) * 15;
            this.radius = Math.random() * 2.5 + 1.5;
            this.color = color;
            this.friction = 0.85; 
            this.springFactor = 0.1; 
        }

        update(mX, mY) {
            let dx = mX - this.x;
            let dy = mY - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let interactionRadius = 120;
            
            if (distance < interactionRadius) {
                let force = (interactionRadius - distance) / interactionRadius;
                let angle = Math.atan2(dy, dx);
                this.vx -= Math.cos(angle) * force * 8;
                this.vy -= Math.sin(angle) * force * 8;
            }

            this.vx += (this.targetX - this.x) * this.springFactor;
            this.vy += (this.targetY - this.y) * this.springFactor;
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;
        }

        draw(context) {
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            context.fillStyle = this.color;
            context.fill();
        }
    }

    const getTextCoordinates = (text) => {
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
        
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height;
        
        let fontSize = Math.min(offCanvas.width, offCanvas.height) * 0.7;
        if (text.length > 1) fontSize = fontSize * (1.2 / text.length);

        offCtx.fillStyle = 'white';
        offCtx.font = `900 ${fontSize}px "Nunito", sans-serif`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);
        
        const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
        const coordinates = [];
        const gap = 8; // Densidad de partículas
        
        for (let y = 0; y < offCanvas.height; y += gap) {
            for (let x = 0; x < offCanvas.width; x += gap) {
                const index = (y * offCanvas.width + x) * 4;
                if (imageData[index + 3] > 128) {
                    coordinates.push({ x, y });
                }
            }
        }
        return coordinates;
    };

    const changeNumber = (num) => {
        targetNumber = num;
        const targetCoords = getTextCoordinates(num.toString());
        
        particles.forEach(p => {
            p.vx = (Math.random() - 0.5) * 60;
            p.vy = (Math.random() - 0.5) * 60;
        });

        for (let i = 0; i < targetCoords.length; i++) {
            const coords = targetCoords[i];
            if (i < particles.length) {
                particles[i].targetX = coords.x;
                particles[i].targetY = coords.y;
            } else {
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height, coords.x, coords.y, randomColor));
            }
        }
        
        if (particles.length > targetCoords.length) {
            for (let i = targetCoords.length; i < particles.length; i++) {
                particles[i].targetX = canvas.width / 2;
                particles[i].targetY = canvas.height / 2;
                particles[i].radius *= 0.8; 
            }
        }
    };

    const animate = () => {
        if (!isActive) return;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update(mouseX, mouseY);
            particle.draw(ctx);
        });

        animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
        if (!canvas || !container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (isActive) changeNumber(targetNumber);
    };

    const handlePointerMove = (e) => {
        if(!container) return;
        const rect = container.getBoundingClientRect();
        mouseX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        mouseY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    };

    const handlePointerOut = () => {
        mouseX = -1000;
        mouseY = -1000;
    };

    const init = (canvasElement, containerElement, startNum = 1) => {
        canvas = canvasElement;
        container = containerElement;
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        handleResize();

        window.addEventListener('resize', handleResize);
        container.addEventListener('pointermove', handlePointerMove, { passive: true });
        container.addEventListener('pointerleave', handlePointerOut);

        isActive = true;
        changeNumber(startNum);
        animate();
    };

    const destroy = () => {
        isActive = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        if(container) {
            container.removeEventListener('pointermove', handlePointerMove);
            container.removeEventListener('pointerleave', handlePointerOut);
        }
        particles = [];
    };

    return { init, changeNumber, destroy };
}

const { init, changeNumber, destroy } = useParticles();

// --- MOTOR DE AUDIO ---
const audioEngine = {
  ctx: null,
  frequencies: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00],
  
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  
  playNote(index) {
    if (!this.ctx) return;
    const safeIndex = index % this.frequencies.length;
    const freq = this.frequencies[safeIndex];
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 1.0);
  }
};

// --- HANDLERS ---
const startExperience = (tableNum) => {
  currentStep.value = tableNum;
  currentValue.value = tableNum;
  isStarted.value = true;
  
  audioEngine.init();
  audioEngine.playNote(0); 

  setTimeout(() => {
    init(canvasRef.value, canvasContainer.value, currentValue.value);
  }, 50);
};

const handleInteraction = (e) => {
  if (!isStarted.value) return;
  if (e.pointerType === 'touch') e.preventDefault();
  
  currentValue.value += currentStep.value;
  if (currentValue.value > currentStep.value * 10) {
      currentValue.value = currentStep.value; 
  }
  
  changeNumber(currentValue.value);
  const noteIndex = (currentValue.value / currentStep.value) - 1; 
  audioEngine.playNote(noteIndex);
};

const goBackToSelection = () => {
    destroy(); // Frenamos el consumo de recursos del canvas
    isStarted.value = false; // Volvemos a la pantalla 1
};

const handleClose = () => {
    destroy(); 
    emit('close');
};

onUnmounted(() => {
    destroy();
});
</script>

<style scoped>
/* ESTILOS HOMOLOGADOS DE TU ESTRUCTURA APP.VUE */

/* CONTENEDOR MAESTRO (FONDO PANTALLA) */
.master-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9; 
  overflow: hidden;
}

/* LIENZO DE LA APP (CANVAS) */
.app-canvas {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  background-color: #0f172a; /* Slate 900 base para el sintetizador */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);

  width: 100vw;
  height: 100dvh;
  overflow-y: auto; 
  overflow-x: hidden;
}

/* ADAPTACIÓN PROGRESIVA */
@media (min-width: 1025px) {
  .app-canvas {
    width: 1024px; /* REGLA MAESTRA PC */
    height: 90dvh;
    border-radius: 45px;
    box-shadow: 0 40px 100px rgba(0,0,0,0.15);
    border: 8px solid white;
    padding: 0; 
    overflow: hidden; 
  }
}

@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { 
    width: 85vw; 
    max-width: 800px; 
    height: 95dvh; 
    border-radius: 35px; 
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    padding: 0;
  }
}

.font-numbers { font-family: 'Nunito', sans-serif; }

/* Transiciones para el modal de reglas */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>