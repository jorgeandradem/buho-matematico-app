<script setup>
import { ref, onMounted } from 'vue';
import { Plus, Minus, X as MultiplyIcon, Divide } from 'lucide-vue-next';

import CoverScreen from './components/CoverScreen.vue';
import WelcomeScreen from './components/WelcomeScreen.vue'; 
import PortalWelcomeScreen from './components/PortalWelcomeScreen.vue'; /* INYECTADO: Compuerta del Hub */
import IndexScreen from './components/IndexScreen.vue';
import GenericTableModule from './components/GenericTableModule.vue';
import DivisionModule from './components/DivisionModule.vue';
import ReloadPrompt from './components/ReloadPrompt.vue';

import { useGamificationStore } from '@/stores/useGamificationStore';

const currentView = ref('cover'); 
const previousView = ref(null); 
const currentConfig = ref({}); 
const gamificationStore = useGamificationStore();

onMounted(() => {
  gamificationStore.loadFromStorage();
  gamificationStore.checkDailyStreak();
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
      currentConfig.value = {}; // Reset para evitar que parámetros viejos se filtren
      currentView.value = viewName;
  }
};
</script>

<template>
  <div id="master-wrapper">
    <ReloadPrompt />
    
    <main class="app-canvas">
      <Transition name="fast-fade" mode="out-in">
        
        <CoverScreen 
          v-if="currentView === 'cover'" 
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
        
      </Transition>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Nunito:wght@400;700;800;900&display=swap');

html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: auto; background-color: #ffffff !important; -webkit-font-smoothing: antialiased; }
#master-wrapper { min-height: 100dvh; width: 100vw; display: flex; justify-content: center; align-items: center; background-color: #f8fafc; }
.app-canvas { background-color: #ffffff; position: relative; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; width: 100%; height: 100dvh; }
@media (min-width: 600px) { .app-canvas { width: 500px; height: 90dvh; min-width: 500px; min-height: 800px; border-radius: 40px; border: 8px solid #f1f5f9; margin: 20px; } }
@media (min-width: 900px) and (max-width: 1200px) { .app-canvas { width: 80%; max-width: 700px; min-width: 600px; } }
.font-handwriting { font-family: 'Patrick Hand', cursive; }
.font-numbers { font-family: 'Nunito', sans-serif; font-weight: 800; }
* { user-select: none; -webkit-touch-callout: none; }
.fast-fade-enter-active, .fast-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fast-fade-enter-from, .fast-fade-leave-to { opacity: 0; transform: scale(0.98); }
</style>