<script setup>
import { ref, onMounted } from 'vue';
import { Plus, Minus, X as MultiplyIcon, Divide } from 'lucide-vue-next';

import CoverScreen from './components/CoverScreen.vue';
import IndexScreen from './components/IndexScreen.vue';
import GenericTableModule from './components/GenericTableModule.vue';
import DivisionModule from './components/DivisionModule.vue';
import ReloadPrompt from './components/ReloadPrompt.vue';

// IMPORTAMOS EL STORE PARA INICIALIZAR EL BANCO
import { useGamificationStore } from '@/stores/useGamificationStore';

const currentView = ref('cover'); 
const previousView = ref(null); 
const currentConfig = ref({}); 
const gamificationStore = useGamificationStore();

// LÓGICA DE IGNICIÓN AL ARRANCAR
onMounted(() => {
  // 1. Cargamos lo que el usuario tenía guardado en el bolsillo (LocalStorage)
  gamificationStore.loadFromStorage();
  
  // 2. Verificamos si hoy le toca premio por racha diaria
  gamificationStore.checkDailyStreak();
});

const navigateTo = (viewName, config) => {
  const safeConfig = config || {}; 
  
  previousView.value = currentView.value; 
  
  if (safeConfig.id) {
      currentConfig.value = safeConfig;
      currentView.value = safeConfig.id;
  } else {
      currentView.value = viewName;
  }
};
</script>

<template>
  <div class="antialiased text-slate-900 font-sans">
    
    <ReloadPrompt />

    <CoverScreen 
      v-if="currentView === 'cover'" 
      @start="navigateTo('index')" 
    />

    <IndexScreen 
      v-if="currentView === 'index'"
      :fromView="previousView"
      @select="(cfg) => navigateTo('module', cfg)"
      @exit="navigateTo('cover')"
    />

    <GenericTableModule 
      v-if="['add', 'sub', 'mult'].includes(currentView) || (currentView === 'div' && currentConfig.mode === 'quick')"
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
      v-if="currentView === 'div' && currentConfig.mode === 'notebook'"
      key="module-div-notebook"
      @back="navigateTo('index')"
    />

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Nunito:wght@400;700;800;900&display=swap');

.font-handwriting { font-family: 'Patrick Hand', cursive; }
.font-numbers { font-family: 'Nunito', sans-serif; font-weight: 800; }
body { background-color: #f0f4f8; margin: 0; padding: 0; }
</style>