<script setup>
/**
 * ARCHIVO: DecimalMultLobby.vue
 * DESCRIPCIÓN: Antesala de selección de dificultad para Multiplicación con Decimales.
 * Integra la navegación hacia el nivel Básico y Avanzado.
 * UI: Diseño Mobile First ultra compacto y Saludo Dinámico.
 */
import { ref } from 'vue';
import { ChevronLeft, GraduationCap, Star, Rocket, Trophy } from 'lucide-vue-next';

// IMPORTANTE: Asegúrate de que estos nombres coincidan con tus archivos o ajusta el cableado
import DecimalMultBasic from './DecimalMultBasic.vue'; 
import DecimalMult from './DecimalMult.vue'; // Tu módulo avanzado actual

// 🛠️ FIX: Agregamos la propiedad userName para recibir el nombre real del alumno
const props = defineProps({
    userName: {
        type: String,
        default: 'Estudiante' // Texto de respaldo por si el nombre tarda en cargar
    }
});

const emit = defineEmits(['close']);

// --- ESTADOS DE NAVEGACIÓN ---
const currentView = ref('lobby'); // 'lobby', 'basic', 'advanced'

const selectLevel = (level) => {
    try {
        new Audio('/audios/select.mp3').play();
    } catch (e) { /* Silenciar si no hay audio */ }
    currentView.value = level;
};

const goBackToLobby = () => {
    currentView.value = 'lobby';
};
</script>

<template>
  <div class="w-full h-full">
    
    <div v-if="currentView === 'lobby'" 
         class="w-full h-full flex flex-col bg-[#4F46E5] overflow-hidden animate-fade-in relative font-primary text-slate-800">
        
        <header class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shrink-0 text-white z-20">
            <button @click="emit('close')" class="flex items-center gap-1 font-black text-xs sm:text-sm hover:text-blue-200 transition-all active:scale-95">
                <ChevronLeft :size="24" stroke-width="3" /> VOLVER
            </button>
            <div class="text-right">
                <h1 class="font-black text-lg sm:text-xl tracking-tighter uppercase leading-none">Multiplicación</h1>
                <span class="text-[9px] sm:text-[10px] font-bold text-blue-200 tracking-widest uppercase">Selecciona Dificultad</span>
            </div>
        </header>

        <main class="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-3 sm:gap-6 z-10 overflow-y-auto">
            
            <div class="flex flex-col items-center mb-2 sm:mb-4 animate-bounce-soft">
                <div class="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-4xl sm:text-5xl shadow-2xl border-4 border-yellow-400 relative">
                    🦉
                    <div class="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                        <Star :size="16" class="sm:w-5 sm:h-5" fill="currentColor" />
                    </div>
                </div>
                <div class="mt-3 sm:mt-4 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-xl border-b-4 border-slate-200 relative">
                    <p class="text-center font-black text-slate-700 leading-tight text-xs sm:text-base">
                        ¡Hola {{ userName }}! <br>
                        <span class="text-blue-600 text-[10px] sm:text-sm">¿Qué desafío enfrentaremos hoy?</span>
                    </p>
                    <div class="absolute -top-1.5 sm:-top-2 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rotate-45"></div>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl shrink-0">
                
                <button @click="selectLevel('basic')" 
                        class="group bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-[0_6px_0_rgb(226,232,240)] sm:shadow-[0_8px_0_rgb(226,232,240)] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center text-center border-2 border-transparent hover:border-blue-400">
                    <div class="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                        <GraduationCap :size="28" class="sm:w-10 sm:h-10" stroke-width="2.5" />
                    </div>
                    <h3 class="font-black text-base sm:text-xl text-slate-800 uppercase tracking-tight leading-none">Nivel Básico</h3>
                    <p class="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 px-1 sm:px-4 leading-snug">
                        Foco en el "Salto de la Rana" y una cifra.
                    </p>
                    <div class="mt-2 sm:mt-4 bg-blue-50 text-blue-600 font-black text-[9px] sm:text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                        Principiante
                    </div>
                </button>

                <button @click="selectLevel('advanced')" 
                        class="group bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-[0_6px_0_rgb(226,232,240)] sm:shadow-[0_8px_0_rgb(226,232,240)] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center text-center border-2 border-transparent hover:border-amber-400">
                    <div class="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 text-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                        <Rocket :size="28" class="sm:w-10 sm:h-10" stroke-width="2.5" />
                    </div>
                    <h3 class="font-black text-base sm:text-xl text-slate-800 uppercase tracking-tight leading-none">Nivel Experto</h3>
                    <p class="text-[11px] sm:text-xs font-bold text-slate-500 mt-1 px-1 sm:px-4 leading-snug">
                        Algoritmo tradicional y varias cifras.
                    </p>
                    <div class="mt-2 sm:mt-4 bg-amber-50 text-amber-600 font-black text-[9px] sm:text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                        Desafío Total
                    </div>
                </button>

            </div>
        </main>

        <footer class="p-4 sm:p-6 flex justify-center opacity-30 shrink-0">
            <div class="flex gap-4">
                <Trophy v-for="i in 3" :key="i" class="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
        </footer>

        <div class="absolute -bottom-20 -left-20 w-60 h-60 sm:w-80 sm:h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -top-20 -right-20 w-60 h-60 sm:w-80 sm:h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>

    <DecimalMultBasic v-if="currentView === 'basic'" @close="goBackToLobby" />
    <DecimalMult v-if="currentView === 'advanced'" @close="goBackToLobby" />

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.animate-bounce-soft { animation: bounceSoft 3s infinite ease-in-out; }
@keyframes bounceSoft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

/* Fuente primaria del proyecto */
.font-primary { font-family: 'Quicksand', 'Nunito', sans-serif; }
</style>