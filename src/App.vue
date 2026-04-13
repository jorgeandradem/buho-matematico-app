<script setup>
import { ref, onMounted } from 'vue';
import { Plus, Minus, X as MultiplyIcon, Divide } from 'lucide-vue-next';

// --- NUEVAS IMPORTACIONES: EL GUARDIÁN OFFLINE Y TELEMETRÍA ---
import { auth, logAppVersion } from '@/firebaseConfig'; // 🛰️ Radar inyectado
import { onAuthStateChanged } from "firebase/auth";

import CoverScreen from './components/CoverScreen.vue';
import WelcomeScreen from './components/WelcomeScreen.vue'; 
import PortalWelcomeScreen from './components/PortalWelcomeScreen.vue'; 
import IndexScreen from './components/IndexScreen.vue';
import GenericTableModule from './components/GenericTableModule.vue';
import DivisionModule from './components/DivisionModule.vue';
import ReloadPrompt from './components/ReloadPrompt.vue';
import CrystalDimension from './components/CrystalDimension.vue'; 

// 🚀 NUEVAS IMPORTACIONES: EL LABORATORIO Y SUS HERRAMIENTAS
import ToolsHub from './components/ToolsHub.vue';
import QuantumConverter from './components/QuantumConverter.vue';
import FinancialSimulator from './components/FinancialSimulator.vue'; 
import TapeCalculator from './components/TapeCalculator.vue'; 

// 🎮 NUEVA IMPORTACIÓN: EL CLUB LÓGICO (RECREACIÓN)
import GameLobbyHub from './components/GameLobbyHub.vue';
import GameChess from './components/GameChess.vue'; 
import GameCheckers from './components/GameCheckers.vue'; 
import GameSolitaire from './components/GameSolitaire.vue'; 
import GameMastermind from './components/GameMastermind.vue'; 
import GameConnect4 from './components/GameConnect4.vue'; 
import GameSudoku from './components/GameSudoku.vue';

import { useGamificationStore } from '@/stores/useGamificationStore';

// 🏷️ CONTROL DE VERSIÓN MAESTRO
const APP_VERSION = "4.0.0";

const currentView = ref('cover'); 
const previousView = ref(null); 
const currentConfig = ref({}); 
const gamificationStore = useGamificationStore();

// --- ESTADO DE CARGA PARA EL GUARDIÁN ---
const isLoadingAuth = ref(true);

onMounted(() => {
  gamificationStore.loadFromStorage();
  gamificationStore.checkDailyStreak();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log(`🦉 Guardián: Sesión detectada para ${user.email}. Registrando telemetría...`);
      
      // 🛰️ DISPARO DE RADAR: Registra versión y dispositivo en Firestore
      logAppVersion(user.uid, APP_VERSION);

      if (gamificationStore.fetchUserStats) {
        gamificationStore.fetchUserStats();
      }
      currentView.value = 'index';
    } else {
      console.log("🦉 Guardián: No hay sesión registrada. Pidiendo credenciales...");
      currentView.value = 'cover';
    }
    isLoadingAuth.value = false;
    
  }, (error) => {
    console.error("❌ Error en el Guardián:", error);
    if (gamificationStore.totalWealthInCopper > 0) {
      currentView.value = 'index';
    } else {
      currentView.value = 'cover';
    }
    isLoadingAuth.value = false;
  });
});

const navigateTo = (viewName, config) => {
  const safeConfig = config || {}; 
  previousView.value = currentView.value; 
  if (safeConfig.id) {
      currentConfig.value = safeConfig;
      currentView.value = safeConfig.id;
  } else if (safeConfig.mode) {
      currentConfig.value = safeConfig;
      currentView.value = viewName;
  } else {
      currentConfig.value = {}; 
      currentView.value = viewName;
  }
};
</script>

<template>
  <div id="master-wrapper">
    <ReloadPrompt />
    
    <Transition name="fast-fade" mode="out-in">
        
        <CrystalDimension 
          v-if="currentView === 'crystal-dimension'"
          @close="navigateTo('index')"
          @sumar-premios="gamificationStore.completeCrystalDimension()"
        />

        <ToolsHub 
          v-else-if="currentView === 'tools-hub'"
          @close="navigateTo('index')"
          @open-tool="(toolId) => navigateTo(toolId)"
        />

        <GameLobbyHub 
          v-else-if="currentView === 'game-lobby'" 
          @close="navigateTo('index')"
          @open-game="(gamePayload) => navigateTo(gamePayload.id, { mode: gamePayload.mode })"
          @go-earn-coins="navigateTo('mult', { id: 'mult', mode: 'quick', difficulty: 1, table: 'random' })"
        />

        <GameChess 
          v-else-if="currentView === 'chess'" 
          :gameMode="currentConfig.mode"
          @close="navigateTo('game-lobby')" 
        />

        <GameCheckers 
          v-else-if="currentView === 'checkers'" 
          :gameMode="currentConfig.mode"
          @close="navigateTo('game-lobby')" 
        />

        <GameSolitaire 
          v-else-if="currentView === 'solitaire'" 
          :gameMode="currentConfig.mode"
          @close="navigateTo('game-lobby')" 
        />

        <GameMastermind 
          v-else-if="currentView === 'mastermind'" 
          :gameMode="currentConfig.mode"
          @close="navigateTo('game-lobby')" 
        />

        <GameConnect4 
          v-else-if="currentView === 'connect4'" 
          :gameMode="currentConfig.mode"
          @close="navigateTo('game-lobby')" 
        />

        <GameSudoku 
          v-else-if="currentView === 'sudoku'" 
          :gameMode="currentConfig.mode"
          @close="navigateTo('game-lobby')" 
        />

        <QuantumConverter 
          v-else-if="currentView === 'converter'"
          @close="navigateTo('tools-hub')"
        />

        <FinancialSimulator 
          v-else-if="currentView === 'simulator'"
          @close="navigateTo('tools-hub')"
        />

        <TapeCalculator 
          v-else-if="currentView === 'tape-calculator'"
          @close="navigateTo('tools-hub')"
        />

        <main v-else class="app-canvas">
            
            <div v-if="isLoadingAuth" class="w-full h-full flex flex-col items-center justify-center bg-[#f8fafc]">
              <div class="animate-bounce text-7xl mb-4 drop-shadow-lg">🦉</div>
              <p class="text-indigo-900 font-black text-xl animate-pulse tracking-wide uppercase">Preparando el nido...</p>
            </div>

            <CoverScreen 
              v-else-if="currentView === 'cover'" 
              :force-auth-mode="currentConfig.mode"
              @show-welcome="navigateTo('welcome')" 
              @start="navigateTo('index')" 
            />

            <WelcomeScreen 
              v-else-if="currentView === 'welcome'"
              @members="navigateTo('cover', { mode: 'login' })"
              @newcomers="navigateTo('cover', { mode: 'register' })"
              @close="navigateTo('cover')" 
            />

            <PortalWelcomeScreen 
              v-else-if="currentView === 'portal-welcome'"
              @proceed="navigateTo('index', { mode: 'open-hub' })"
              @close="navigateTo('index')"
            />

            <IndexScreen 
              v-else-if="currentView === 'index'"
              :fromView="previousView"
              :config="currentConfig"
              @select="(cfg) => navigateTo('module', cfg)"
              @exit="navigateTo('cover')"
              @open-portal-welcome="navigateTo('portal-welcome')"
              @open-crystal-dimension="navigateTo('crystal-dimension')"
              @open-tools-hub="navigateTo('tools-hub')" 
              @open-game-lobby="navigateTo('game-lobby')"
            />

            <GenericTableModule 
              v-else-if="['add', 'sub', 'mult'].includes(currentView) || (currentView === 'div' && currentConfig.mode === 'quick')"
              :key="currentView + currentConfig.mode + currentConfig.difficulty + currentConfig.table"
              :operation="currentConfig.id"
              :title="currentConfig.id === 'add' ? 'Sumar' : (currentConfig.id === 'sub' ? 'Restar' : (currentConfig.id === 'mult' ? 'Multiplicar' : 'Dividir'))"
              :colorTheme="currentConfig.id === 'add' ? 'green' : (currentConfig.id === 'sub' ? 'orange' : (currentConfig.id === 'mult' ? 'purple' : 'blue'))"
              :icon="currentConfig.id === 'add' ? Plus : (currentConfig.id === 'sub' ? Minus : (currentConfig.id === 'mult' ? MultiplyIcon : Divide))"
              :initialMode="currentConfig.mode"
              :initialDifficulty="currentConfig.difficulty"
              :initialTable="currentConfig.table"
              @back="navigateTo('index')"
            />

            <DivisionModule 
              v-else-if="currentView === 'div' && currentConfig.mode === 'notebook'"
              key="module-div-notebook"
              @back="navigateTo('index')"
            />

        </main>

    </Transition>
  </div>
</template>

<style>
/* ... Mantener tus estilos iguales ... */
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Nunito:wght@400;700;800;900&display=swap');

html, body { 
  margin: 0 !important; 
  padding: 0 !important; 
  width: 100% !important; 
  height: 100% !important; 
  overflow: hidden; 
  background-color: #ffffff !important; 
  -webkit-font-smoothing: antialiased; 
  touch-action: none; 
}

#master-wrapper { 
  min-height: 100dvh; 
  width: 100vw; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  background-color: #f8fafc; 
}

.app-canvas { 
  background-color: #ffffff; 
  position: relative; 
  display: flex; 
  flex-direction: column; 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
  overflow: hidden; 
  width: 100%; 
  height: 100dvh; 
}

@media (min-width: 600px) { 
  .app-canvas { 
    width: 500px; 
    height: 90dvh; 
    min-width: 500px; 
    min-height: 800px; 
    border-radius: 40px; 
    border: 8px solid #f1f5f9; 
    margin: 20px; 
  } 
}

@media (min-width: 900px) and (max-width: 1200px) { 
  .app-canvas { 
    width: 80%; 
    max-width: 700px; 
    min-width: 600px; 
  } 
}

.font-handwriting { font-family: 'Patrick Hand', cursive; }
.font-numbers { font-family: 'Nunito', sans-serif; font-weight: 800; }

* { 
  user-select: none; 
  -webkit-touch-callout: none; 
}

.fast-fade-enter-active, .fast-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fast-fade-enter-from, .fast-fade-leave-to { opacity: 0; transform: scale(0.98); }
</style>