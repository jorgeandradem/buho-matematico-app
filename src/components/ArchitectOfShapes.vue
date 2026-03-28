<script setup>
/**
 * ARCHIVO: ArquitectoPro.vue
 * REVISIÓN: Motor de Voz Unificado + Silencio en Juego + Limpieza de Memoria
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { 
  Trophy, X, ChevronRight, ChevronLeft, 
  Layout, CheckCircle, Info, Coins, Target, Volume2
} from 'lucide-vue-next';

const emit = defineEmits(['close']);

// --- MOTOR DE VOZ UNIFICADO (speak) ---
const speak = (text, mood = 'intro') => {
  if (!window.speechSynthesis || !text) return;
  
  // Limpieza previa
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';

  // Configuración de los 4 estados de ánimo
  switch (mood) {
    case 'gold':
      utterance.pitch = 1.4; 
      utterance.rate = 1.1; 
      break;
    case 'silver':
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
      break;
    case 'copper':
      utterance.pitch = 0.7;
      utterance.rate = 0.8;
      break;
    default: // intro
      utterance.pitch = 1.0;
      utterance.rate = 0.9;
      break;
  }

  window.speechSynthesis.speak(utterance);
};

// Vocalización de Entrada (Instrucciones)
const vocalizeIntro = () => {
  const introText = "¡Bienvenido Arquitecto! Observa el plano técnico y busca la pieza correcta en la repisa. No cometas errores para ganar la medalla de oro y el máximo botín de monedas.";
  speak(introText, 'intro');
};

// --- ESTADO DEL JUEGO ---
const currentStep = ref(1); 
const progress = ref(1); 
const totalErrors = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const feedbackMessage = ref("");
const selectedShapeId = ref(null);
const animatingId = ref(null); 
const showInTable = ref(false); 
const showRain = ref(false);

const shelfRef = ref(null);

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
  { instruction: "Busca un ÓVALO: Como un huevo estirado.", targetId: 'ovalo' },
  { instruction: "Busca el ROMBO: Parece una cometa o un diamante.", targetId: 'rombo' },
  { instruction: "Selecciona el PARALELOGRAMO: Un rectángulo inclinado.", targetId: 'paralelogramo' },
  { instruction: "Busca el TRAPECIO: Como un techo o una falda.", targetId: 'trapecio' },
  { instruction: "Cuerpo 3D: CONO. Como un gorrito de fiesta o un helado.", targetId: 'cono' },
  { instruction: "Busca el SEMICÍRCULO: Es la mitad exacta de un círculo.", targetId: 'semicirculo' },
  { instruction: "Encuentra la CRUZ: Como el símbolo de un hospital.", targetId: 'cruz' },
  { instruction: "Selecciona la FLECHA: ¡Señala el camino correcto!", targetId: 'flecha' },
  { instruction: "Busca el CORAZÓN: ¡El símbolo clásico del amor!", targetId: 'corazon' },
  { instruction: "Cuerpo 3D: CUBO. Como un dado de seis caras iguales.", targetId: 'cubo' },
  { instruction: "Localiza el OCTÁGONO: La señal de PARE con 8 lados.", targetId: 'octagono' }
];

const randomizedChallenges = ref([]);

const shuffleChallenges = () => {
  randomizedChallenges.value = [...allChallenges].sort(() => Math.random() - 0.5);
};

// --- INVENTARIO HOMOLOGADO ---
const baseShapeInventory = [
  { id: 'circulo', name: 'CÍRCULO', class: 'fig-circulo' },
  { id: 'triangulo', name: 'TRIÁNGULO', class: 'fig-triangulo' },
  { id: 'rectangulo', name: 'RECTÁNGULO', class: 'fig-rectangulo' },
  { id: 'cuadrado', name: 'CUADRADO', class: 'fig-cuadrado' },
  { id: 'rombo', name: 'ROMBO', class: 'fig-rombo' },
  { id: 'paralelogramo', name: 'PARALELO.', class: 'fig-paralelogramo' },
  { id: 'trapecio', name: 'TRAPECIO', class: 'fig-trapecio' },
  { id: 'pentagono', name: 'PENTÁGONO', class: 'fig-pentagono' },
  { id: 'hexagono', name: 'HEXÁGONO', class: 'fig-hexagono' },
  { id: 'octagono', name: 'OCTÁGONO', class: 'fig-octagono' },
  { id: 'estrella', name: 'ESTRELLA', class: 'fig-estrella' },
  { id: 'cruz', name: 'CRUZ', class: 'fig-cruz' },
  { id: 'flecha', name: 'FLECHA', class: 'fig-flecha' },
  { id: 'corazon', name: 'CORAZÓN', class: 'fig-corazon' },
  { id: 'ovalo', name: 'ÓVALO', class: 'fig-ovalo' },
  { id: 'semicirculo', name: 'SEMICÍRCULO', class: 'fig-semicirculo' },
  { id: 'cubo', name: 'CUBO', class: 'fig-cubo' },
  { id: 'pyramid', name: 'PIRÁMIDE', class: 'fig-pyramid' },
  { id: 'cono', name: 'CONO', class: 'fig-cono' },
  { id: 'esfera', name: 'ESFERA', class: 'fig-sphere' },
  { id: 'cilindro', name: 'CILINDRO', class: 'fig-cylinder' }
];

const infiniteInventory = ref([]);

const generateInfiniteInventory = () => {
  let temp = [];
  for (let i = 0; i < 40; i++) {
    temp.push(...baseShapeInventory.map(item => ({ ...item, uniqueKey: `${item.id}-${i}` })));
  }
  infiniteInventory.value = temp;
};

const centerScrollSilently = () => {
  setTimeout(() => {
    if (shelfRef.value && shelfRef.value.children.length > 0) {
      const middleIndex = Math.floor(infiniteInventory.value.length / 2);
      const targetChild = shelfRef.value.children[middleIndex];
      const containerCenter = shelfRef.value.clientWidth / 2;
      const childCenter = targetChild.offsetLeft + (targetChild.offsetWidth / 2);
      shelfRef.value.scrollTo({
        left: childCenter - containerCenter,
        behavior: 'auto'
      });
    }
  }, 100);
};

const nextShapes = () => {
  if (shelfRef.value) shelfRef.value.scrollBy({ left: 220, behavior: 'smooth' });
};

const prevShapes = () => {
  if (shelfRef.value) shelfRef.value.scrollBy({ left: -220, behavior: 'smooth' });
};

onMounted(() => {
  shuffleChallenges();
  generateInfiniteInventory();
  centerScrollSilently(); 
  vocalizeIntro(); // Vocalización al inicio
});

// Limpieza: Asegura el cancel() al desmontar
onUnmounted(() => {
  window.speechSynthesis.cancel();
});

const currentChallenge = computed(() => {
  return randomizedChallenges.value[progress.value - 1] || allChallenges[0];
});

const playSound = (type) => {
  const sounds = {
    correct: '/audios/correct1.mp3',
    error: '/audios/wrong1.mp3',
    coins: '/audios/coins.mp3'
  };
  const audio = new Audio(sounds[type]);
  audio.play().catch(() => {});
};

const handleCloseSurgical = () => {
  if (currentStep.value === 2) {
    currentStep.value = 1;
  } else {
    emit('close');
  }
};

const handleSelection = (shapeId) => {
  if (showInTable.value || animatingId.value) return; 

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
    // Silencio en juego: Se elimina el speak() que estaba aquí.
    setTimeout(() => { animatingId.value = null; feedbackMessage.value = ""; }, 600);
  }
};

const calculateFinalPrize = () => {
  let mood = 'copper';
  let prizeName = 'Cobre';

  if (totalErrors.value === 0) {
    sessionCoins.value.gold = 1;
    mood = 'gold';
    prizeName = 'Oro Puro';
  } else if (totalErrors.value <= 3) {
    sessionCoins.value.silver = 1;
    mood = 'silver';
    prizeName = 'Plata';
  } else {
    sessionCoins.value.copper = 1;
  }
  
  currentStep.value = 3;
  showRain.value = true;
  playSound('coins');

  // Vocalización de Salida: Narra premio y botín
  const totalCoins = sessionCoins.value.gold + sessionCoins.value.silver + sessionCoins.value.copper;
  const endText = `¡Construcción finalizada Arquitecto! Has ganado la medalla de ${prizeName} con un botín de ${totalCoins} monedas. ¡Excelente trabajo!`;
  speak(endText, mood);
  
  setTimeout(() => {
    showRain.value = false;
  }, 3000);
};

const resetSession = () => {
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  progress.value = 1; 
  totalErrors.value = 0;
  currentStep.value = 2; 
  selectedShapeId.value = null;
  showInTable.value = false;
  showRain.value = false;
  shuffleChallenges();
  centerScrollSilently(); 
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

      <section v-if="currentStep === 1" class="game-content top-aligned animate-fade-in">
        <div class="welcome-card">
          <button @click="vocalizeIntro" class="btn-repeat-intro">
            <Volume2 size="24" />
          </button>

          <div class="hero-shape-container animate-float">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="hero-svg">
              <defs>
                <radialGradient id="gradSphere" cx="40%" cy="40%" r="65%">
                  <stop offset="0%" stop-color="#ffffff" />
                  <stop offset="50%" stop-color="#6366f1" />
                  <stop offset="100%" stop-color="#312e81" />
                </radialGradient>
                <linearGradient id="gradCube" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fcd34d" />
                  <stop offset="100%" stop-color="#d97706" />
                </linearGradient>
                <filter id="softShadow"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="2" dy="4"/><feComposite in2="SourceAlpha" operator="out"/><feFlood flood-color="black" flood-opacity="0.3"/><feComposite in2="SourceGraphic" operator="atop"/></filter>
              </defs>
              <circle cx="60" cy="140" r="45" fill="url(#gradSphere)" filter="url(#softShadow)" />
              <ellipse cx="45" cy="125" rx="15" ry="10" fill="white" fill-opacity="0.4" transform="rotate(-30, 45, 125)" />
              <path d="M110 40 L160 30 L180 60 L130 70 Z" fill="#fbbf24" />
              <path d="M110 40 L130 70 L130 120 L110 90 Z" fill="#d97706" />
              <path d="M130 70 L180 60 L180 110 L130 120 Z" fill="#f59e0b" />
              <path d="M110 40 L160 30 M130 70 L180 60" stroke="white" stroke-width="0.5" opacity="0.5" />
            </svg>
          </div>

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

          <button @click="currentStep = 2; centerScrollSilently()" class="btn-start">¡EMPEZAR A CONSTRUIR! <ChevronRight/></button>
        </div>
      </section>

      <section v-if="currentStep === 2" class="game-content">
        <div class="instruction-bubble">
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
                    <div class="shape-base" :class="baseShapeInventory.find(s => s.id === selectedShapeId)?.class"></div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <div class="inventory-navigator">
          <button @click="prevShapes" class="nav-arrow text-blue-500 hover:scale-110 transition">
            <ChevronLeft size="32" />
          </button>
          
          <div class="visible-shelf" ref="shelfRef">
            <div v-for="shape in infiniteInventory" :key="shape.uniqueKey" 
                 class="shape-card" :class="{ 'error-shake': animatingId === shape.id }"
                 @click="handleSelection(shape.id)">
              <div class="shape-preview-box">
                <div class="shape-base mini" :class="shape.class"></div>
              </div>
              <span class="shape-label">{{ shape.name }}</span>
            </div>
          </div>

          <button @click="nextShapes" class="nav-arrow text-blue-500 hover:scale-110 transition">
            <ChevronRight size="32" />
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
        <h1 class="chef-supremo-title">¡ARQUITECTO SUPREMO!</h1>

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
.game-content { display: flex; flex-direction: column; flex: 1; align-items: center; width: 100%; position: relative; z-index: 10; }
.center-vh { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 20px; }
.top-aligned { justify-content: flex-start; align-items: center; padding-top: 0px; margin-top: -50px; }

/* Botón Repetir Intro */
.btn-repeat-intro { position: absolute; top: 10px; right: 10px; background: #6366f1; color: white; border: none; padding: 10px; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; }
.btn-repeat-intro:active { transform: scale(0.9); }

.hero-shape-container { width: 160px; height: 160px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
.hero-svg { width: 100%; height: 100%; }
.animate-float { animation: float 3.5s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
.header-standard { padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background: #e2e8f0; transition: background 0.3s; position: relative; z-index: 1000; }
.header-standard.bg-transparent { background: transparent; }
.header-left { display: flex; align-items: center; gap: 15px; }
.trophy-box { background: #fef08a; border: 3px solid #fde047; border-radius: 12px; padding: 8px; display: flex; align-items: center; justify-content: center; }
.progress-text { font-weight: 900; font-size: 1.7rem; color: #1e3a8a; }
.session-loot-capsule { display: flex; align-items: center; background: #f1f5f9; border-radius: 9999px; padding: 8px 25px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); border: 2px solid #e2e8f0; }
.loot-item { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 1.2rem; color: #1e3a8a; }
.loot-item img { width: 1.4rem; height: 1.4rem; object-fit: contain; }
.stat-divider-sm { width: 2px; height: 20px; background: #cbd5e1; margin: 0 15px; }
.btn-close-circle { background: white; color: #1e3a8a; border: 2px solid #cbd5e1; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; position: relative; z-index: 1001; flex-shrink: 0; }
.welcome-card { width: 90%; max-width: 450px; margin: 0 auto; background: white; border-radius: 30px; padding: 30px; border: 2px solid #f1f5f9; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; display: flex; flex-direction: column; align-items: center; position: relative; }
.main-title { font-size: 1.9rem; font-weight: 900; color: #312e81; margin-bottom: 25px; }
.rules-container { text-align: left; margin-bottom: 30px; display: flex; flex-direction: column; gap: 15px; width: 100%; }
.rule-item { display: flex; gap: 15px; align-items: center; }
.rule-icon { padding: 10px; border-radius: 12px; flex-shrink: 0; }
.rule-text { display: flex; flex-direction: column; }
.rule-text strong { font-size: 0.9rem; color: #1e293b; }
.rule-text span { font-size: 0.8rem; color: #64748b; }
.btn-start { background: #3b82f6; color: white; width: 100%; padding: 18px; border-radius: 20px; font-weight: 900; border: none; box-shadow: 0 6px 0 #1d4ed8; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; font-size: 1rem; }
.instruction-bubble { width: 90%; background: #eff6ff; padding: 15px 20px; border-radius: 20px; display: flex; gap: 15px; align-items: center; border: 2px solid #dbeafe; margin: 10px auto; min-height: 60px; }
.blueprint-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px; width: 100%; }
.blueprint-table { width: 100%; max-width: 500px; height: 320px; background: #fff; border: 2px solid #dbeafe; border-radius: 30px; overflow: hidden; position: relative; }
.blueprint-grid { width: 100%; height: 100%; background-image: radial-gradient(#3b82f622 1.5px, transparent 1.5px); background-size: 20px 20px; display: flex; flex-direction: column; }
.blueprint-header { background: #3b82f6; color: white; font-size: 12px; font-weight: 900; text-align: center; padding: 8px; }
.stage-area { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; }
.shape-base { width: 100px; height: 100px; position: relative; transition: 0.3s; }
.shape-base.mini { transform: scale(0.45); }
.shape-base.ghost { border: 4px dashed #3b82f633; background: transparent !important; }

/* Figuras Geométricas */
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
.fig-pyramid { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); background: linear-gradient(90deg, #cbd5e1 50%, #475569 50%); }
.fig-paralelogramo { background: #ef4444; clip-path: polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%); width: 110px !important; height: 75px !important; }
.fig-trapecio { background: #34d399; clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%); width: 110px !important; height: 75px !important; }
.fig-cono { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); background: linear-gradient(90deg, #e5e7eb 0%, #9ca3af 40%, #4b5563 100%); }
.fig-semicirculo { background: #c084fc; border-radius: 50%; clip-path: inset(0 0 50% 0); }
.fig-cruz { background: #ef4444; clip-path: polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%); }
.fig-flecha { background: #bef264; clip-path: polygon(0% 35%, 50% 35%, 50% 15%, 100% 50%, 50% 85%, 50% 65%, 0% 65%); }
.fig-corazon { background: #ef4444; clip-path: polygon(50% 25%, 65% 5%, 85% 5%, 100% 25%, 100% 45%, 50% 100%, 0% 45%, 0% 25%, 15% 5%, 35% 5%); }
.fig-octagono { background: #f472b6; clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%); }
.fig-cubo { clip-path: polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%); background: conic-gradient(from 0deg at 50% 50%, #f1f5f9 0 60deg, #94a3b8 60deg 180deg, #475569 180deg 300deg, #f1f5f9 300deg 360deg); }

.inventory-navigator { background: #f8fafc; padding: 15px; border-top: 2px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; width: 100%; }
.visible-shelf { display: flex; gap: 12px; flex: 1; overflow-x: auto; scroll-behavior: smooth; scroll-snap-type: x mandatory; padding: 5px 0; -ms-overflow-style: none; scrollbar-width: none; }
.visible-shelf::-webkit-scrollbar { display: none; }
.nav-arrow { background: transparent; border: none; cursor: pointer; flex-shrink: 0; padding: 0 5px; }
.shape-card { flex-shrink: 0; scroll-snap-align: center; width: 95px; height: 105px; background: white; border-radius: 20px; border: 2px solid #e2e8f0; border-bottom-width: 5px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
.shape-preview-box { height: 50px; display: flex; align-items: center; justify-content: center; }
.shape-label { font-size: 9px; font-weight: 900; color: #475569; text-transform: uppercase; margin-top: 5px; text-align: center; }
.feedback-toast { position: absolute; top: 10%; padding: 8px 25px; border-radius: 50px; color: white; font-weight: 900; font-size: 11px; z-index: 10; }
.success { background: #10b981; }
.error { background: #ef4444; }
.error-shake { animation: shake 0.4s; border-color: #ef4444; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
.result-screen-dark { background: linear-gradient(135deg, #64748b 0%, #334155 100%); color: white; position: relative; }
.trophy-gold { color: #fbbf24; margin-bottom: 1rem; }
.chef-supremo-title { font-size: 2.1rem; font-weight: 900; font-style: italic; margin-bottom: 2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
.stats-capsule { background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 35px; padding: 20px 40px; display: flex; align-items: center; gap: 20px; margin-bottom: 3rem; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 50px; }
.stat-item img { width: 40px; height: 40px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); }
.stat-item span { font-weight: 900; font-size: 1.3rem; }
.stat-divider { width: 1px; height: 50px; background: rgba(255,255,255,0.15); }
.btn-terminar-3d { background: #3b82f6; color: white; font-size: 1.1rem; font-weight: 900; font-style: italic; padding: 16px 60px; border-radius: 30px; border: none; box-shadow: 0 8px 0 #1d4ed8, 0 15px 20px rgba(0,0,0,0.4); cursor: pointer; margin-bottom: 30px; text-transform: uppercase; transition: transform 0.1s, box-shadow 0.1s; }
.btn-repetir-text { background: transparent; color: #e2e8f0; font-weight: 800; font-size: 0.9rem; border: none; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; }
.coin-rain { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 10; }
.falling-coin { position: absolute; top: -50px; left: var(--pos); animation: fall 3s linear forwards; animation-delay: var(--delay); }
.falling-coin img { width: 30px; }
@keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
@media (min-width: 1024px) { 
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid #1e1b4b; margin: auto; } 
  .top-aligned { padding-top: 20px; margin-top: 0px; }
}
</style>