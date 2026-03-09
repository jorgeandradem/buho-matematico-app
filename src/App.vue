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
  <div id="master-wrapper">
    <ReloadPrompt />
    
    <main class="app-canvas">
      
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
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Nunito:wght@400;700;800;900&display=swap');

/* RESET Y ESTRUCTURA BASE */
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: auto; /* Permite scroll del navegador si la ventana es menor al min-height */
  background-color: #ffffff !important; 
  -webkit-font-smoothing: antialiased;
}

/* EL CASCO: Centra el lienzo y da el fondo de contraste sutil */
#master-wrapper {
  min-height: 100dvh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8fafc; /* Contraste sutil tipo Apple */
}

/* EL LIENZO QUIRÚRGICO */
.app-canvas {
  background-color: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; /* Mantiene el juego dentro de los bordes del lienzo */

  /* ESCENARIO SMARTPHONE (Por defecto) */
  width: 100%;
  height: 100dvh;

  /* ESCENARIO PC & TABLETS (Desde 600px) */
  @media (min-width: 600px) {
    width: 500px; /* Cintura generosa de 500px */
    height: 90dvh; 
    
    /* BLOQUEO DE REDUCCIÓN (PC) */
    min-width: 500px; 
    min-height: 800px;
    
    border-radius: 40px;
    border: 8px solid #f1f5f9; /* Marco físico sutil */
    margin: 20px;
  }

  /* AJUSTE ESPECIAL PARA TABLETS ANCHAS */
  @media (min-width: 900px) and (max-width: 1200px) {
    width: 80%; /* Respiro lateral en tablets */
    max-width: 700px; 
    min-width: 600px;
  }
}

/* UTILIDADES GLOBALES */
.font-handwriting { font-family: 'Patrick Hand', cursive; }
.font-numbers { font-family: 'Nunito', sans-serif; font-weight: 800; }

/* Evita selección de texto accidental en el juego */
* {
  user-select: none;
  -webkit-touch-callout: none;
}
</style>