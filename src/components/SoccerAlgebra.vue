<template>
  <div class="device-wrapper full-screen-mode" :style="{ backgroundColor: currentBg }">
    <div class="soccer-game-container">
      <div class="header-ui">
        <div class="stat-box">
          <span class="label">RACHA</span>
          <span class="value">{{ streak }}/10</span>
        </div>
        
        <div class="status-board-micro">
          <div class="coin-mini">
            <img src="/images/coin-gold.png" alt="oro" class="icon-mini" />
            <span class="val-mini">{{ goldSession }}</span>
          </div>
          <div class="coin-mini">
            <img src="/images/coin-silver.png" alt="plata" class="icon-mini" />
            <span class="val-mini">{{ silverSession }}</span>
          </div>
          <div class="coin-mini">
            <img src="/images/coin-copper.png" alt="cobre" class="icon-mini" />
            <span class="val-mini">{{ bronzeSession }}</span>
          </div>
        </div>

        <button @click.prevent.stop="$emit('close')" class="exit-btn">
          <div class="circle-x">✕</div>
        </button>
      </div>

      <Transition name="fade">
        <div v-if="showRules" class="rules-overlay">
          <div class="rules-card">
            <div class="rules-icon">⚽</div>
            <h2 class="rules-title">REGLAS DEL RETO</h2>
            <ul class="rules-list">
              <li>🥅 Anota 10 goles para completar la racha</li>
              <li>➕ Suma: 1 🥉 | ➖ Resta: 5 🥉</li>
              <li>✖️ Multiplicar: 1 🥈 | ➗ Dividir: 1 🥇</li>
              <li>⚠️ Las monedas se resetean en cada racha</li>
            </ul>
            <button @click.prevent.stop="startGame" class="start-btn">¡A LA CANCHA!</button>
          </div>
        </div>
      </Transition>

      <div class="scoreboard-container">
        <div class="equation-display">
          <span v-if="currentEquation" class="equation-text">
            <span v-html="formattedEquation"></span>
          </span>
        </div>
      </div>

      <div class="pitch" ref="gameArea">
        <div class="goal-area">
          <div class="goal-net"></div>
        </div>

        <div 
          v-for="ball in balls" 
          :key="ball.id"
          class="soccer-ball"
          :class="{ 'ball-kicked': ball.kicked }"
          :style="{ 
            left: ball.x + 'px', 
            bottom: ball.y + 'px',
            transform: `scale(${ball.scale}) rotate(${ball.rotation}deg)` 
          }"
          @pointerdown.prevent.stop="kickBall(ball)"
        >
          <div class="ball-number-wrapper">
            {{ ball.value }}
          </div>
        </div>
      </div>

      <Transition name="bounce">
        <div v-if="showSummary" class="summary-overlay">
          <button @click.prevent.stop="$emit('close')" class="exit-btn-final">
            <div class="circle-x-final">✕</div>
          </button>

          <div class="summary-card">
            <h1 class="summary-title">¡CAMPEÓN! 🏆</h1>
            <p class="summary-subtitle">Monedas ganadas en esta racha:</p>
            
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

            <div class="total-prize">¡Misión Cumplida!</div>
            <button @click.prevent.stop="resetGame" class="claim-btn">NUEVA RONDA</button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['close', 'update-coins']);
const gameArea = ref(null);

const streak = ref(0);
const balls = ref([]);
const currentEquation = ref(null);
const showSummary = ref(false);
const showRules = ref(true);

const goldSession = ref(0);
const silverSession = ref(0);
const bronzeSession = ref(0);

const soundKick = new Audio(new URL('../assets/sounds/soccer/kick.mp3', import.meta.url).href);
const soundGoal = new Audio(new URL('../assets/sounds/soccer/goal.mp3', import.meta.url).href);
const soundCoins = new Audio('/audios/coins.mp3');

const formattedEquation = computed(() => {
  if (!currentEquation.value) return '';
  return currentEquation.value.text.replace(/x/g, '<span class="chalk-x-container"><span class="chalk-x">x</span></span>');
});

const currentBg = computed(() => {
  if (streak.value < 3) return '#22c55e'; 
  if (streak.value < 7) return '#16a34a'; 
  return '#15803d'; 
});

const startGame = () => {
  showRules.value = false;
  generateChallenge();
};

const generateChallenge = () => {
  let x, a, text, type;
  if (streak.value >= 7) {
    x = Math.floor(Math.random() * 9) + 1;
    a = Math.floor(Math.random() * 9) + 1;
    text = `${x * a} ÷ ${a} = x`;
    type = 'div';
  } else if (streak.value >= 4) {
    x = Math.floor(Math.random() * 10);
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
  setTimeout(() => spawnBalls(x), 50);
};

const spawnBalls = (correctValue) => {
  const newBalls = [];
  const options = [correctValue];
  while(options.length < 3) {
    const wrong = Math.floor(Math.random() * 40);
    if (!options.includes(wrong)) options.push(wrong);
  }
  options.sort(() => Math.random() - 0.5);
  const containerWidth = gameArea.value ? gameArea.value.clientWidth : 400;
  
  options.forEach((val, i) => {
    const startX = (containerWidth / 4) * (i + 1) - 37;
    newBalls.push({
      id: i, 
      value: val, 
      x: startX, 
      originalX: startX, 
      y: 70, 
      scale: 1, 
      rotation: 0, 
      kicked: false
    });
  });
  balls.value = newBalls;
};

// SECUENCIA DE FÍSICAS MEJORADA
const kickBall = (ball) => {
  if (ball.kicked || showSummary.value || showRules.value) return;
  ball.kicked = true;
  soundKick.play();
  
  if (ball.value === currentEquation.value.answer) {
    // GOL: Vuela y empuja la malla (se hace más pequeño por la perspectiva)
    ball.y = window.innerHeight * 0.45;
    ball.scale = 0.4; 
    ball.rotation = 720;
    
    setTimeout(() => {
      // GOL: Rebota y cae suavemente dentro del arco
      ball.y = window.innerHeight * 0.38; 
      ball.scale = 0.35;
      
      soundGoal.play();
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      
      const opType = currentEquation.value.type;
      if (opType === 'add') bronzeSession.value += 1;
      else if (opType === 'sub') bronzeSession.value += 5;
      else if (opType === 'multi') silverSession.value += 1;
      else if (opType === 'div') goldSession.value += 1;
      
      streak.value++;
      
      setTimeout(() => {
        if (streak.value >= 10) endGame();
        else generateChallenge();
      }, 500); 
      
    }, 400); // 400ms es el tiempo que tarda la transición CSS en volar
    
  } else {
    // FALLA: El balón sale disparado erráticamente (arriba/izquierda/derecha)
    const missDirection = Math.random() > 0.5 ? 80 : -80;
    const missHeight = Math.random() > 0.5 ? 250 : 180;
    
    ball.y = missHeight; 
    ball.x += missDirection; 
    ball.scale = 0.5;
    ball.rotation = 1080; // Gira mucho más rápido
    if (navigator.vibrate) navigator.vibrate(200);
    
    // FASE 2: La gravedad actúa y el balón cae a la grama
    setTimeout(() => { 
      ball.y = 70; // Toca el piso de nuevo
      ball.scale = 0.8;
      
      // FASE 3: El balón rueda (se desliza) de vuelta a su punto de origen
      setTimeout(() => {
        ball.x = ball.originalX; 
        ball.scale = 1; 
        ball.rotation = 0;
        ball.kicked = false; // Ya puede volver a ser pateado
      }, 300);

    }, 400);
  }
};

const endGame = () => {
  showSummary.value = true;
  soundCoins.play().catch(() => {});
  emit('update-coins', { gold: goldSession.value, silver: silverSession.value, bronze: bronzeSession.value });
};

const resetGame = () => {
  streak.value = 0;
  goldSession.value = 0; silverSession.value = 0; bronzeSession.value = 0;
  showSummary.value = false;
  generateChallenge();
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400&display=swap');

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
  transition: background-color 0.8s ease;
}

.soccer-game-container { 
  width: 100%; 
  max-width: 450px; 
  height: 100%; 
  position: relative; 
  overflow: hidden; 
  font-family: 'Inter', sans-serif; 
  border-radius: 0; 
  user-select: none; 
  -webkit-tap-highlight-color: transparent; 
}

.header-ui { display: flex; justify-content: space-between; align-items: center; padding: 20px 20px 10px 20px; z-index: 50; position: relative; }

.status-board-micro { 
  display: flex; 
  align-items: center;
  justify-content: center;
  gap: 12px; 
  background: #f8fafc; 
  padding: 8px 24px; 
  border-radius: 50px; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.15); 
}
.coin-mini { display: flex; align-items: center; gap: 6px; }
.icon-mini { width: 20px; height: 20px; object-fit: contain; }
.val-mini { font-size: 16px; font-weight: 900; color: #1e293b; }

.stat-box { background: rgba(0,0,0,0.4); padding: 5px 10px; border-radius: 12px; color: white; text-align: center; }
.label { font-size: 8px; display: block; font-weight: 800; text-transform: uppercase; }
.value { font-weight: 900; font-size: 1rem; }

.exit-btn { background: none; border: none; cursor: pointer; padding: 0; outline: none; }
.circle-x { width: 36px; height: 36px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #16a34a; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }

.chalk-x-container { display: inline-flex; align-items: center; height: 100%; vertical-align: middle; }
:deep(.chalk-x) {
  font-family: 'Caveat', cursive; color: #ffffff; font-size: 4.5rem;
  font-weight: 400; font-style: italic; filter: drop-shadow(0px 0px 2px #fbbf24) drop-shadow(0px 0px 1px #fbbf24);
  line-height: 1; display: inline-block; margin: 0 4px;
}

.scoreboard-container { display: flex; justify-content: center; padding: 0 20px; margin-top: 15px; }
.equation-display { background: #1a1a1a; padding: 5px 35px; border: 4px solid #333; border-radius: 16px; box-shadow: 0 8px 0 #000; min-height: 90px; display: flex; align-items: center; }
.equation-text { color: #fcd34d; font-size: 2.2rem; font-weight: 900; letter-spacing: 2px; display: flex; align-items: center; justify-content: center; width: 100%; }

.pitch { 
  position: absolute; 
  bottom: 0; 
  width: 100%; 
  height: 60%; 
  perspective: 1000px; 
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 40px,
    rgba(0, 0, 0, 0.05) 40px,
    rgba(0, 0, 0, 0.05) 80px
  );
  border-top: 3px solid rgba(255,255,255,0.6); 
}

.goal-area { 
  width: 75%; 
  height: 140px; 
  border: 8px solid white; 
  border-bottom: none; 
  margin: 0 auto; 
  position: relative; 
  
  background-image:
    linear-gradient(45deg, rgba(255,255,255,0.7) 1px, transparent 1px),
    linear-gradient(-45deg, rgba(255,255,255,0.7) 1px, transparent 1px);
  background-size: 16px 16px;
  
  transform: rotateX(20deg);
  transform-origin: bottom center;
  box-shadow: inset 0 40px 60px rgba(0,0,0,0.5);
  border-radius: 4px 4px 0 0;
}

.goal-area::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: rgba(255,255,255,0.4);
}

.soccer-ball { 
  position: absolute; 
  width: 75px; 
  height: 75px; 
  background: #ffffff; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="%232563eb" d="M50 16l14 10-5 16H41l-5-16zM15 42l16 5 5 15-11 11-15-10zM85 42l-16 5-5 15 11 11 15-10zM50 86l14-10-5-16H41l-5 16z"/><path fill="none" stroke="%2394a3b8" stroke-width="1.5" d="M50 16V0M64 26l18-12M36 26L18 14M41 42l-10 6M59 42l10 6M41 68l-10-6M59 68l10-6"/></svg>');
  background-size: cover;
  box-shadow: inset -10px -12px 25px rgba(0,0,0,0.5), inset 5px 5px 15px rgba(255,255,255,1), 0 8px 15px rgba(0,0,0,0.3);
  /* Transición fluida para que los rebotes se vean como física real */
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); 
  cursor: pointer; 
  border: 2px solid #2563eb;
}

.ball-number-wrapper {
  background: rgba(255, 255, 255, 0.95);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900; 
  font-size: 1.6rem; 
  color: #1e3a8a; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  z-index: 2;
  border: 2px solid #e2e8f0;
}

.ball-kicked { pointer-events: none; }

.rules-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.95); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.rules-card { background: #1e293b; width: 100%; padding: 30px; border-radius: 25px; text-align: center; border: 2px solid #22c55e; }
.rules-icon { font-size: 3.5rem; margin-bottom: 15px; }
.rules-title { color: white; font-weight: 900; font-size: 1.6rem; margin-bottom: 20px; }
.rules-list { text-align: left; color: #cbd5e1; margin-bottom: 25px; font-weight: 600; font-size: 0.95rem; list-style: none; }
.rules-list li { margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.start-btn { background: #22c55e; color: white; width: 100%; padding: 16px; border-radius: 15px; font-weight: 900; border: none; font-size: 1.1rem; cursor: pointer; }

.summary-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.95); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.summary-card { background: white; width: 100%; padding: 40px 20px; border-radius: 32px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.summary-title { font-weight: 900; color: #16a34a; font-size: 2.2rem; margin-bottom: 5px; }
.summary-subtitle { color: #64748b; font-size: 0.9rem; font-weight: 700; margin-bottom: 20px; }

.session-recap { display: flex; justify-content: center; gap: 20px; margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 20px; }
.recap-item { display: flex; flex-direction: column; align-items: center; gap: 5px; font-weight: 900; font-size: 1.2rem; color: #1e293b; }
.recap-icon { width: 40px; height: 40px; }

.exit-btn-final { position: absolute; top: 20px; right: 20px; z-index: 1100; background: none; border: none; cursor: pointer; padding: 0; outline: none;}
.circle-x-final { width: 48px; height: 48px; background: white; border-radius: 50%; color: #ef4444; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem; box-shadow: 0 4px 20px rgba(0,0,0,0.6); }

.total-prize { font-size: 1.2rem; font-weight: 900; color: #f59e0b; margin: 10px 0; }
.claim-btn { background: #16a34a; color: white; width: 100%; padding: 18px; border-radius: 20px; font-weight: 900; font-size: 1.2rem; border: none; box-shadow: 0 6px 0 #14532d; cursor: pointer; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>