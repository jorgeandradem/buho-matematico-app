<script setup>
import { ref } from 'vue';
import { X, Flame, CheckCircle, Gift } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';

const emit = defineEmits(['close']);
const store = useGamificationStore();
</script>

<template>
  <div class="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans">
    <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border-4 border-orange-100 flex flex-col max-h-[90vh]">

        <div class="bg-gradient-to-r from-orange-400 to-red-500 p-6 text-center relative text-white shrink-0">
            <button @click="emit('close')" class="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition">
                <X size="20" />
            </button>
            <div class="flex justify-center items-center gap-2 mb-1 mt-2">
                <Flame size="48" class="text-yellow-300 animate-pulse" fill="currentColor" />
                <h2 class="text-5xl font-black drop-shadow-md">{{ store.currentStreak || 0 }}</h2>
            </div>
            <h3 class="text-xl font-black tracking-widest uppercase mb-1">Días de Racha</h3>
            <p class="text-orange-100 text-xs font-bold">¡Vuelve a estudiar mañana para no perderla!</p>
        </div>

        <div class="p-4 sm:p-6 bg-slate-50 flex-1 overflow-y-auto">
            <h4 class="text-lg font-black text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Gift class="text-indigo-500" size="24" /> Retos de Hoy
            </h4>

            <div class="flex flex-col gap-3">
                <div v-for="mission in store.activeMissions" :key="mission.id"
                    :class="`p-4 rounded-2xl border-2 transition-all ${mission.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 shadow-sm'}`">

                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl filter drop-shadow-sm">{{ mission.icon }}</span>
                            <div>
                                <h5 class="font-black text-slate-800 leading-tight text-sm sm:text-base">{{ mission.title }}</h5>
                                <p class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{{ mission.desc }}</p>
                            </div>
                        </div>
                        
                        <div v-if="mission.completed" class="shrink-0 ml-2">
                            <CheckCircle class="text-green-500" size="28" fill="currentColor" stroke="white" />
                        </div>
                        <div v-else class="flex flex-col items-end gap-1 shrink-0 ml-2">
                            <span class="text-[10px] font-black text-slate-400 uppercase">Premio</span>
                            <div class="flex items-center gap-1">
                                <span class="font-black text-lg text-slate-700">{{ mission.rewardAmount }}</span>
                                <img :src="`/images/coin-${mission.rewardType}.png`" class="w-5 h-5 drop-shadow-sm" />
                            </div>
                        </div>
                    </div>

                    <div v-if="!mission.completed" class="mt-3">
                        <div class="flex justify-between text-[10px] font-black text-slate-400 mb-1 uppercase">
                            <span>Progreso</span>
                            <span>{{ mission.progress || 0 }} / {{ mission.target }}</span>
                        </div>
                        <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div class="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-500 rounded-full"
                                 :style="{ width: `${((mission.progress || 0) / mission.target) * 100}%` }">
                            </div>
                        </div>
                    </div>

                    <div v-else class="mt-2 text-[10px] sm:text-xs font-black text-green-700 bg-green-100 border border-green-200 py-1.5 px-3 rounded-lg inline-block w-full text-center uppercase tracking-widest">
                        ¡Recompensa en tu Banco!
                    </div>

                </div>

                <div v-if="!store.activeMissions || store.activeMissions.length === 0" class="text-center p-6 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                    <p class="text-slate-500 font-bold text-sm">El Búho está preparando tus misiones de hoy... 🦉</p>
                    
                    <button @click="store.generateNewMissions(); store.saveToStorage();" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-black py-2.5 px-5 rounded-xl text-xs transition-colors shadow-sm active:scale-95 flex items-center gap-2 uppercase tracking-wider">
                        🔄 Generar Misiones Ahora
                    </button>
                </div>
            </div>
        </div>

        <div class="p-4 bg-white border-t border-slate-100 shrink-0">
            <button @click="emit('close')" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 sm:py-4 rounded-xl shadow-[0_4px_0_rgb(30,41,59)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest text-sm">
                ¡A Jugar!
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { 
    from { opacity: 0; transform: scale(0.95) translateY(10px); } 
    to { opacity: 1; transform: scale(1) translateY(0); } 
}
</style>