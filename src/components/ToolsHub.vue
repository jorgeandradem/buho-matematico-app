<script setup>
/** * ARCHIVO: ToolsHub.vue
 * NOTA: Este es el MENÚ del Laboratorio. 
 * FUNCION: Emite 'open-tool' para que App.vue cambie la vista.
 */
import { ref } from 'vue';

const emit = defineEmits(['close', 'open-tool']);

// Lista de herramientas disponibles en el Laboratorio
const tools = [
  { 
    id: 'converter', 
    name: 'Conversor Cuántico', 
    icon: '⚖️', 
    desc: 'Unidades y Medidas',
    color: '#3b82f6' 
  },
  { 
    id: 'simulator', 
    name: 'Simulador Financiero', 
    icon: '💰', 
    desc: 'Interés y Ahorro',
    color: '#10b981' 
  },
  { 
    id: 'tape-calculator', 
    name: 'Cinta de Papel', 
    icon: '📜', 
    desc: 'Cálculo Secuencial Pro',
    color: '#f97316' 
  }
];
</script>

<template>
  <div class="hub-overlay">
    <main class="hub-canvas font-inter">
      
      <div class="hub-device-chassis shadow-25d">
        
        <header class="hub-header">
          <div class="hub-brand">
            <span class="hub-icon">🧪</span>
            <h1 class="hub-title">Laboratorio</h1>
          </div>
          <button @click="emit('close')" class="btn-close-hub">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </header>

        <div class="hub-content">
          <p class="hub-subtitle">Selecciona un Instrumento</p>
          
          <div class="tools-grid">
            <button 
              v-for="tool in tools" 
              :key="tool.id"
              @click="emit('open-tool', tool.id)"
              class="tool-card-2d"
            >
              <div class="tool-icon-box" :style="{ backgroundColor: tool.color + '20', color: tool.color }">
                {{ tool.icon }}
              </div>
              <div class="tool-info">
                <span class="tool-name">{{ tool.name }}</span>
                <span class="tool-desc">{{ tool.desc }}</span>
              </div>
              <div class="tool-arrow">→</div>
            </button>
          </div>

          <div class="hub-footer">
            <p class="footer-note">Búho Matemático v2.12.1</p>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.hub-overlay {
  position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center;
  background-color: #f1f5f9; overflow: hidden;
}

.hub-canvas {
  width: 100vw; height: 100dvh; display: flex; flex-direction: column; justify-content: center; align-items: center;
}

@media (min-width: 1025px) {
  .hub-canvas { width: 1024px; height: 90dvh; }
}

.hub-device-chassis {
  width: 100%; height: 100%; max-width: 440px; margin: 0 auto;
  background: linear-gradient(145deg, #d1d5db, #ffffff);
  display: flex; flex-direction: column; position: relative; overflow: hidden;
  border: 1px solid #94a3b8;
}

@media (min-width: 600px) {
  .hub-device-chassis { 
    border-radius: 45px; border: 12px solid #e2e8f0; 
    box-shadow: inset 2px 2px 12px rgba(255,255,255,1), 15px 25px 50px rgba(0,0,0,0.15);
  }
}

.hub-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.5rem 1.8rem 1rem; background: white; border-bottom: 2px solid #f1f5f9;
}

.hub-brand { display: flex; align-items: center; gap: 0.75rem; }
.hub-title { font-size: 1.4rem; font-weight: 900; color: #1e1b4b; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }
.hub-icon { font-size: 1.5rem; }

.btn-close-hub {
  width: 2.5rem; height: 2.5rem; border-radius: 50%; background: #fff; border: 2px solid #f1f5f9;
  box-shadow: 2px 2px 8px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; color: #f43f5e; cursor: pointer;
}

.hub-content { flex: 1; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.hub-subtitle { font-weight: 800; color: #64748b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; }

.tools-grid { display: flex; flex-direction: column; gap: 1rem; }

.tool-card-2d {
  display: flex; align-items: center; gap: 1rem; padding: 1rem;
  background: white; border-radius: 1.25rem; border: none;
  border-bottom: 5px solid #cbd5e1; transition: all 0.1s; cursor: pointer; text-align: left;
}

.tool-card-2d:active { transform: translateY(4px); border-bottom-width: 0; }

.tool-icon-box {
  width: 3.5rem; height: 3.5rem; border-radius: 1rem;
  display: flex; align-items: center; justify-content: center; font-size: 1.8rem;
}

.tool-info { flex: 1; display: flex; flex-direction: column; }
.tool-name { font-weight: 900; color: #1e1b4b; font-size: 1rem; }
.tool-desc { font-size: 0.75rem; color: #64748b; font-weight: 600; }
.tool-arrow { font-weight: 900; color: #cbd5e1; font-size: 1.2rem; }

.hub-footer { margin-top: auto; padding-bottom: 1rem; text-align: center; }
.footer-note { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }

.shadow-25d { box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
</style>