<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { RefreshCw, X } from 'lucide-vue-next'

// 🦉 El motor que detecta si hay cambios en GitHub/Vercel
const { needRefresh, updateServiceWorker } = useRegisterSW()

const close = () => {
  needRefresh.value = false
}
</script>

<template>
  <div v-if="needRefresh" 
       class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-pop-in">
    <div class="bg-indigo-900 text-white p-4 rounded-3xl shadow-2xl border-2 border-yellow-400 flex items-center gap-4">
      <div class="bg-yellow-400 p-2 rounded-2xl text-indigo-900">
        <RefreshCw class="animate-spin-slow" :size="24" />
      </div>
      
      <div class="flex-1">
        <p class="text-xs font-black uppercase tracking-widest text-yellow-300">¡Nueva Versión!</p>
        <p class="text-[11px] font-medium leading-tight opacity-90">Hay mejoras listas en el nido para tu Búho.</p>
      </div>

      <div class="flex flex-col gap-2">
        <button @click="updateServiceWorker()" 
                class="bg-white text-indigo-900 text-[10px] font-black px-3 py-2 rounded-xl uppercase hover:bg-yellow-100 transition-colors">
          Actualizar
        </button>
        <button @click="close" class="text-white/50 hover:text-white flex justify-center">
          <X :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8) translateY(40px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.animate-spin-slow { animation: spin 3s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>