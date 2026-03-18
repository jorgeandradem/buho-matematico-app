<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  Trophy, X, ChevronRight, ChevronLeft, 
  Layout, CheckCircle, Info, Coins, Target
} from 'lucide-vue-next';

const emit = defineEmits(['close']);

// --- ESTADO ---
const currentStep = ref(1); 
const progress = ref(1); 
const totalErrors = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const feedbackMessage = ref("");
const selectedShapeId = ref(null);
const animatingId = ref(null); 
const showInTable = ref(false); 
const showRain = ref(false);

// --- ESTADO DEL NAVEGADOR DESLIZABLE ---
const shelfRef = ref(null);
const isAtStart = ref(true);
const isAtEnd = ref(false);

// --- BANCO DE RETOS ---
const allChallenges = [
  { instruction: "Busca el CÍRCULO: Redondo y sin esquinas.", targetId: 'circulo' },
  { instruction: "Necesito un TRIÁNGULO: 3 lados rectos.", targetId: 'triangulo' },
  { instruction: "Dibuja un CUADRADO: 4 lados igualitos.", targetId: 'cuadrado' },
  { instruction: "Localiza el PENTÁGONO: La casa de 5 lados.", targetId: 'pentagono' },
  { instruction: "Selecciona el HEXÁGONO: Como un panal de abejas.", targetId: 'hexagono' },
  { instruction: "Busca la ESTRELLA: ¡La que más brilla!", targetId: 'estrella' },
  { instruction: "Cuerpo 3D: Una ESFERA. Como un balón.", targetId: 'esfera' },
  { instruction: "Cuerpo 3D: CILINDRO. Tubo con bases circulares.", targetId: 'cilindro' },
  { instruction: "Cuerpo 3D: PIRÁMIDE. Base cuadrada y punta fina.", targetId: 'pyramid' },
  { instruction: "Busca un ÓVALO: Como un huevo estirado.", targetId: 'ovalo' }
];

const randomizedChallenges = ref([]);

const shuffleChallenges = () => {
  randomizedChallenges.value = [...allChallenges].sort(() => Math.random() - 0.5);
};

// --- LÓGICA DE SCROLL PARA FLECHAS ---
const checkScroll = () => {
  if (!shelfRef.value) return;
  const { scrollLeft, scrollWidth, clientWidth } = shelfRef.value;
  isAtStart.value = scrollLeft <= 1;
  isAtEnd.value = Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1;
};

const nextShapes = () => {
  if (shelfRef.value) shelfRef.value.scrollBy({ left: 200, behavior: 'smooth' });
};

const prevShapes = () => {
  if (shelfRef.value) shelfRef.value.scrollBy({ left: -200, behavior: 'smooth' });
};

onMounted(() => {
  shuffleChallenges();
  setTimeout(checkScroll, 100);
  window.addEventListener('resize', checkScroll);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScroll);
});

const currentChallenge = computed(() => {
  return randomizedChallenges.value[progress.value - 1] || allChallenges[0];
});

// --- INVENTARIO HOMOLOGADO ---
const shapeInventory = [
  { id: 'circulo', name: 'CÍRCULO', class: 'fig-circulo' },
  { id: 'triangulo', name: 'TRIÁNGULO', class: 'fig-triangulo' },
  { id: 'rectangulo', name: 'RECTÁNGULO', class: 'fig-rectangulo' },
  { id: 'cuadrado', name: 'CUADRADO', class: 'fig-cuadrado' },
  { id: 'rombo', name: 'ROMBO', class: 'fig-rombo' },
  { id: 'pentagono', name: 'PENTÁGONO', class: 'fig-pentagono' },
  { id: 'hexagono', name: 'HEXÁGONO', class: 'fig-hexagono' },
  { id: 'estrella', name: 'ESTRELLA', class: 'fig-estrella' },
  { id: 'ovalo', name: 'ÓVALO', class: 'fig-ovalo' },
  { id: 'pyramid', name: 'PIRÁMIDE', class: 'fig-pyramid' },
  { id: 'esfera', name: 'ESFERA', class: 'fig-sphere' },
  { id: 'cilindro', name: 'CILINDRO', class: 'fig-cylinder' }
];

// --- SONIDOS LOCALES ---
const playSound = (type) => {
  const sounds = {
    correct: '/audios/correct1.mp3',
    error: '/audios/wrong1.mp3',
    coins: '/audios/coins.mp3'
  };
  const audio = new Audio(sounds[type]);
  audio.play().catch(() => {});
};

// --- MANEJO QUIRÚRGICO DE CIERRE/RETORNO ---
const handleCloseSurgical = () => {
  if (currentStep.value === 2) {
    // Si estamos jugando, regresa a las reglas
    currentStep.value = 1;
  } else {
    // Si estamos en reglas o resultados, cierra todo
    emit('close');
  }
};

const handleSelection = (shapeId) => {
  if (shapeId === currentChallenge.value.targetId) {
    playSound('correct'); 
    selectedShapeId.value = shapeId;
    showInTable.value = true;
    feedbackMessage.value = "¡EXCELENTE!";
    
    setTimeout(() => {
      if (progress.value < 10) {
        progress.value++;
        showInTable.value = false;
        selectedShapeId.value = null;
        feedbackMessage.value = "";
      } else {
        calculateFinalPrize();
      }
    }, 1500); 
  } else {
    playSound('error'); 
    totalErrors.value++;
    animatingId.value = shapeId;
    feedbackMessage.value = "INTENTA OTRA VEZ";
    setTimeout(() => { animatingId.value = null; feedbackMessage.value = ""; }, 600);
  }
};

const calculateFinalPrize = () => {
  if (totalErrors.value === 0) sessionCoins.value.gold = 1;
  else if (totalErrors.value <= 3) sessionCoins.value.silver = 1;
  else sessionCoins.value.copper = 1;
  
  currentStep.value = 3;
  showRain.value = true;
  playSound('coins');
  
  setTimeout(() => {
    showRain.value = false;
  }, 3000);
};

const resetSession = () => {
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  progress.value = 1; 
  totalErrors.value = 0;
  currentStep.value = 1;
  if (shelfRef.value) shelfRef.value.scrollTo({ left: 0 });
  selectedShapeId.value = null;
  showInTable.value = false;
  showRain.value = false;
  shuffleChallenges();
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas shadow-pc">
      
      <header class="header-standard shrink-0" :class="{ 'bg-transparent': currentStep === 1 }">
        
        <div class="header-left" :style="{ visibility: currentStep > 1 ? 'visible' : 'hidden' }">
          <div class="trophy-box">
            <Trophy size="24" stroke-width="2.5" class="text-yellow-600" />
          </div>
          <span class="progress-text">{{ progress }}/10</span>
        </div>

        <div class="session-loot-capsule" :style="{ visibility: currentStep > 1 ? 'visible' : 'hidden' }">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="stat-divider-sm"></div>
          <div class="loot-item"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="stat-divider-sm"></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>

        <button @click="handleCloseSurgical" class="btn-close-circle">
          <X size="28" stroke-width="3" />
        </button>

      </header>

      <section v-if="currentStep === 1" class="game-content center-vh animate-fade-in">
        <div class="welcome-card">
          <div class="header-icon-main">📐</div>
          <h1 class="main-title">ARQUITECTO PRO</h1>
          
          <div class="rules-container">
            <div class="rule-item">
              <div class="rule-icon bg-blue-100 text-blue-600"><Target size="20"/></div>
              <div class="rule-text">
                <strong>Mira el Plano</strong>
                <span>Observa la instrucción y elige la forma exacta.</span>
              </div>
            </div>
            <div class="rule-item">
              <div class="rule-icon bg-purple-100 text-purple-600"><Info size="20"/></div>
              <div class="rule-text">
                <strong>Evita Errores</strong>
                <span>¡Cuidado! Los errores bajan la calidad de tu medalla.</span>
              </div>
            </div>
            <div class="rule-item">
              <div class="rule-icon bg-yellow-100 text-yellow-600"><Coins size="20"/></div>
              <div class="rule-text">
                <strong>Gana Botín</strong>
                <span>Oro (0 errores), Plata (1-3) o Cobre (+3).</span>
              </div>
            </div>
          </div>

          <button @click="currentStep = 2" class="btn-start">¡EMPEZAR A CONSTRUIR! <ChevronRight/></button>
        </div>
      </section>

      <section v-if="currentStep === 2" class="game-content">
        <div class="instruction-bubble">
          <div class="owl-mini">🎨</div>
          <p>{{ currentChallenge.instruction }}</p>
        </div>

        <div class="blueprint-area">
          <div class="blueprint-table shadow-xl">
            <div class="blueprint-grid">
              <div class="blueprint-header">PLANO TÉCNICO #{{ progress }}</div>
              
              <div class="stage-area">
                <Transition name="fade">
                  <div v-if="feedbackMessage" class="feedback-toast" :class="feedbackMessage.includes('INTENTA') ? 'error' : 'success'">
                    {{ feedbackMessage }}
                  </div>
                </Transition>

                <div v-if="!showInTable" class="shape-ghost-container">
                  <div class="shape-base ghost" :class="currentChallenge.targetId"></div>
                </div>
                
                <Transition name="jump-slow">
                  <div v-if="showInTable" class="preview-stage">
                    <div class="shape-base" :class="shapeInventory.find(s => s.id === selectedShapeId)?.class"></div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <div class="inventory-navigator">
          <button @click="prevShapes" class="nav-arrow" :disabled="isAtStart">
            <ChevronLeft size="32" :class="isAtStart ? 'text-slate-300' : 'text-blue-500'"/>
          </button>
          
          <div class="visible-shelf" ref="shelfRef" @scroll="checkScroll">
            <div v-for="shape in shapeInventory" :key="shape.id" 
                 class="shape-card" :class="{ 'error-shake': animatingId === shape.id }"
                 @click="handleSelection(shape.id)">
              <div class="shape-preview-box">
                <div class="shape-base mini" :class="shape.class"></div>
              </div>
              <span class="shape-label">{{ shape.name }}</span>
            </div>
          </div>

          <button @click="nextShapes" class="nav-arrow" :disabled="isAtEnd">
            <ChevronRight size="32" :class="isAtEnd ? 'text-slate-300' : 'text-blue-500'"/>
          </button>
        </div>
      </section>

      <section v-if="currentStep === 3" class="game-content center-vh result-screen-dark">
        <div v-if="showRain" class="coin-rain">
           <div v-for="n in 25" :key="n" class="falling-coin" :style="`--delay: ${Math.random()}s; --pos: ${Math.random()*100}%` ">
              <img v-if="sessionCoins.gold" src="/images/coin-gold.png" />
              <img v-else-if="sessionCoins.silver" src="/images/coin-silver.png" />
              <img v-else src="/images/coin-copper.png" />
           </div>
        </div>

        <Trophy :size="80" class="trophy-gold" />
        <h1 class="chef-supremo-title">¡CHEF SUPREMO!</h1>

        <div class="stats-capsule">
           <div class="stat-item">
             <img src="/images/coin-gold.png" />
             <span>+{{ sessionCoins.gold }}</span>
           </div>
           <div class="stat-divider"></div>
           <div class="stat-item">
             <img src="/images/coin-silver.png" />
             <span>+{{ sessionCoins.silver }}</span>
           </div>
           <div class="stat-divider"></div>
           <div class="stat-item">
             <img src="/images/coin-copper.png" />
             <span>+{{ sessionCoins.copper }}</span>
           </div>
        </div>

        <button @click="emit('close')" class="btn-terminar-3d">TERMINAR</button>
        <button @click="resetSession" class="btn-repetir-text">REPETIR RETO</button>
      </section>

    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background: #e2e8f0; font-family: 'Inter', sans-serif; }
.app-canvas { background: #ffffff; width: 100vw; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; position: relative; }
.center-vh { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 20px; }

/* ENCABEZADO */
.header-standard { 
  padding: 1rem 1.5rem; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background: #e2e8f0; 
  transition: background 0.3s;
}
.header-standard.bg-transparent {
  background: transparent;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}
.trophy-box {
  background: #fef08a; 
  border: 3px solid #fde047;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-text {
  font-weight: 900;
  font-size: 1.8rem;
  color: #1e3a8a; 
}
.session-loot-capsule {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 9999px;
  padding: 8px 25px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  border: 2px solid #e2e8f0;
}
.loot-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  font-size: 1.3rem;
  color: #1e3a8a;
}
.loot-item img {
  width: 1.4rem;
  height: 1.4rem;
  object-fit: contain;
}
.stat-divider-sm {
  width: 2px;
  height: 20px;
  background: #cbd5e1;
  margin: 0 15px;
}
.btn-close-circle {
  background: white;
  color: #1e3a8a;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}
.btn-close-circle:active {
  transform: scale(0.9);
}

/* PORTADA */
.welcome-card { width: 100%; max-width: 450px; background: white; border-radius: 30px; padding: 30px; border: 2px solid #f1f5f9; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; }
.header-icon-main { font-size: 50px; margin-bottom: 10px; }
.main-title { font-size: 2rem; font-weight: 900; color: #312e81; margin-bottom: 25px; }
.rules-container { text-align: left; margin-bottom: 30px; display: flex; flex-direction: column; gap: 15px; }
.rule-item { display: flex; gap: 15px; align-items: center; }
.rule-icon { padding: 10px; border-radius: 12px; }
.rule-text { display: flex; flex-direction: column; }
.rule-text strong { font-size: 0.9rem; color: #1e293b; }
.rule-text span { font-size: 0.8rem; color: #64748b; }
.btn-start { background: #3b82f6; color: white; width: 100%; padding: 18px; border-radius: 20px; font-weight: 900; border: none; box-shadow: 0 6px 0 #1d4ed8; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; font-size: 1.1rem; }

/* BLUEPRINT */
.instruction-bubble { width: 90%; background: #eff6ff; padding: 15px 20px; border-radius: 20px; display: flex; gap: 15px; align-items: center; border: 2px solid #dbeafe; margin: 10px auto; }
.instruction-bubble p { font-weight: 800; color: #1e3a8a; margin: 0; }
.blueprint-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px; }
.blueprint-table { width: 100%; max-width: 500px; height: 320px; background: #fff; border: 2px solid #dbeafe; border-radius: 30px; overflow: hidden; position: relative; }
.blueprint-grid { width: 100%; height: 100%; background-image: radial-gradient(#3b82f622 1.5px, transparent 1.5px); background-size: 20px 20px; display: flex; flex-direction: column; }
.blueprint-header { background: #3b82f6; color: white; font-size: 12px; font-weight: 900; text-align: center; padding: 8px; }

/* FIGURAS HOMOLOGADAS */
.stage-area { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; }
.shape-base { width: 100px; height: 100px; position: relative; transition: 0.3s; }
.shape-base.mini { transform: scale(0.45); }
.shape-base.ghost { border: 4px dashed #3b82f633; background: transparent !important; }

/* DEFINICIONES CSS DE FIGURAS */
.fig-circulo { border-radius: 50%; background: #ef4444; }
.fig-triangulo { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); background: #3b82f6; }
.fig-cuadrado { background: #10b981; border-radius: 8px; }
.fig-rectangulo { width: 120px !important; height: 70px !important; background: #f59e0b; border-radius: 8px; }
.fig-rombo { background: #8b5cf6; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
.fig-pentagono { background: #ec4899; clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); }
.fig-hexagono { background: #14b8a6; clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
.fig-estrella { background: #facc15; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
.fig-ovalo { border-radius: 50%; background: #fb923c; width: 120px !important; height: 75px !important; }
.fig-sphere { border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff, #64748b); }
.fig-cylinder { background: linear-gradient(90deg, #475569, #cbd5e1, #475569); border-radius: 10px; width: 80px !important; }
.fig-pyramid { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); background: #1e293b; border-bottom: 8px solid #000; }

/* NAVEGADOR DESLIZABLE (SCROLL NATIVO) */
.inventory-navigator { background: #f8fafc; padding: 15px; border-top: 2px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
.visible-shelf { 
  display: flex; 
  gap: 12px; 
  flex: 1; 
  overflow-x: auto; 
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  padding: 5px 0; 
  -ms-overflow-style: none;  
  scrollbar-width: none;  
}
.visible-shelf::-webkit-scrollbar {
  display: none;
}
.nav-arrow { background: transparent; border: none; cursor: pointer; flex-shrink: 0; padding: 0 5px; }
.shape-card { 
  flex-shrink: 0;
  scroll-snap-align: center;
  width: 95px; 
  height: 105px; 
  background: white; 
  border-radius: 20px; 
  border: 2px solid #e2e8f0; 
  border-bottom-width: 5px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
}
.shape-preview-box { height: 50px; display: flex; align-items: center; justify-content: center; }
.shape-label { font-size: 9px; font-weight: 900; color: #475569; text-transform: uppercase; margin-top: 5px; text-align: center; }

/* FEEDBACK */
.feedback-toast { position: absolute; top: 10%; padding: 8px 25px; border-radius: 50px; color: white; font-weight: 900; font-size: 11px; z-index: 10; }
.success { background: #10b981; }
.error { background: #ef4444; }
.error-shake { animation: shake 0.4s; border-color: #ef4444; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }

/* PANTALLA RESULTADOS CON DEGRADADO AZUL GRISÁCEO */
.result-screen-dark { 
  background: linear-gradient(135deg, #64748b 0%, #334155 100%);
  color: white; 
  position: relative; 
}
.trophy-gold { color: #fbbf24; margin-bottom: 1rem; }
.chef-supremo-title { font-size: 2.2rem; font-weight: 900; font-style: italic; margin-bottom: 2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }

.stats-capsule {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 35px;
  padding: 20px 40px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 3rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 50px; }
.stat-item img { width: 40px; height: 40px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); }
.stat-item span { font-weight: 900; font-size: 1.4rem; }
.stat-divider { width: 1px; height: 50px; background: rgba(255,255,255,0.15); }

/* BOTONES FINALES */
.btn-terminar-3d {
  background: #3b82f6; 
  color: white;
  font-size: 1.2rem;
  font-weight: 900;
  font-style: italic;
  padding: 16px 60px;
  border-radius: 30px;
  border: none;
  box-shadow: 0 8px 0 #1d4ed8, 0 15px 20px rgba(0,0,0,0.4);
  cursor: pointer;
  margin-bottom: 30px;
  text-transform: uppercase;
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-terminar-3d:active { transform: translateY(8px); box-shadow: 0 0 0 #1d4ed8, 0 5px 10px rgba(0,0,0,0.4); }

.btn-repetir-text {
  background: transparent;
  color: #e2e8f0;
  font-weight: 800;
  font-size: 0.9rem;
  border: none;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
}

/* LLUVIA DE MONEDAS */
.coin-rain { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 10; }
.falling-coin { position: absolute; top: -50px; left: var(--pos); animation: fall 3s linear forwards; animation-delay: var(--delay); }
.falling-coin img { width: 30px; }
@keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }

@media (min-width: 1024px) {
  .app-canvas { width: 1024px; height: 85dvh; border-radius: 40px; border: 10px solid #1e1b4b; margin: auto; }
}
</style>