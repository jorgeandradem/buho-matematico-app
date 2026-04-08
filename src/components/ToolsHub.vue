<script setup>
/** * ARCHIVO: ToolsHub.vue
 * NOTA INTERNA: EL LABORATORIO DEL BÚHO v4.5 - INSTRUMENTO 03 DESBLOQUEADO (Cinta Calculadora)
 * LOGICA: Cuadrícula de utilidades con sistema de bloqueos.
 */
import { ref } from 'vue';

const emit = defineEmits(['close', 'open-tool']);

// --- 🧪 INVENTARIO DEL LABORATORIO ---
const tools = [
  { 
    id: 'converter', 
    name: 'Conversor Cuántico', 
    desc: 'Medidas y Valores', 
    locked: false, 
  },
  { 
    id: 'simulator', 
    name: 'Simulador Financiero', 
    desc: 'Cálculo de Préstamos', 
    locked: false, 
  },
  // 🦉 INSTRUMENTO 03 ACTUALIZADO Y DESBLOQUEADO
  { 
    id: 'tape-calculator', 
    name: 'Cinta Calculadora', 
    desc: 'Historial de Cálculos', 
    locked: false, 
  },
  { id: 't4', name: 'Instrumento 04', desc: 'Clasificado', locked: true },
  { id: 't5', name: 'Instrumento 05', desc: 'Clasificado', locked: true },
  { id: 't6', name: 'Instrumento 06', desc: 'Clasificado', locked: true },
  { id: 't7', name: 'Instrumento 07', desc: 'Clasificado', locked: true },
  { id: 't8', name: 'Instrumento 08', desc: 'Clasificado', locked: true }
];

const handleToolClick = (tool) => {
    if (tool.locked) return;
    emit('open-tool', tool.id);
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas bg-white flex flex-col relative overflow-hidden font-inter">
      
      <div class="absolute inset-0 bg-slate-50 z-0"></div>
      
      <header class="h-20 bg-white flex items-center justify-between px-6 border-b-2 border-slate-200 shrink-0 z-20 shadow-sm relative">
        <div class="flex items-center gap-3">
            <div class="relative flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500 drop-shadow-sm relative z-10">
                    <path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/>
                </svg>
                <div class="absolute bottom-1 left-2 w-5 h-3 bg-emerald-400 rounded-b-full opacity-40 blur-[2px] z-0"></div>
            </div>
            <div class="flex flex-col">
                <h1 class="text-slate-800 font-black text-2xl tracking-wide uppercase leading-none">El Laboratorio</h1>
                <span class="text-slate-500 font-bold text-sm leading-none mt-1">Paso 1</span>
            </div>
        </div>
        
        <button @click="emit('close')" class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-[0_4px_10px_rgba(0,0,0,0.1)] border-2 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </header>

      <div class="flex-1 relative z-10 px-4 py-8 flex flex-col items-center justify-center overflow-hidden">
          
          <div class="bg-slate-100/80 border-2 border-slate-200 rounded-[2rem] w-full max-w-4xl p-4 md:p-8 shadow-sm flex flex-col h-full max-h-[700px]">
              
              <div class="mb-4 md:mb-8 text-center shrink-0">
                  <h2 class="text-[#1e293b] text-xl md:text-[28px] font-black uppercase tracking-wide leading-tight mb-1 md:mb-2">
                      Módulo de Instrumentos
                  </h2>
                  <h3 class="text-[#334155] text-sm md:text-[22px] font-black uppercase tracking-wide leading-tight">
                      Selecciona un instrumento activado
                  </h3>
              </div>

              <div class="flex-1 overflow-y-auto no-scrollbar w-full relative">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 py-2 h-max w-full">
                      <button 
                          v-for="(tool, index) in tools" 
                          :key="tool.id"
                          @click="handleToolClick(tool)"
                          :class="[
                              'relative w-full aspect-square rounded-[1.2rem] p-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 sm:gap-2',
                              tool.locked 
                                ? 'bg-[#a1a1aa] border-2 border-[#94a3b8] opacity-90 cursor-not-allowed shadow-inner' 
                                : 'bg-white border-[3px] border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] active:scale-95 cursor-pointer hover:shadow-[0_0_25px_rgba(52,211,153,0.6)]'
                          ]"
                      >
                          <span :class="[
                              'absolute top-2 left-3 font-black text-lg md:text-xl', 
                              tool.locked ? 'text-[#71717a]' : 'text-slate-400'
                          ]">
                              {{ index + 1 }}
                          </span>
                          
                          <div class="mt-2 md:mt-4 flex justify-center items-center">
                              
                              <svg v-if="tool.locked" xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-[#52525b]">
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>

                              <svg v-else-if="tool.id === 'converter'" xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
                                  <circle cx="12" cy="12" r="1"/>
                                  <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(45 12 12)"/>
                                  <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-45 12 12)"/>
                              </svg>

                              <svg v-else-if="tool.id === 'simulator'" xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
                                  <line x1="12" x2="12" y1="2" y2="22"/>
                                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                              </svg>

                              <svg v-else-if="tool.id === 'tape-calculator'" xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
                                  <rect width="16" height="20" x="4" y="2" rx="2"/>
                                  <line x1="8" x2="16" y1="6" y2="6"/>
                                  <line x1="16" x2="16" y1="14" y2="18"/>
                                  <path d="M16 10h.01"/>
                                  <path d="M12 10h.01"/>
                                  <path d="M8 10h.01"/>
                                  <path d="M12 14h.01"/>
                                  <path d="M8 14h.01"/>
                                  <path d="M12 18h.01"/>
                                  <path d="M8 18h.01"/>
                              </svg>

                          </div>

                          <div class="text-center w-full mt-1">
                              <h3 :class="[
                                  'font-black text-[13px] md:text-[15px] leading-tight tracking-tight w-full px-1 uppercase',
                                  tool.locked ? 'text-[#3f3f46]' : 'text-blue-800'
                              ]">
                                  <span v-if="tool.id === 'converter'">Conversor<br>Cuántico</span>
                                  <span v-else-if="tool.id === 'simulator'">Simulador<br>Financiero</span>
                                  <span v-else-if="tool.id === 'tape-calculator'">Cinta<br>Calculadora</span>
                                  <span v-else>{{ tool.name }}</span>
                              </h3>
                          </div>
                      </button>
                  </div>
              </div>
              
          </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

.font-inter { font-family: 'Inter', sans-serif; }

.master-container { 
  height: 100dvh; 
  width: 100vw; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  overflow: hidden; 
  background-color: #e2e8f0; 
  position: fixed; 
  top: 0; 
  left: 0; 
  touch-action: none; 
}

.app-canvas { 
  width: 100vw; 
  height: 100dvh; 
  box-sizing: border-box;
}

@media (min-width: 600px) and (max-width: 1024px) { 
  .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; max-width: 700px; } 
}

@media (min-width: 1025px) { 
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 6px solid rgba(255, 255, 255, 0.5); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); } 
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>