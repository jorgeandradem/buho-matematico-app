<template>
  <div class="device-container full-screen-mode">
    <div class="submarine-game-container">
      <div class="header-ui">
        <div class="stat-box">
          <span class="label">RACHA</span>
          <span class="value">{{ streak }}/10</span>
        </div>
        
        <div class="status-board-micro-large">
          <div class="coin-item-large">
            <img src="/images/coin-gold.png" alt="oro" class="img-coin-large" />
            <span class="txt-coin-large">{{ goldSession }}</span>
          </div>
          <div class="coin-item-large">
            <img src="/images/coin-silver.png" alt="plata" class="img-coin-large" />
            <span class="txt-coin-large">{{ silverSession }}</span>
          </div>
          <div class="coin-item-large">
            <img src="/images/coin-copper.png" alt="cobre" class="img-coin-large" />
            <span class="txt-coin-large">{{ bronzeSession }}</span>
          </div>
        </div>

        <button @click.prevent.stop="$emit('close')" class="exit-btn">
          <div class="circle-x">✕</div>
        </button>
      </div>

      <Transition name="fade">
        <div v-if="showRules" class="rules-overlay">
          
          <button @click.prevent.stop="$emit('close')" class="exit-btn-final">
            <div class="circle-x-final">✕</div>
          </button>

          <div class="rules-card">
            <div class="rules-icon">🌊</div>
            <h2 class="rules-title">REGLAS DEL RETO</h2>
            <ul class="rules-list">
              <li>🫧 Explota 10 burbujas para ganar</li>
              <li>➕ Suma: 1 🥉 | ➖ Resta: 5 🥉</li>
              <li>✖️ Multiplicar: 1 🥈 | ➗ Dividir: 1 🥇</li>
              <li>⚠️ Las monedas se resetean en cada racha</li>
            </ul>
            <button @click.prevent.stop="startGame" class="start-btn-entrar">ENTRAR</button>
          </div>
        </div>
      </Transition>

      <div class="equation-board">
        <div class="equation-badge">Nivel: {{ levelName }}</div>
        <h2 v-if="currentEquation" class="equation-text">
          <span v-html="formattedEquation"></span>
        </h2>
      </div>

      <div class="ocean-area" ref="ocean">
        <div 
          v-for="bubble in bubbles" 
          :key="bubble.id"
          class="bubble"
          :style="{ 
            left: bubble.x + 'px', 
            bottom: bubble.y + 'px', 
            width: bubble.size + 'px', 
            height: bubble.size + 'px',
            opacity: bubble.opacity 
          }"
          @pointerdown.prevent.stop="checkAnswer(bubble)"
        >
          {{ bubble.value }}
        </div>
      </div>

      <Transition name="fade">
        <div v-if="showSummary" class="summary-overlay-vibrant">
          <button @click.prevent.stop="$emit('close')" class="exit-btn-final">
            <div class="circle-x-final">✕</div>
          </button>

          <div class="summary-card-gold">
            <h1 class="summary-title">¡MISIÓN CUMPLIDA!</h1>
            <p class="summary-subtitle">Premios obtenidos en esta racha:</p>
            
            <div class="session-recap">
              <div class="recap-item">
                <img src="/images/coin-gold.png" class="recap-icon" />
                <span>{{ goldSession }}</span>
              </div>
              <div class="recap-item">
                <img src="/images/coin-silver.png" class="recap-icon" />
                <span>{{ silverSession }}</span>
              </div>
              <div class="recap-item">
                <img src="/images/coin-copper.png" class="recap-icon" />
                <span>{{ bronzeSession }}</span>
              </div>
            </div>

            <div class="final-coins">¡Racha Completada!</div>
            <button @click.prevent.stop="resetGame" class="continue-btn-gold">NUEVA RONDA</button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const emit = defineEmits(['close', 'update-coins']);

// --- ESTADO ---
const streak = ref(0);
const bubbles = ref([]);
const currentEquation = ref(null);
const showSummary = ref(false);
const showRules = ref(true);
const gameActive = ref(false);
let bubbleInterval = null;

const goldSession = ref(0);
const silverSession = ref(0);
const bronzeSession = ref(0);

const levelName = computed(() => {
  if (streak.value < 3) return 'Bronce (Sumas)';
  if (streak.value < 7) return 'Plata (Restas)';
  return 'Oro (Tablas)';
});

// Sonidos
const soundPop = new Audio(new URL('../assets/sounds/submarine/bubble_pop.mp3', import.meta.url).href);
const soundAmbient = new Audio(new URL('../assets/sounds/submarine/underwater_ambience.mp3', import.meta.url).href);
const soundCoins = new Audio('/audios/coins.mp3');

// X Caligráfica estilizada Blanca con Borde Dorado
const formattedEquation = computed(() => {
  if (!currentEquation.value) return '';
  return currentEquation.value.text.replace(/x/g, '<span class="chalk-x-container"><span class="chalk-x">x</span></span>');
});

const startGame = () => {
  showRules.value = false;
  gameActive.value = true;
  generateEquation();
  bubbleInterval = setInterval(spawnBubble, 1400);
  soundAmbient.play().catch(() => {});
};

const generateEquation = () => {
  let x, a, text, type;
  if (streak.value >= 7) {
    // Para divisiones evitamos que el divisor sea 0
    x = Math.floor(Math.random() * 9) + 1; // 1 al 9
    a = Math.floor(Math.random() * 9) + 1; // 1 al 9
    text = `${x * a} ÷ ${a} = x`;
    type = 'div';
  } else if (streak.value >= 4) {
    x = Math.floor(Math.random() * 10);
    // CIRUGÍA MATEMÁTICA: 'a' (multiplicador) genera del 1 al 9 (evita 0 x = 0)
    a = Math.floor(Math.random() * 9) + 1; 
    text = `${a} × x = ${a * x}`;
    type = 'multi';
  } else if (streak.value >= 2) {
    x = Math.floor(Math.random() * 20);
    a = Math.floor(Math.random() * 20);
    text = `${x + a} - x = ${a}`;
    type = 'sub';
  } else {
    x = Math.floor(Math.random() * 20);
    a = Math.floor(Math.random() * 20);
    text = `x + ${a} = ${x + a}`;
    type = 'add';
  }
  currentEquation.value = { text, answer: x, type };
};

const spawnBubble = () => {
  if (!gameActive.value || showSummary.value) return;
  const id = Date.now();
  const isCorrect = Math.random() > 0.7;
  const val = isCorrect ? currentEquation.value.answer : Math.floor(Math.random() * 40);
  
  bubbles.value.push({
    id, value: val, x: Math.random() * 280 + 20, y: 100, 
    size: 65, speed: 1.5 + (streak.value * 0.3), opacity: 1
  });
};

const animateBubbles = () => {
  if (gameActive.value) {
    bubbles.value.forEach((b, index) => {
      b.y += b.speed;
      if (b.y > window.innerHeight - 100) bubbles.value.splice(index, 1);
    });
  }
  requestAnimationFrame(animateBubbles);
};

const checkAnswer = (bubble) => {
  if (bubble.value === currentEquation.value.answer) {
    soundPop.play();
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    
    const opType = currentEquation.value.type;
    if (opType === 'add') bronzeSession.value += 1;
    else if (opType === 'sub') bronzeSession.value += 5;
    else if (opType === 'multi') silverSession.value += 1;
    else if (opType === 'div') goldSession.value += 1;

    streak.value++;
    bubbles.value = [];
    if (streak.value >= 10) endGame();
    else generateEquation();
  } else {
    if (navigator.vibrate) navigator.vibrate(200);
    bubble.opacity = 0.3;
  }
};

const endGame = () => {
  showSummary.value = true;
  gameActive.value = false;
  soundAmbient.pause();
  soundCoins.play().catch(() => {});
  emit('update-coins', 100); // Aquí ajustado al sistema original de coins
};

const resetGame = () => {
  streak.value = 0;
  goldSession.value = 0; silverSession.value = 0; bronzeSession.value = 0;
  bubbles.value = [];
  showSummary.value = false;
  gameActive.value = true;
  generateEquation();
  soundAmbient.play().catch(() => {});
};

onMounted(() => {
  animateBubbles();
  soundAmbient.loop = true;
  soundAmbient.volume = 0.3;
});

onBeforeUnmount(() => {
  clearInterval(bubbleInterval);
  soundAmbient.pause();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400&display=swap');

/* MODO PANTALLA COMPLETA TOTAL (Tapa el portal trasero) */
.full-screen-mode {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 99999 !important;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #020617; /* Fondo de respaldo oscuro por si falla el gradiente */
}

.submarine-game-container {
  width: 100%; max-width: 450px; height: 100%;
  background: linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%);
  position: relative; overflow: hidden; font-family: 'Inter', sans-serif;
  user-select: none; 
  border-radius: 0; /* Pantallas rectas, sin bordes curvos */
  -webkit-tap-highlight-color: transparent;
}

.header-ui { display: flex; justify-content: space-between; align-items: center; padding: 20px 15px 10px 15px; z-index: 100; position: relative; }

.status-board-micro-large {
  display: flex; gap: 12px; background: rgba(255, 255, 255, 0.95);
  padding: 8px 18px; border-radius: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}
.coin-item-large { display: flex; align-items: center; gap: 6px; }
.img-coin-large { width: 22px; height: 22px; object-fit: contain; }
.txt-coin-large { font-size: 14px; font-weight: 900; color: #1e293b; }

.stat-box { background: rgba(255, 255, 255, 0.1); padding: 8px 15px; border-radius: 15px; text-align: center; }
.label { font-size: 9px; color: #94a3b8; display: block; font-weight: 900; }
.value { font-weight: 900; color: white; font-size: 1.1rem; }

.exit-btn { background: none; border: none; cursor: pointer; padding: 0; outline: none; }
.circle-x { width: 42px; height: 42px; background: white; border-radius: 50%; color: #1e40af; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 15px rgba(0,0,0,0.4); }

/* X CALIGRÁFICA GIGANTE CENTRADA */
.chalk-x-container { display: inline-flex; align-items: center; height: 100%; vertical-align: middle; }
:deep(.chalk-x) {
  font-family: 'Caveat', cursive; color: #ffffff; font-size: 4.8rem;
  font-weight: 400; font-style: italic; filter: drop-shadow(0px 0px 2px #fbbf24) drop-shadow(0px 0px 1px #fbbf24);
  line-height: 1; display: inline-block; margin: 0 6px;
}

.equation-board { text-align: center; margin-top: 10px; z-index: 50; position: relative; }
.equation-badge { color: #38bdf8; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; }
.equation-text { background: rgba(15, 23, 42, 0.8); display: inline-flex; align-items: center; justify-content: center; min-height: 95px; padding: 5px 35px; border-radius: 20px; color: white; font-size: 2.2rem; font-weight: 900; border: 2px solid #38bdf8; }

.ocean-area { width: 100%; height: 65%; position: absolute; bottom: 0; }
.bubble {
  position: absolute;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(56, 189, 248, 0.2));
  border: 2px solid rgba(255, 255, 255, 0.6); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 900; font-size: 1.5rem;
  box-shadow: 0 0 15px rgba(255,255,255,0.2); cursor: pointer; transition: opacity 0.3s;
}

/* PORTADA: AZUL CLARO INTENSO CON BORDES DORADOS (Cirugía aplicada aquí) */
.rules-overlay { 
  position: absolute; inset: 0; 
  background: #38bdf8; /* Azul claro intenso y vibrante */
  border: 8px solid #fbbf24; /* Borde dorado en el fondo */
  box-sizing: border-box; /* Previene que el borde aumente el tamaño */
  z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; 
}

/* RECUADRO REGLAS: AZUL ORIGINAL */
.rules-card { 
  background: #1e293b; /* Azul oscuro original */
  width: 100%; padding: 30px; border-radius: 25px; text-align: center; 
  border: 2px solid #38bdf8; /* Borde cian submarino */
  box-shadow: 0 15px 35px rgba(0,0,0,0.4); 
}
.rules-icon { font-size: 3.5rem; margin-bottom: 15px; }
.rules-title { color: white; font-weight: 900; font-size: 1.6rem; margin-bottom: 20px; }
.rules-list { text-align: left; color: #cbd5e1; margin-bottom: 25px; font-weight: 600; font-size: 0.95rem; list-style: none; padding: 0; }
.rules-list li { margin-bottom: 12px; }

.start-btn-entrar {
  background: #38bdf8; color: #020617; width: 100%; padding: 16px; border-radius: 15px;
  font-weight: 900; font-size: 1.8rem; border: none; cursor: pointer;
  box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
}

/* PANTALLA FINAL: AZUL CLARO CON FUERZA */
.summary-overlay-vibrant {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}

/* TARJETA FINAL CON BORDES DORADOS */
.summary-card-gold {
  background: white; padding: 35px 25px; border-radius: 30px; text-align: center; width: 100%;
  border: 6px solid #fbbf24; /* Borde Dorado */
  box-shadow: 0 15px 40px rgba(0,0,0,0.3);
}

.summary-title { font-weight: 900; color: #1e3a8a; font-size: 1.8rem; margin-bottom: 5px; }
.summary-subtitle { color: #64748b; font-size: 0.9rem; font-weight: 700; margin-bottom: 20px; }

.session-recap { display: flex; justify-content: center; gap: 20px; margin-bottom: 25px; padding: 15px; background: #f1f5f9; border-radius: 20px; }
.recap-item { display: flex; flex-direction: column; align-items: center; gap: 5px; font-weight: 900; font-size: 1.2rem; color: #1e293b; }
.recap-icon { width: 35px; height: 35px; }

.exit-btn-final { position: absolute; top: 20px; right: 20px; z-index: 1100; background: none; border: none; cursor: pointer; padding: 0; outline: none; }
.circle-x-final { width: 48px; height: 48px; background: white; border-radius: 50%; color: #ef4444; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem; box-shadow: 0 4px 20px rgba(0,0,0,0.6); }

.final-coins { font-size: 1.2rem; font-weight: 900; color: #fbbf24; margin: 10px 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.2); }
.continue-btn-gold { background: #fbbf24; color: #020617; width: 100%; padding: 18px; border-radius: 15px; font-weight: 900; border: none; cursor: pointer; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>