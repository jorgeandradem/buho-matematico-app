<script setup>
import { ref, onMounted } from 'vue';
import { X, Flame, CheckCircle, Gift, RefreshCw } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';

// --- CONEXIÓN FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from "firebase/firestore";

const emit = defineEmits(['close']);
const store = useGamificationStore();

// --- ☁️ SINCRONIZACIÓN CORREGIDA (v2.8.1) ---
const syncMissionsToCloud = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    // IMPORTANTE: Guardamos dentro de "stats" para consistencia con el Store
    await updateDoc(userRef, {
      "stats.racha": store.currentStreak,
      "stats.activeMissions": store.activeMissions, 
      lastActivity: Date.now()
    });
    console.log("☁️ Racha y Retos sincronizados en la nube.");
  } catch (e) {
    console.error("Error sincronizando misiones:", e);
  }
};

const handleGenerateMissions = async () => {
    // 1. Generar localmente usando la lógica inteligente (1 de cada tipo)
    store.generateNewMissions();
    store.saveToStorage();
    
    // 2. Subir inmediatamente a Firebase
    await syncMissionsToCloud();
};

onMounted(() => {
    // SEGURIDAD: Si el modal abre y no hay misiones, las creamos al vuelo
    if (!store.activeMissions || store.activeMissions.length === 0) {
        console.log("🔄 Inicializando misiones desde el modal...");
        handleGenerateMissions();
    } else {
        // Si ya existen, solo nos aseguramos que la nube esté al día
        syncMissionsToCloud();
    }
});
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
            <p class="text-orange-100 text-xs font-bold italic">¡Ciclo de 7 días para premios épicos!</p>
        </div>

        <div class="p-4 sm:p-6 bg-slate-50 flex-1 overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-lg font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Gift class="text-indigo-500" size="24" /> Retos de Hoy
                </h4>
                <button @click="handleGenerateMissions" class="text-slate-300 hover:text-indigo-500 transition-colors">
                    <RefreshCw size="16" />
                </button>
            </div>

            <div class="flex flex-col gap-3">
                <div v-for="mission in store.activeMissions" :key="mission.id"
                    :class="`p-4 rounded-2xl border-2 transition-all duration-300 ${mission.completed ? 'bg-green-50 border-green-200 scale-[0.98]' : 'bg-white border-slate-200 shadow-sm'}`">

                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl filter drop-shadow-sm">{{ mission.icon }}</span>
                            <div>
                                <h5 class="font-black text-slate-800 leading-tight text-sm sm:text-base">{{ mission.title }}</h5>
                                <p class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{{ mission.desc }}</p>
                            </div>
                        </div>
                        
                        <div v-if="mission.completed" class="shrink-0 ml-2 animate-bounce">
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
                            <div class="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-700 rounded-full"
                                 :style="{ width: `${Math.min(((mission.progress || 0) / mission.target) * 100, 100)}%` }">
                            </div>
                        </div>
                    </div>

                    <div v-else class="mt-2 text-[10px] sm:text-xs font-black text-green-700 bg-green-200/50 border border-green-200 py-1.5 px-3 rounded-lg inline-block w-full text-center uppercase tracking-widest animate-fade-in">
                        ¡Misión Cumplida! 🏆
                    </div>
                </div>

                <div v-if="!store.activeMissions || store.activeMissions.length === 0" class="text-center p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <p class="text-slate-400 font-bold text-sm">Cocinando nuevos retos...</p>
                </div>
            </div>
        </div>

        <div class="p-4 bg-white border-t border-slate-100 shrink-0">
            <button @click="emit('close')" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-[0_4px_0_rgb(30,41,59)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest text-sm">
                ¡Entendido!
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { 
    from { opacity: 0; transform: scale(0.95) translateY(10px); } 
    to { opacity: 1; transform: scale(1) translateY(0); } 
}
</style>