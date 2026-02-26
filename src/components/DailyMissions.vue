<script setup>
import { ref, onMounted } from 'vue';
import { X, Flame, CheckCircle, Gift, RefreshCw } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';

// --- CONEXIÓN FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from "firebase/firestore";

const emit = defineEmits(['close']);
const store = useGamificationStore();

const syncMissionsToCloud = async () => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      "stats.racha": store.currentStreak,
      "stats.activeMissions": store.activeMissions, 
      lastActivity: Date.now()
    });
  } catch (e) {
    console.error("Error sincronizando misiones:", e);
  }
};

const handleGenerateMissions = async () => {
    store.generateNewMissions();
    store.saveToStorage();
    await syncMissionsToCloud();
};

onMounted(() => {
    if (!store.activeMissions || store.activeMissions.length === 0) {
        handleGenerateMissions();
    } else {
        syncMissionsToCloud();
    }
});
</script>

<template>
  <div class="absolute inset-0 z-[150] bg-white flex flex-col h-[100dvh] w-full animate-fade-in font-sans overflow-hidden">
    
    <div class="bg-gradient-to-br from-orange-400 to-red-500 pt-8 pb-4 px-6 text-center relative text-white shrink-0 shadow-lg">
        <button @click="emit('close')" class="absolute top-6 right-5 bg-white/20 p-1.5 rounded-full active:scale-90 transition-all">
            <X size="20" />
        </button>
        
        <div class="flex justify-center items-center gap-2">
            <Flame size="36" class="text-yellow-300 animate-pulse" fill="currentColor" />
            <h2 class="text-6xl font-black drop-shadow-md leading-none">{{ store.currentStreak || 0 }}</h2>
        </div>
        <h3 class="text-lg font-black tracking-widest uppercase mt-1">Días de Racha</h3>
        <p class="text-orange-50 text-[10px] font-bold italic opacity-90 leading-none">¡Ciclo de 7 días para premios épicos!</p>
    </div>

    <div class="flex-1 bg-slate-50 px-5 py-4 flex flex-col overflow-hidden">
        <div class="flex justify-between items-center mb-3 shrink-0 px-1">
            <h4 class="text-base font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Gift class="text-indigo-600" size="20" /> Retos de Hoy
            </h4>
            <button @click="handleGenerateMissions" 
                    class="bg-indigo-50 text-indigo-600 p-2 rounded-xl border border-indigo-100 shadow-sm active:rotate-180 transition-all">
                <RefreshCw size="16" stroke-width="3" />
            </button>
        </div>

        <div class="flex flex-col gap-3 flex-1 justify-center max-w-[400px] mx-auto w-full">
            <div v-for="mission in store.activeMissions" :key="mission.id"
                :class="`p-4 rounded-[1.8rem] border-2 transition-all duration-300 ${mission.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 shadow-sm'}`">

                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <span class="text-3xl filter drop-shadow-sm">{{ mission.icon }}</span>
                        <div>
                            <h5 class="font-black text-slate-900 leading-none text-base uppercase tracking-tight">{{ mission.title }}</h5>
                            <p class="text-[11px] font-bold text-slate-500 uppercase mt-1.5 leading-none tracking-tight">{{ mission.desc }}</p>
                        </div>
                    </div>
                    
                    <div v-if="mission.completed" class="shrink-0 animate-bounce">
                        <CheckCircle class="text-green-500" size="26" fill="currentColor" stroke="white" />
                    </div>
                    <div v-else class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                        <span class="font-black text-sm text-slate-700 leading-none">{{ mission.rewardAmount }}</span>
                        <img :src="`/images/coin-${mission.rewardType}.png`" class="w-4 h-4" />
                    </div>
                </div>

                <div v-if="!mission.completed" class="mt-3">
                    <div class="flex justify-between text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">
                        <span>Progreso</span>
                        <span class="text-indigo-600">{{ mission.progress || 0 }} / {{ mission.target }}</span>
                    </div>
                    <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                        <div class="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-1000"
                             :style="{ width: `${Math.min(((mission.progress || 0) / mission.target) * 100, 100)}%` }">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="p-5 bg-white border-t border-slate-50 shrink-0 pb-10">
        <button @click="emit('close')" 
                class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(67,56,202)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-[0.2em] text-xs border-t border-indigo-400">
            ¡Entendido!
        </button>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>