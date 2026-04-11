<script setup>
/** * ARCHIVO: ToolsHub.vue
 * VERSION: 3.0 - Multidispositivo Pro (Estándar Suite).
 * NOTA: Adaptación de chasis para móviles, tablets y desktop.
 */
import { ref } from 'vue';
import { 
  FlaskConical, X, ChevronRight, 
  Scale, Calculator, ScrollText 
} from 'lucide-vue-next';

const emit = defineEmits(['close', 'open-tool']);

const tools = [
  { 
    id: 'converter', 
    name: 'Conversor Cuántico', 
    icon: Scale, 
    desc: 'Unidades y Medidas',
    color: '#3b82f6' 
  },
  { 
    id: 'simulator', 
    name: 'Simulador Financiero', 
    icon: Calculator, 
    desc: 'Interés y Ahorro',
    color: '#10b981' 
  },
  { 
    id: 'tape-calculator', 
    name: 'Cinta de Papel', 
    icon: ScrollText, 
    desc: 'Cálculo Secuencial Pro',
    color: '#f97316' 
  }
];
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas bg-slate-100">
      
      <div class="hub-device-chassis">
        
        <header class="header-standard shrink-0 relative flex justify-between items-center py-2 sm:py-3 px-4 sm:px-6 shadow-sm z-30 bg-white">
          <div class="w-8 h-8 sm:w-10 sm:h-10 invisible hidden md:block"></div>
          <div class="flex items-center justify-center gap-2 sm:gap-3 flex-1 md:flex-none">
              <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <FlaskConical size="18" stroke-width="2.5" />
              </div>
              <span class="text-[#312e81] font-black text-[15px] sm:text-xl uppercase tracking-widest leading-none italic text-shadow-sm mt-0.5 truncate">
                Laboratorio
              </span>
          </div>
          <button @click="emit('close')" class="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-white border-2 border-slate-200 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-800 transition-colors shadow-sm cursor-pointer active:scale-95">
            <X size="20" stroke-width="3" />
          </button>
        </header>

        <div class="hub-scroll-area custom-scrollbar">
          <div class="hub-content">
            <p class="hub-subtitle">Selecciona un Instrumento</p>
            
            <div class="tools-grid">
              <button 
                v-for="tool in tools" 
                :key="tool.id"
                @click="emit('open-tool', tool.id)"
                class="tool-card-pro shadow-sm"
              >
                <div class="tool-icon-wrapper" :style="{ backgroundColor: tool.color + '15', color: tool.color }">
                  <component :is="tool.icon" :size="28" stroke-width="2.5" />
                </div>
                
                <div class="tool-meta">
                  <span class="tool-name">{{ tool.name }}</span>
                  <span class="tool-desc">{{ tool.desc }}</span>
                </div>

                <div class="tool-action">
                  <ChevronRight size="20" class="text-slate-300" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <footer class="hub-footer-brand shrink-0">
          <div class="version-pill">
            BÚHO MATEMÁTICO V2.12.1
          </div>
        </footer>

      </div>
    </main>
  </div>
</template>

<style scoped>
/* --- 📱 NORMAS MULTIDISPOSITIVO --- */
.master-container { 
  position: fixed; inset: 0; z-index: 9999; 
  display: flex; justify-content: center; align-items: center; 
  background-color: #f1f5f9; overflow: hidden; 
}

.app-canvas { 
  display: flex; flex-direction: column; 
  position: relative; transition: all 0.4s; 
  width: 100vw; height: 100dvh; overflow: hidden; 
}

/* 💻 ESTILO "SUITE" PARA DESKTOP */
@media (min-width: 1025px) { 
  .app-canvas { 
    width: 1024px; height: 90dvh; 
    border-radius: 45px; border: 8px solid white; 
    box-shadow: 0 40px 100px rgba(0,0,0,0.15); 
  } 
}

/* 📦 CHASIS DEL HUB */
.hub-device-chassis {
  width: 100%; height: 100%; max-width: 440px; margin: 0 auto;
  background: #f8fafc; display: flex; flex-direction: column; 
  position: relative; overflow: hidden;
}

.hub-scroll-area {
  flex: 1; overflow-y: auto; padding: 1.5rem 1rem;
  padding-bottom: env(safe-area-inset-bottom);
}

.hub-content { display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px; margin: 0 auto; width: 100%; }
.hub-subtitle { font-weight: 800; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; text-align: center; }

/* 🃏 TARJETAS PRO */
.tools-grid { display: flex; flex-direction: column; gap: 0.75rem; }

.tool-card-pro {
  display: flex; align-items: center; gap: 1rem; padding: 1rem;
  background: white; border-radius: 1.5rem; border: 2px solid #f1f5f9;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; text-align: left;
}

.tool-card-pro:hover { border-color: #dbeafe; background: #fdfdfd; transform: translateY(-2px); }
.tool-card-pro:active { transform: scale(0.98) translateY(0); }

.tool-icon-wrapper {
  width: 3.8rem; height: 3.8rem; border-radius: 1.1rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.tool-meta { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
.tool-name { font-weight: 900; color: #1e1b4b; font-size: 1.05rem; letter-spacing: -0.01em; }
.tool-desc { font-size: 0.8rem; color: #64748b; font-weight: 600; }

/* 🏁 FOOTER */
.hub-footer-brand { padding: 1.5rem; display: flex; justify-content: center; }
.version-pill {
  background: #f1f5f9; color: #94a3b8; font-size: 10px; font-weight: 900;
  padding: 0.4rem 1rem; border-radius: 2rem; letter-spacing: 0.1em;
}

/* 🎨 UTILIDADES */
.text-shadow-sm { text-shadow: 1px 1px 2px rgba(0,0,0,0.05); }
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>