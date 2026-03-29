<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Trophy, X, ChevronRight, ShoppingCart, Banknote, RotateCcw, Home, Volume2, Undo2, Coins } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';
import CoinRain from './CoinRain.vue';

const emit = defineEmits(['close']);
const gamification = useGamificationStore();

// --- ESTADOS DEL JUEGO ---
const currentStep = ref(1); 
const progress = ref(0); 
const maxProgress = 12;
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

const itemPrice = ref(0);
const paidWith = ref(0);
const currentChangeAccumulated = ref(0);

const isPrinting = ref(false);
const isDrawerOpen = ref(false);
const feedback = ref('idle'); 
const activeTab = ref('monedas'); // 'monedas' o 'billetes'

// Lógica de dificultad visual para la moneda de la lluvia final
const bestCoinType = computed(() => {
  if (sessionCoins.value.gold > 0) return 'gold';
  if (sessionCoins.value.silver > 0) return 'silver';
  return 'copper';
});

const expectedChange = computed(() => {
  return parseFloat((paidWith.value - itemPrice.value).toFixed(2));
});

// Pantalla de Ayuda Dinámica
const difference = computed(() => {
  return parseFloat((expectedChange.value - currentChangeAccumulated.value).toFixed(2));
});

// --- MOTOR DE VOZ ---
const speak = (text, state = 'intro') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); 

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';

  switch (state) {
    case 'gold': utterance.pitch = 1.2; utterance.rate = 1.1; break;
    case 'silver': utterance.pitch = 1.0; utterance.rate = 1.0; break;
    case 'copper': utterance.pitch = 0.9; utterance.rate = 0.95; break;
    case 'intro': default: utterance.pitch = 1.0; utterance.rate = 1.0; break;
  }

  window.speechSynthesis.speak(utterance);
};

const playIntroVoice = () => {
  speak("Mercado de Decimales. Lee la pantalla visual para saber cuánto te han pagado y cuánto cuesta el producto. Abre la gaveta, navega entre Monedas y Billetes, y devuelve el cambio exacto. A trabajar", 'intro');
};

// --- EFECTOS DE SONIDO ---
const playSound = (type) => {
  try {
    let src = '';
    if (type === 'coin') src = '/audios/coin-drop.mp3'; 
    if (type === 'print') src = '/audios/receipt-print.mp3'; 
    if (type === 'success') src = '/audios/cash-register.mp3'; 
    if (type === 'error') src = '/audios/lightning.mp3';
    
    if (src) {
      const audio = new Audio(src);
      audio.play().catch(e => console.log('Sonido no encontrado.', e));
    }
  } catch (e) {}
};

// --- LÓGICA DE PARTIDA (12 NIVELES) ---
const generateNewSale = () => {
  let maxPaid;
  
  // Lote 1 (0 a 3): Monedas pequeñas
  if (progress.value < 4) {
    const options = [1, 2, 5];
    maxPaid = options[Math.floor(Math.random() * options.length)];
  } 
  // Lote 2 (4 a 7): Billetes medios
  else if (progress.value < 8) {
    const options = [10, 20, 50];
    maxPaid = options[Math.floor(Math.random() * options.length)];
  } 
  // Lote 3 (8 a 11): Billetes grandes
  else {
    const options = [100, 200, 500];
    maxPaid = options[Math.floor(Math.random() * options.length)];
  }
  
  paidWith.value = maxPaid;
  
  let min = 0.01;
  let max = maxPaid - 0.01;
  let rawPrice = (Math.random() * (max - min) + min).toFixed(2);
  itemPrice.value = parseFloat(rawPrice);
  
  currentChangeAccumulated.value = 0;
  
  isPrinting.value = true;
  playSound('print');
  setTimeout(() => { isPrinting.value = false; }, 600);
};

const addMoney = (amount) => {
  playSound('coin');
  currentChangeAccumulated.value = parseFloat((currentChangeAccumulated.value + amount).toFixed(2));
  
  if (currentChangeAccumulated.value === expectedChange.value) {
    handleCorrect();
  } else if (currentChangeAccumulated.value > expectedChange.value) {
    // Si se pasa, marca error visual y sonoro, pero NO lo devuelve a 0
    feedback.value = 'error';
    playSound('error');
  } else {
    // Si deshace el error y vuelve a estar por debajo, quita la alerta roja
    feedback.value = 'idle';
  }
};

const undoMoney = () => {
  currentChangeAccumulated.value = 0;
  feedback.value = 'idle'; // Regresa el recibo a color normal
};

const handleCorrect = () => {
  feedback.value = 'correct';
  isDrawerOpen.value = true;
  playSound('success');

  const rewardsMap = [
    { copper: 1 }, { copper: 1 }, { copper: 1 }, { copper: 2 }, 
    { silver: 0 }, { silver: 0 }, { silver: 0 }, { silver: 1 }, 
    { gold: 0 },   { gold: 0 },   { gold: 0 },   { gold: 1 }    
  ];
  
  const reward = rewardsMap[progress.value];
  if (reward.copper) sessionCoins.value.copper += reward.copper;
  if (reward.silver) sessionCoins.value.silver += reward.silver;
  if (reward.gold) sessionCoins.value.gold += reward.gold;

  setTimeout(() => {
    isDrawerOpen.value = false;
    if (progress.value < maxProgress - 1) {
      progress.value++;
      feedback.value = 'idle';
      generateNewSale();
    } else {
      progress.value = maxProgress;
      finishGame();
    }
  }, 1500);
};

const finishGame = () => {
  gamification.addCoins('copper', sessionCoins.value.copper);
  gamification.addCoins('silver', sessionCoins.value.silver);
  gamification.addCoins('gold', sessionCoins.value.gold);
  currentStep.value = 3;
  speak(`¡Negocio redondo! Has ganado ${sessionCoins.value.gold} oros, ${sessionCoins.value.silver} platas y ${sessionCoins.value.copper} cobres.`, bestCoinType.value);
};

const startGame = () => {
  window.speechSynthesis.cancel(); 
  currentStep.value = 2;
  generateNewSale();
};

const resetGame = () => {
  progress.value = 0;
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  currentStep.value = 1;
  playIntroVoice();
};

const handleClose = () => {
  window.speechSynthesis.cancel();
  if (currentStep.value === 2) {
    currentStep.value = 1; 
    playIntroVoice();
  } else {
    emit('close'); 
  }
};

onMounted(() => playIntroVoice());
onUnmounted(() => window.speechSynthesis.cancel());
</script>

<template>
  <div class="master-container">
    <main class="app-canvas steampunk-bg">
      
      <div v-if="currentStep === 3">
        <CoinRain :type="bestCoinType" :count="40" />
      </div>

      <header class="header-standard shrink-0 z-10 relative !py-2">
        <template v-if="currentStep !== 1">
          <div class="trophy-section flex items-center gap-2 animate-fade-in">
            <Trophy size="22" class="text-amber-700 drop-shadow-sm" />
            <span class="text-xl font-black text-amber-900">{{ progress }}/{{ maxProgress }}</span>
          </div>

          <div class="session-loot-capsule animate-fade-in">
            <div class="loot-item"><img src="/images/coin-gold.png" alt="Oro" /><span>{{ sessionCoins.gold }}</span></div>
            <div class="loot-item border-x border-amber-300"><img src="/images/coin-silver.png" alt="Plata" /><span>{{ sessionCoins.silver }}</span></div>
            <div class="loot-item"><img src="/images/coin-copper.png" alt="Cobre" /><span>{{ sessionCoins.copper }}</span></div>
          </div>
        </template>
        
        <div v-else class="flex-1"></div>

        <button @click="handleClose" class="btn-close-circle p-2 bg-white/50 rounded-full text-slate-800 hover:text-red-500 hover:bg-white transition-all backdrop-blur-sm shadow-sm">
          <X size="20" stroke-width="3" />
        </button>
      </header>

      <div v-if="currentStep === 1" class="game-content flex-1 flex flex-col items-center justify-start pt-2 pb-2 px-4 animate-fade-in z-10 relative">
        <div class="text-center mt-2">
          
          <div class="css-3d-cart-wrapper mb-3">
             <div class="css-3d-cart">
               <div class="cart-basket"></div>
               <div class="cart-handle"></div>
               <div class="cart-wheel wheel-left"></div>
               <div class="cart-wheel wheel-right"></div>
             </div>
          </div>

          <h1 class="game-title text-amber-900 drop-shadow-sm leading-none">Mercado de Decimales</h1>
          <p class="text-amber-700 font-bold text-[10px] sm:text-xs tracking-widest uppercase mt-2 bg-amber-100/50 inline-block px-3 py-1 rounded-full border border-amber-200">Cambio Steampunk</p>
        </div>
        
        <div class="rules-panel shadow-2xl bg-white/95 backdrop-blur-sm border-amber-800 border-4 w-full max-w-sm mt-6 flex-1 max-h-[30vh] flex flex-col">
          <div class="rules-badge bg-amber-800 flex justify-between items-center w-full px-4 box-border left-0 top-[-14px]">
            <span>INSTRUCCIONES DE LA BÓVEDA</span>
            <button @click="playIntroVoice" class="text-amber-200 hover:text-white transition-colors active:scale-90">
              <Volume2 size="16" />
            </button>
          </div>
          <div class="rules-grid p-4 space-y-5 mt-2 text-slate-700 font-medium overflow-y-auto custom-scrollbar flex-1">
            <div class="flex items-center gap-4">
              <div class="icon-gear shrink-0"><ShoppingCart size="20" class="text-amber-700" /></div>
              <p class="text-xs sm:text-sm leading-tight">Mira la pantalla electrónica para ver el precio y el billete de pago.</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="icon-gear shrink-0"><Banknote size="20" class="text-emerald-700" /></div>
              <p class="text-xs sm:text-sm leading-tight">Selecciona monedas o billetes en la gaveta para entregar el cambio exacto.</p>
            </div>
          </div>
        </div>

        <button @click="startGame" class="btn-steampunk w-full max-w-sm mt-6 mb-8 flex justify-center items-center gap-2 text-lg shrink-0">
          ABRIR MERCADO <ChevronRight stroke-width="3" />
        </button>
      </div>

      <div v-if="currentStep === 2" class="game-content flex-1 flex flex-col items-center justify-center py-2 animate-fade-in z-10 relative w-full">
        
        <div class="pos-system w-full max-w-[360px] relative flex flex-col items-end px-2 pb-6 pt-6">
           
           <div class="mechanical-arm"></div>

           <div class="led-monitor relative z-20 w-[82%] bg-zinc-900 border-[6px] border-zinc-700 rounded-xl p-3 mb-14 shadow-[0_15px_30px_rgba(0,0,0,0.4)] mr-1">
              <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:100%_3px] pointer-events-none"></div>
              
              <div class="flex justify-between items-center mb-1">
                 <p class="text-emerald-400 font-mono text-[9px] tracking-widest uppercase">COBRO #{{ progress + 1 }}</p>
                 <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              
              <p class="text-emerald-300 font-mono text-[13px] leading-snug">
                Total: <strong class="text-white ml-1">{{ itemPrice.toFixed(2) }}€</strong><br>
                Pagó:  <strong class="text-white ml-2">{{ paidWith.toFixed(2) }}€</strong><br>
              </p>
           </div>

           <div class="register-machine relative w-full transition-transform duration-300 z-20" :class="{'translate-y-2': isDrawerOpen}">
             
             <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-t-lg border-x-4 border-t-4 border-amber-900 z-30"></div>
             
             <div class="thermal-receipt absolute -top-14 left-1/2 -translate-x-1/2 w-48 transition-transform duration-[600ms] ease-out z-10" 
                  :class="{'translate-y-4 opacity-0': isPrinting}">
               <div class="flex justify-between items-center font-mono font-black text-xl p-2 rounded-md border-2 transition-colors duration-300 shadow-sm"
                    :class="{
                      'bg-slate-50 text-slate-600 border-slate-200': feedback === 'idle',
                      'bg-green-100 text-green-700 border-green-500': feedback === 'correct',
                      'bg-red-100 text-red-700 border-red-500 animate-shake': feedback === 'error'
                    }">
                 <span class="text-sm">CAMBIO:</span> 
                 <div class="flex items-center gap-1">
                   <span :class="{'text-red-600': feedback === 'error'}">{{ currentChangeAccumulated.toFixed(2) }}€</span>
                   <button v-if="currentChangeAccumulated > 0" @click.stop="undoMoney" class="text-slate-400 hover:text-red-600 active:scale-90 ml-1 transition-colors">
                     <Undo2 size="18" />
                   </button>
                 </div>
               </div>
             </div>

             <div class="drawer-casing mt-8 relative z-30 transition-all duration-300" :class="{'translate-y-4 scale-[1.01]': isDrawerOpen}">
                
                <div class="bg-zinc-900 border-2 border-zinc-700 rounded p-1.5 mb-3 text-center mx-3 shadow-inner">
                  <span v-if="difference > 0" class="text-amber-400 font-mono text-[14px] font-bold tracking-widest uppercase">Faltan: {{ difference.toFixed(2) }}€</span>
                  <span v-else-if="difference < 0" class="text-red-400 font-mono text-[10px] font-bold tracking-widest uppercase animate-pulse">Sobran: {{ Math.abs(difference).toFixed(2) }}€ (DESHACER)</span>
                  <span v-else-if="difference === 0 && currentChangeAccumulated > 0" class="text-emerald-400 font-mono text-[10px] font-bold tracking-widest uppercase">¡Cambio Exacto!</span>
                  <span v-else class="text-zinc-500 font-mono text-[10px] font-bold tracking-widest uppercase">Ingresa el Cambio</span>
                </div>

                <div class="flex gap-2 mb-2 px-2">
                  <button @click="activeTab = 'monedas'" class="flex-1 py-1.5 font-black text-xs rounded-t-lg transition-colors border-t-2 border-x-2"
                    :class="activeTab === 'monedas' ? 'bg-[#5c3a18] text-amber-300 border-amber-700' : 'bg-[#451a03] text-amber-900 border-[#451a03]'">
                    <Coins size="14" class="inline mr-1" /> MONEDAS
                  </button>
                  <button @click="activeTab = 'billetes'" class="flex-1 py-1.5 font-black text-xs rounded-t-lg transition-colors border-t-2 border-x-2"
                    :class="activeTab === 'billetes' ? 'bg-[#5c3a18] text-amber-300 border-amber-700' : 'bg-[#451a03] text-amber-900 border-[#451a03]'">
                    <Banknote size="14" class="inline mr-1" /> BILLETES
                  </button>
                </div>

                <div v-if="activeTab === 'monedas'" class="coin-drawer">
                   <button @click="addMoney(0.01)" :disabled="feedback === 'correct'" class="euro-coin coin-copper">1c</button>
                   <button @click="addMoney(0.02)" :disabled="feedback === 'correct'" class="euro-coin coin-copper">2c</button>
                   <button @click="addMoney(0.05)" :disabled="feedback === 'correct'" class="euro-coin coin-copper">5c</button>
                   <button @click="addMoney(0.10)" :disabled="feedback === 'correct'" class="euro-coin coin-gold">10c</button>
                   
                   <button @click="addMoney(0.20)" :disabled="feedback === 'correct'" class="euro-coin coin-gold">20c</button>
                   <button @click="addMoney(0.50)" :disabled="feedback === 'correct'" class="euro-coin coin-gold">50c</button>
                   <button @click="addMoney(1.00)" :disabled="feedback === 'correct'" class="euro-coin coin-1euro">1€</button>
                   <button @click="addMoney(2.00)" :disabled="feedback === 'correct'" class="euro-coin coin-2euro">2€</button>
                </div>

                <div v-if="activeTab === 'billetes'" class="bill-drawer">
                   <button @click="addMoney(5.00)" :disabled="feedback === 'correct'" class="euro-bill bg-slate-400">5€</button>
                   <button @click="addMoney(10.00)" :disabled="feedback === 'correct'" class="euro-bill bg-red-400">10€</button>
                   <button @click="addMoney(20.00)" :disabled="feedback === 'correct'" class="euro-bill bg-blue-400">20€</button>
                   <button @click="addMoney(50.00)" :disabled="feedback === 'correct'" class="euro-bill bg-orange-400">50€</button>
                   <button @click="addMoney(100.00)" :disabled="feedback === 'correct'" class="euro-bill bg-green-500">100€</button>
                   <button @click="addMoney(200.00)" :disabled="feedback === 'correct'" class="euro-bill bg-yellow-500 text-yellow-900">200€</button>
                   <button @click="addMoney(500.00)" :disabled="feedback === 'correct'" class="euro-bill bg-purple-500 col-span-3">500€</button>
                </div>

             </div>
             
             <div class="absolute -bottom-3 left-4 right-4 h-3 bg-amber-950 rounded-b-xl opacity-50 z-0"></div>
           </div>

        </div>
      </div>

      <div v-if="currentStep === 3" class="game-content result-screen flex-1 flex flex-col items-center justify-center py-6 px-4 animate-fade-in z-10 relative">
        <h1 class="text-4xl font-black text-amber-900 mb-8 italic drop-shadow-md text-center uppercase tracking-tighter">¡NEGOCIO REDONDO!</h1>
        
        <div class="final-loot-display flex gap-6 mb-12 bg-white/80 p-6 rounded-[2.5rem] shadow-2xl border-4 border-amber-300 backdrop-blur-sm">
            <div v-if="sessionCoins.gold > 0" class="loot-big gold-glow flex flex-col items-center gap-2">
              <img src="/images/coin-gold.png" class="w-16 h-16 animate-bounce-slow" />
              <span class="text-2xl font-black text-amber-500">+{{ sessionCoins.gold }}</span>
            </div>
            <div v-if="sessionCoins.silver > 0" class="loot-big silver-glow flex flex-col items-center gap-2">
              <img src="/images/coin-silver.png" class="w-16 h-16 animate-bounce-slow" style="animation-delay: 0.1s" />
              <span class="text-2xl font-black text-slate-400">+{{ sessionCoins.silver }}</span>
            </div>
            <div v-if="sessionCoins.copper > 0" class="loot-big copper-glow flex flex-col items-center gap-2">
              <img src="/images/coin-copper.png" class="w-16 h-16 animate-bounce-slow" style="animation-delay: 0.2s" />
              <span class="text-2xl font-black text-amber-700">+{{ sessionCoins.copper }}</span>
            </div>
        </div>

        <div class="action-buttons flex flex-col w-full max-w-xs gap-4 mb-8 shrink-0">
          <button @click="resetGame" class="w-full py-4 bg-white border-4 border-amber-300 text-amber-800 rounded-2xl font-black text-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3">
            <RotateCcw stroke-width="3" /> OTRA RACHA
          </button>
          <button @click="handleClose" class="btn-steampunk w-full flex items-center justify-center gap-3 text-lg">
            <Home stroke-width="3" /> AL PORTAL
          </button>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* CONTENEDOR MAESTRO */
.master-container {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; justify-content: center; align-items: center;
  background-color: #f1f5f9; overflow: hidden; touch-action: none !important;
}

.app-canvas {
  display: flex; flex-direction: column; justify-content: space-between;
  position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none; touch-action: none !important; -webkit-tap-highlight-color: transparent;
  width: 100vw; height: 100dvh;
}

.steampunk-bg {
  background: #fdf5e6;
  background-image: radial-gradient(#d2b48c 1.5px, transparent 1.5px);
  background-size: 25px 25px;
}

@media (min-width: 1025px) {
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.25); border: 8px solid white; }
}
@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; }
}

.header-standard {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1.25rem; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px);
  border-bottom: 2px solid rgba(210, 180, 140, 0.3);
}

.session-loot-capsule {
  display: flex; align-items: center; background: white; padding: 6px 16px;
  border-radius: 9999px; border: 2px solid #fde68a; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; color: #451a03; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }

.game-title { font-size: 2rem; font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }

/* NUEVO ICONO CARRITO 3D CSS PORTADA */
.css-3d-cart-wrapper {
  display: inline-flex; padding: 20px;
  background: rgba(251, 191, 36, 0.2); border-radius: 50%;
  border: 4px solid #b45309; box-shadow: 0 10px 20px rgba(0,0,0,0.1), inset 0 4px 10px rgba(255,255,255,0.5);
}

.css-3d-cart {
  width: 60px; height: 50px; position: relative;
}

.cart-basket {
  position: absolute; top: 0; left: 10px; width: 50px; height: 35px;
  background: repeating-linear-gradient(90deg, transparent, transparent 4px, #b45309 4px, #b45309 6px),
              repeating-linear-gradient(0deg, transparent, transparent 4px, #b45309 4px, #b45309 6px);
  border: 3px solid #92400e; border-top-width: 5px; border-radius: 2px 2px 8px 8px;
  box-shadow: inset 0 -5px 10px rgba(0,0,0,0.3);
}

.cart-handle {
  position: absolute; top: -5px; left: -5px; width: 25px; height: 20px;
  border-left: 4px solid #92400e; border-bottom: 4px solid #92400e;
  border-radius: 0 0 0 5px;
}

.cart-wheel {
  position: absolute; bottom: -5px; width: 14px; height: 14px;
  background: #451a03; border-radius: 50%;
  border: 2px solid #78350f; box-shadow: 0 2px 4px rgba(0,0,0,0.4);
}
.wheel-left { left: 15px; }
.wheel-right { right: 5px; }


.rules-panel { border-radius: 1.75rem; position: relative; }
.rules-badge { position: absolute; color: white; font-size: 11px; font-weight: 900; padding: 6px 16px; border-radius: 9999px; letter-spacing: 0.05em; }

.icon-gear {
  background: #fef3c7; border: 3px solid #b45309; padding: 10px; 
  border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.btn-steampunk {
  background: linear-gradient(to bottom, #d97706, #b45309); color: white; 
  padding: 1.2rem 2rem; border-radius: 16px; font-weight: 900; border: 2px solid #78350f;
  box-shadow: 0 6px 0 #78350f, 0 15px 20px rgba(120, 53, 15, 0.4); transition: all 0.1s;
}
.btn-steampunk:active { transform: translateY(6px); box-shadow: 0 0 0 #78350f, 0 5px 10px rgba(120, 53, 15, 0.4); }

/* SISTEMA POS COMPLETO (BRAZO + PANTALLA + MÁQUINA) */
.pos-system {
  padding-top: 3.5rem; /* Espacio extra asegurado para el brazo y monitor */
}

.mechanical-arm {
  position: absolute;
  top: 60px; /* Bajamos el inicio del brazo */
  left: 20px;
  width: 35px;
  height: 180px; /* Aumentamos altura para separar monitor de caja */
  border-left: 14px solid #78350f;
  border-top: 14px solid #78350f;
  border-top-left-radius: 16px;
  z-index: 5;
  box-shadow: -4px 4px 6px rgba(0,0,0,0.3);
}
.mechanical-arm::before {
  content: ''; position: absolute;
  top: -14px; left: -14px; width: 28px; height: 28px;
  background: radial-gradient(circle, #b45309, #78350f);
  border-radius: 50%; border: 3px solid #451a03;
}
.led-monitor::before {
  content: ''; position: absolute;
  top: 20px; left: -18px; width: 14px; height: 20px;
  background: #451a03; border-top: 2px solid #271102; border-bottom: 2px solid #271102;
}

.register-machine {
  background: linear-gradient(135deg, #78350f, #451a03); 
  padding: 15px 20px 25px 20px; border-radius: 20px; border: 8px solid #271102; 
  box-shadow: 0 25px 0 #1a0b01, inset 0 5px 15px rgba(255,255,255,0.1);
}

.thermal-receipt {
  background: #f8fafc; padding: 6px 12px; border-radius: 4px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.6);
  border-bottom: 2px dashed #cbd5e1;
}

.drawer-casing {
  background: #5c3a18; border-radius: 12px; padding-top: 10px;
  box-shadow: inset 0 10px 20px rgba(0,0,0,0.5);
  border: 4px solid #271102;
}

/* GAVETA MONEDAS CSS FOTORREALISTA */
.coin-drawer {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  padding: 15px 12px; background: #271102; border-radius: 0 0 8px 8px;
}

.euro-coin {
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 0.9rem; aspect-ratio: 1;
  box-shadow: 0 4px 6px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.3);
  cursor: pointer; transition: transform 0.1s;
}
.euro-coin:active { transform: scale(0.9) translateY(2px); }
.euro-coin:disabled { opacity: 0.5; pointer-events: none; }

.coin-copper { background: linear-gradient(135deg, #b87333, #8a5a29); color: white; border: 3px solid #5c3a18; }
.coin-gold { background: linear-gradient(135deg, #ffd700, #daa520); color: #5c4000; border: 3px solid #b8860b; }
.coin-1euro { background: radial-gradient(circle, #f8fafc 35%, #ffd700 40%); color: #1e293b; border: 4px solid #b8860b; }
.coin-2euro { background: radial-gradient(circle, #ffd700 35%, #f8fafc 40%); color: #5c4000; border: 4px solid #94a3b8; }

/* GAVETA BILLETES CSS */
.bill-drawer {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  padding: 15px 12px; background: #271102; border-radius: 0 0 8px 8px;
}

.euro-bill {
  border-radius: 4px; display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 1.1rem; padding: 12px 5px; color: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.3);
  border: 1px dashed rgba(255,255,255,0.4);
  cursor: pointer; transition: transform 0.1s;
}
.euro-bill:active { transform: scale(0.95) translateY(2px); }
.euro-bill:disabled { opacity: 0.5; pointer-events: none; }

/* ANIMACIONES Y EFECTOS */
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-bounce-slow { animation: bounceSlow 3s infinite ease-in-out; }
@keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

.animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
  40%, 60% { transform: translate3d(8px, 0, 0); }
}

.gold-glow { filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.6)); }
.silver-glow { filter: drop-shadow(0 0 15px rgba(148, 163, 184, 0.6)); }
.copper-glow { filter: drop-shadow(0 0 15px rgba(180, 83, 9, 0.6)); }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>