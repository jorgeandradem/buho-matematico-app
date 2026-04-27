<script setup>
/** * ARCHIVO: DecimalLobby.vue
 * ESTADO: HUB CENTRAL CONECTADO A MULTIPLICACIÓN MODULAR (V23)
 * LÓGICA: Redirección del cuaderno de multiplicación hacia el nuevo Lobby de niveles.
 */
import { ref } from 'vue';
import { Plus, Minus, X as MultiplyIcon, Divide, ArrowLeft } from 'lucide-vue-next';
import DecimalAdd from './DecimalAdd.vue'; 
import DecimalSub from './DecimalSub.vue'; 
import DecimalDiv from './DecimalDiv.vue';
// 🔄 CAMBIO: Ahora importamos el Lobby de Multiplicación en lugar del módulo directo
import DecimalMultLobby from './DecimalMultLobby.vue'; 

const emit = defineEmits(['close']);

const activeOperation = ref(null);

const operations = [
  { id: 'add', label: 'Sumar', icon: Plus, color: 'bg-green-500', shadow: 'shadow-[0_4px_0_rgb(21,128,61)]', desc: 'Agrega decimales' },
  { id: 'sub', label: 'Restar', icon: Minus, color: 'bg-orange-500', shadow: 'shadow-[0_4px_0_rgb(194,65,12)]', desc: 'Quita decimales' },
  { id: 'mult', label: 'Multiplicar', icon: MultiplyIcon, color: 'bg-purple-500', shadow: 'shadow-[0_4px_0_rgb(126,34,206)]', desc: 'Grupos iguales' },
  { id: 'div', label: 'Dividir', icon: Divide, color: 'bg-blue-500', shadow: 'shadow-[0_4px_0_rgb(29,78,216)]', desc: 'Repartir partes' }
];

const openNotebook = (opId) => {
    // El cableado se mantiene igual, la magia ocurre en el template con el componente nuevo
    if (['add', 'sub', 'mult', 'div'].includes(opId)) {
        activeOperation.value = opId;
    } else {
        alert("¡Pronto construiremos este cuaderno, Jorge!");
    }
};
</script>

<template>
  <div class="absolute inset-0 z-[250] bg-gradient-to-br from-teal-400/90 to-cyan-600/90 backdrop-blur-md shadow-[inset_0_0_80px_rgba(8,145,178,0.4)] flex justify-center items-center animate-fade-in">
    
    <div v-show="activeOperation === null" class="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border-4 border-teal-200 relative flex flex-col mx-4 font-primary text-slate-800">
        
        <button @click="emit('close')" class="absolute top-4 right-4 z-50 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95">
            <ArrowLeft :size="24" stroke-width="2.5" />
        </button>

        <div class="text-center mb-8 mt-4">
            <div class="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-teal-200 shadow-inner">
                <span class="text-teal-600 font-black text-5xl leading-none -mt-3">,</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight leading-tight">Zona Decimal</h2>
            <p class="text-slate-500 font-bold text-sm mt-1">Elige tu desafío con precisión</p>
        </div>

        <div class="grid grid-cols-2 gap-4 w-full">
            <button v-for="op in operations" :key="op.id" @click="openNotebook(op.id)"
                :class="`group ${op.color} p-4 rounded-3xl ${op.shadow} active:translate-y-1 transition-all flex flex-col items-center justify-center gap-2`">
                <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <component :is="op.icon" :size="28" class="text-white" stroke-width="3" />
                </div>
                <div class="text-center mt-1">
                    <h3 class="text-white font-black text-lg uppercase tracking-tighter leading-none">{{ op.label }}</h3>
                    <p class="text-white/80 font-bold text-[9px] uppercase tracking-widest mt-1">{{ op.desc }}</p>
                </div>
            </button>
        </div>
    </div>

    <DecimalAdd v-if="activeOperation === 'add'" @close="activeOperation = null" />
    <DecimalSub v-if="activeOperation === 'sub'" @close="activeOperation = null" />

    <DecimalMultLobby v-if="activeOperation === 'mult'" @close="activeOperation = null" />

    <DecimalDiv v-if="activeOperation === 'div'" @close="activeOperation = null" />

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
@keyframes fadeIn { 
  from { opacity: 0; transform: scale(0.95); } 
  to { opacity: 1; transform: scale(1); } 
}
</style>