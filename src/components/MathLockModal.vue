<script setup>
/**
 * ARCHIVO: MathLockModal.vue
 * NOTA INTERNA: MOTOR CERROJO MÁGICO v4.8 (TEXTO BAJADO + AUDIO GARANTIZADO)
 */
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { 
  Trophy, X, Zap, Lock, Coins, 
  RotateCcw, ChevronRight, Volume2 
} from 'lucide-vue-next';

// IMPORTACIÓN SEGURA PARA VITE
import vaultOpenSound from '@/assets/sounds/boveda/vault-open.mp3';

const emit = defineEmits(['close', 'success']);

// --- 1. MOTOR DE VOZ UNIFICADO (speak) ---
const speak = (text, mood = 'intro') => {
  if (!window.speechSynthesis) return;
  
  // Limpieza total antes de hablar
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';

  const configs = {
    intro:  { pitch: 1.0, rate: 1.0 },
    gold:   { pitch: 1.4, rate: 1.1 },
    silver: { pitch: 1.0, rate: 1.0 },
    copper: { pitch: 0.8, rate: 0.9 }
  };

  const config = configs[mood] || configs.intro;
  utterance.pitch = config.pitch;
  utterance.rate = config.rate;

  // Pequeño retraso de seguridad para que el navegador procese el cancel() y active el audio
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 60);
};

// Vocalización de Entrada
const vocalizeRules = () => {
  speak("¡Bienvenido a Cerrojo Mágico! Tu misión es resolver diez combinaciones matemáticas para abrir el gran cofre. ¡Demuestra tu agilidad mental!", "intro");
};

// --- 2. ESTADO DEL JUEGO Y MONEDAS ---
const gameState = ref('rules'); 
const progress = ref(0);
const totalErrors = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

// --- 3. LÓGICA DEL RETO ACTUAL ---
const currentChallenge = ref({ text: '', value: 0, type: '' });
const options = ref([]);
const selected = ref(null);
const isLocked = ref(false);
const isCorrect = ref(null); 

// --- 4. SISTEMA DE AUDIO SFX (INTACTO) ---
const playSound = (name, volume = 1, boost = false) => {
  const path = name === 'vault-open' ? vaultOpenSound : `/audios/${name}.mp3`;
  
  const playInstance = () => {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch((e) => console.warn("Error audio:", e));
  };

  playInstance();
  
  if (boost) {
    setTimeout(playInstance, 10);
    setTimeout(playInstance, 20);
  }
};

// --- 5. NAVEGACIÓN ---
const handleBackNavigation = () => {
  if (gameState.value === 'playing' || gameState.value === 'finished') {
    gameState.value = 'rules';
  } else {
    emit('close');
  }
};

// --- 6. GENERADOR DE DESAFÍOS (INTACTO) ---
const generateChallenge = async () => {
  selected.value = null;
  isCorrect.value = null;
  isLocked.value = false;
  await nextTick();

  const types = ['+', '-', 'x', '/'];
  const type = types[Math.floor(Math.random() * types.length)];
  let a, b, text, result;

  if (type === '+') { 
    a = Math.floor(Math.random() * 15) + 5; b = Math.floor(Math.random() * 15) + 5; 
    text = `${a}+${b}`; result = a + b; 
  } else if (type === '-') { 
    a = Math.floor(Math.random() * 20) + 15; b = Math.floor(Math.random() * 10) + 1; 
    text = `${a}-${b}`; result = a - b; 
  } else if (type === 'x') { 
    a = Math.floor(Math.random() * 9) + 2; b = Math.floor(Math.random() * 5) + 1; 
    text = `${a}x${b}`; result = a * b; 
  } else { 
    const divB = Math.floor(Math.random() * 5) + 2; result = Math.floor(Math.random() * 6) + 1; 
    const divA = divB * result; text = `${divA}÷${divB}`; 
  }

  currentChallenge.value = { text, value: result, type };
  const opts = [result];
  while (opts.length < 3) {
    const d = result + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    if (!opts.includes(d) && d >= 0) opts.push(d);
  }
  options.value = opts.sort(() => Math.random() - 0.5);
};

// --- 7. FLUJO DE JUEGO (INTACTO) ---
const startGame = () => {
  progress.value = 0;
  totalErrors.value = 0;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  gameState.value = 'playing';
  generateChallenge();
};

const handleCheck = (val) => {
  if (isLocked.value) return; 
  selected.value = val;
  isLocked.value = true; 
  
  if (val === currentChallenge.value.value) {
    isCorrect.value = true;
    playSound('vault-open', 1.0, true);
    
    if (currentChallenge.value.type === '+') sessionCoins.value.copper += 5;
    else if (currentChallenge.value.type === '-') sessionCoins.value.silver += 1;
    else sessionCoins.value.gold += 1;

    setTimeout(() => { 
      progress.value++;
      if (progress.value < 10) {
        generateChallenge();
      } else {
        triggerEndGame();
      }
    }, 1000);
  } else {
    isCorrect.value = false;
    playSound('wrong1', 0.5);
    totalErrors.value++;
    
    setTimeout(() => {
        isLocked.value = false;
        isCorrect.value = null;
        selected.value = null;
    }, 1500);
  }
};

const triggerEndGame = () => {
  gameState.value = 'finished';
  playSound('coins', 1.0);

  let mood = 'gold';
  let medalText = 'la medalla de oro';
  
  if (totalErrors.value > 2 && totalErrors.value <= 6) {
    mood = 'silver';
    medalText = 'la medalla de plata';
  } else if (totalErrors.value > 6) {
    mood = 'copper';
    medalText = 'la medalla de bronce';
  }

  const lootMsg = `¡Tesoro abierto! Has ganado ${medalText}. Tu botín final es de ${sessionCoins.value.gold} monedas de oro, ${sessionCoins.value.silver} de plata y ${sessionCoins.value.copper} de cobre. ¡Excelente trabajo!`;
  speak(lootMsg, mood);
};

// --- CICLO DE VIDA ---
onMounted(() => {
  if (gameState.value === 'rules') vocalizeRules();
});

onUnmounted(() => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
});

</script>

<template>
  <div class="master-container">
    <main class="app-canvas adventure-bg">
      
      <header class="header-standard shrink-0" :class="{ 'header-ghost': gameState === 'rules' }">
        <div class="trophy-section" :style="{ visibility: gameState !== 'rules' ? 'visible' : 'hidden' }">
          <Trophy size="22" class="text-yellow-500" />
          <span class="text-xl font-black text-indigo-900">{{ progress }}/10</span>
        </div>

        <div class="session-loot-capsule" :style="{ visibility: gameState !== 'rules' ? 'visible' : 'hidden' }">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>

        <button @click="handleBackNavigation" class="btn-close-circle">
          <X size="24" stroke-width="3" />
        </button>
      </header>

      <div v-if="gameState === 'rules'" class="game-content flex-1 flex flex-col items-center justify-start p-6 pt-2 animate-fade-in gap-4">
        
        <div class="chest-3d-epic animate-float -mt-6">
          <div class="chest-lid-epic">
            <div class="iron-band left"></div>
            <div class="iron-band right"></div>
          </div>
          <div class="chest-base-epic">
            <div class="iron-band left"></div>
            <div class="iron-band right"></div>
            <div class="chest-lock-epic">
                <div class="keyhole-epic"></div>
            </div>
          </div>
        </div>

        <h1 class="game-title-main">CERROJO<br/><span class="text-yellow-500">MÁGICO</span></h1>

        <div class="rules-panel shadow-2xl">
          <button @click="vocalizeRules" class="btn-speaker-rules">
            <Volume2 size="22" stroke-width="3" />
          </button>

          <div class="rules-badge uppercase font-black tracking-widest">Manual de Misión</div>
          
          <ul class="p-5 pt-14 space-y-3 text-slate-700 font-bold text-[13px] leading-tight">
            <li class="flex items-center gap-3">🗝️ <span>Resuelve 10 combinaciones para abrir el cofre.</span></li>
            <li class="flex items-center gap-3">🪙 <span>Sumas: 5 Cobre | Restas: 1 Plata | x / ÷: 1 Oro.</span></li>
            <li class="flex gap-2 text-red-600 bg-red-50 p-2 rounded-xl border border-red-100 mt-2">
                🚩 <span class="text-[10px] uppercase font-black">7+ errores reducen el premio al 50%.</span>
            </li>
          </ul>
        </div>

        <button @click="startGame" class="btn-start-expedition">
            ¡INICIAR EXPEDICIÓN! 
            <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                <ChevronRight class="text-[#1D4ED8]" size="22" stroke-width="4" />
            </div>
        </button>
      </div>

      <div v-else-if="gameState === 'playing'" class="game-content flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        <div class="game-card-view animate-slide-up shadow-2xl">
          
          <div :class="['challenge-banner transition-colors duration-300', 
            isCorrect === true ? 'theme-success shadow-success' : 
            isCorrect === false ? 'theme-error shadow-error' : 'theme-default']">
            
            <div class="energy-glow animate-energy"></div>
            
            <div class="flex items-center justify-center gap-6 relative z-10">
               
               <div :class="['chest-mini-wrap', { 'is-open': isCorrect === true }]">
                 <div class="chest-lid-mini">
                   <div class="iron-band-mini left"></div>
                   <div class="iron-band-mini right"></div>
                 </div>
                 <div class="chest-base-mini">
                   <div class="iron-band-mini left"></div>
                   <div class="iron-band-mini right"></div>
                   <div class="chest-lock-mini"><div class="keyhole-mini"></div></div>
                 </div>
               </div>

               <div :key="currentChallenge.text" class="math-text animate-slot">
                 {{ currentChallenge.text }}
               </div>
            </div>
          </div>

          <p class="instruction-label">¡Encuentra la combinación!</p>

          <div class="grid grid-cols-3 gap-3">
            <button v-for="opt in options" :key="opt" @click="handleCheck(opt)" :disabled="isLocked"
              :class="['btn-option-3d', 
                (opt === currentChallenge.value.value && isCorrect === true) ? 'theme-success text-white scale-105' : 
                (selected === opt && isCorrect === false) ? 'theme-error text-white animate-shake' : 'theme-neutral']">
              {{ opt }}
            </button>
          </div>
          
          <p class="hint-footer">TOCA LA COMBINACIÓN CORRECTA</p>
        </div>
      </div>

      <div v-else class="game-content flex-1 flex flex-col items-center justify-center p-6 bg-indigo-900/90 text-white relative overflow-hidden">
          
          <div class="coin-rain-overlay">
              <div v-for="n in 15" :key="n" class="coin-f" :style="`--d:${n*0.2}s; --l:${n*7}%` "></div>
          </div>

          <div class="trophy-bounce-box">
              <Trophy size="120" class="text-yellow-400 drop-shadow-2xl animate-bounce" />
          </div>
          
          <h2 class="text-4xl font-black italic mt-4">¡TESORO ABIERTO!</h2>
          
          <div class="final-loot-card shadow-2xl animate-pop-in">
              <h3 class="text-indigo-900 font-black text-[10px] uppercase tracking-widest mb-4">Botín de la Expedición</h3>
              <div class="flex justify-around w-full">
                  <div class="loot-stat"><img src="/images/coin-gold.png" class="w-10 h-10"/><span class="text-indigo-900 font-black">+{{sessionCoins.gold}}</span></div>
                  <div class="loot-stat border-x border-slate-100 px-6"><img src="/images/coin-silver.png" class="w-10 h-10"/><span class="text-indigo-900 font-black">+{{sessionCoins.silver}}</span></div>
                  <div class="loot-stat"><img src="/images/coin-copper.png" class="w-10 h-10"/><span class="text-indigo-900 font-black">+{{sessionCoins.copper}}</span></div>
              </div>
          </div>

          <div class="w-full max-w-[320px] flex flex-col gap-4 z-10">
              <button @click="startGame" class="btn-start-expedition !bg-emerald-500 !border-emerald-700 !w-full">
                REPETIR EXPEDICIÓN <RotateCcw class="ml-2" size="20" />
              </button>
              <button @click="emit('close')" class="font-black text-white/50 uppercase tracking-widest text-[11px] hover:text-white transition-colors">
                Terminar y Salir
              </button>
          </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; }
.app-canvas { display: flex; flex-direction: column; position: relative; overflow: hidden; width: 100vw; height: 100dvh; background-color: #60a5fa; transition: all 0.4s; }
.adventure-bg { background-image: url('https://googleusercontent.com/image_generation_content/1742475402000/995b2046-8653-4889-bc89-497793836d54/image_995b20.png'); background-size: cover; background-position: center; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }

/* SPEAKER BUTTON (DENTRO DEL PANEL DE REGLAS) */
.btn-speaker-rules {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #3b82f6;
  color: white;
  border: 3px solid white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.btn-speaker-rules:active { transform: scale(0.9); }

/* HEADER */
.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 100; transition: all 0.3s; }
.header-ghost { background: transparent !important; border-bottom: none !important; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; color: #1e3a8a; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.btn-close-circle { background: white; color: #ef4444; border: 2px solid #fca5a5; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); cursor: pointer; z-index: 110; }

/* COFRE 3D */
.chest-3d-epic { position: relative; width: 180px; height: 140px; perspective: 1000px; margin-bottom: 5px; }
.chest-lid-epic { position: absolute; top: 0; width: 180px; height: 70px; background: linear-gradient(180deg, #b45309 0%, #78350f 100%); border-radius: 90px 90px 0 0; border: 6px solid #451a03; border-bottom: 2px solid #1c1917; overflow: hidden; box-shadow: inset 0 10px 20px rgba(255,255,255,0.1); }
.chest-base-epic { position: absolute; bottom: 0; width: 180px; height: 70px; background: linear-gradient(0deg, #78350f 0%, #92400e 100%); border: 6px solid #451a03; border-top: none; border-radius: 0 0 15px 15px; box-shadow: 0 20px 30px rgba(0,0,0,0.4); overflow: hidden; }
.iron-band { position: absolute; width: 20px; height: 100%; background: #475569; border-left: 2px solid #94a3b8; border-right: 2px solid #1e293b; }
.iron-band.left { left: 30px; } .iron-band.right { right: 30px; }
.chest-lock-epic { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; background: radial-gradient(circle, #fde047 0%, #ca8a04 100%); border: 4px solid #713f12; border-radius: 8px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 8px rgba(0,0,0,0.5); z-index: 10; }
.keyhole-epic { width: 8px; height: 14px; background: #1c1917; border-radius: 3px; position: relative; }
.keyhole-epic::after { content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; background: #1c1917; border-radius: 50%; }

/* MINI COFRE */
.chest-mini-wrap { position: relative; width: 50px; height: 40px; perspective: 600px; z-index: 20; margin-top: 5px; }
.chest-lid-mini { position: absolute; top: 0; width: 100%; height: 20px; background: linear-gradient(180deg, #b45309 0%, #78350f 100%); border-radius: 25px 25px 0 0; border: 3px solid #451a03; border-bottom: 1px solid #1c1917; transform-origin: bottom; transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 2; }
.chest-mini-wrap.is-open .chest-lid-mini { transform: rotateX(110deg); }
.chest-base-mini { position: absolute; bottom: 0; width: 100%; height: 20px; background: linear-gradient(0deg, #78350f 0%, #92400e 100%); border: 3px solid #451a03; border-top: none; border-radius: 0 0 6px 6px; z-index: 1; }
.iron-band-mini { position: absolute; width: 6px; height: 100%; background: #475569; border-left: 1px solid #94a3b8; border-right: 1px solid #1e293b; }
.iron-band-mini.left { left: 8px; } .iron-band-mini.right { right: 8px; }
.chest-lock-mini { position: absolute; top: -5px; left: 50%; transform: translateX(-50%); width: 12px; height: 12px; background: radial-gradient(circle, #fde047 0%, #ca8a04 100%); border: 2px solid #713f12; border-radius: 3px; display: flex; justify-content: center; align-items: center; z-index: 10; }
.keyhole-mini { width: 2px; height: 4px; background: #1c1917; border-radius: 1px; position: relative; }
.keyhole-mini::after { content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: #1c1917; border-radius: 50%; }

/* PÁGINA FINAL */
.coin-rain-overlay { position: absolute; inset: 0; pointer-events: none; }
.coin-f { position: absolute; top: -50px; left: var(--l); width: 24px; height: 24px; background: #fbbf24; border: 2px solid #d97706; border-radius: 50%; animation: fall 3s linear infinite var(--d); }
@keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }
.final-loot-card { background: white; border-radius: 2.5rem; padding: 1.5rem; width: 100%; max-width: 380px; margin: 2rem 0; display: flex; flex-direction: column; align-items: center; }
.loot-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }

/* TEXTOS Y BOTONES (PORTADA) */
.game-title-main { font-size: 3.5rem; font-weight: 950; color: #1e1b4b; text-align: center; line-height: 0.9; font-style: italic; text-shadow: 3px 3px 0 #fff; margin-top: 10px; }
.rules-panel { 
  width: 95%; 
  max-width: 380px; 
  background: white; 
  border-radius: 2.5rem; 
  border: 2px solid #e2e8f0; 
  position: relative; 
  padding-bottom: 2rem; /* Crecimiento ligero hacia abajo */
}
.rules-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; font-size: 10px; font-weight: 900; padding: 4px 15px; border-radius: 9999px; }
.btn-start-expedition { width: 90%; max-width: 340px; background: #3b82f6; color: white; font-weight: 950; font-size: 1.3rem; padding: 1.2rem; border-radius: 2.5rem; border-bottom: 8px solid #1d4ed8; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(29,78,216,0.3); transition: 0.1s; cursor: pointer; }
.btn-start-expedition:active { transform: translateY(4px); border-bottom-width: 4px; }

/* JUEGO (CARD) */
.game-card-view { width: 95%; max-width: 380px; background: white; border-radius: 35px; padding: 25px; border-top: 8px solid #facc15; }
.challenge-banner { width: 100%; padding: 20px; border-radius: 25px; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; border: 4px solid transparent; }
.math-text { font-size: 3.5rem; font-weight: 950; color: #1e1b4b; font-style: italic; letter-spacing: -2px; }
.instruction-label { text-align: center; font-size: 13px; font-weight: 800; color: #64748b; margin: 15px 0; width: 100%; }
.btn-option-3d { height: 60px; border-radius: 16px; font-size: 1.8rem; font-weight: 900; border-bottom: 5px solid; border-top:none; border-left:none; border-right:none; cursor: pointer; transition: all 0.1s; }

/* 🎨 TEMAS DE COLOR */
.theme-default { background-color: #facc15 !important; border-color: #eab308 !important; }
.theme-success { background-color: #22c55e !important; border-color: #16a34a !important; }
.theme-error   { background-color: #ef4444 !important; border-color: #dc2626 !important; }
.theme-neutral { background-color: #f8fafc !important; border-color: #e2e8f0 !important; color: #1e293b !important; }
.theme-neutral:active { transform: translateY(3px); border-bottom-width: 2px; }

.shadow-success { box-shadow: 0 0 25px rgba(34, 197, 94, 0.5); }
.shadow-error   { box-shadow: 0 0 25px rgba(239, 68, 68, 0.5); }
.hint-footer { text-align: center; font-size: 10px; font-weight: 900; color: #94a3b8; margin-top: 15px; letter-spacing: 1px; text-transform: uppercase; }

/* ANIMACIONES */
.animate-float { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
.animate-slot { animation: slot 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes slot { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.animate-energy { animation: energy 2s linear infinite; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); }
@keyframes energy { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
.animate-shake { animation: shake 0.2s ease-in-out 3; }
</style>