<script setup>
import { Delete } from 'lucide-vue-next';

const emit = defineEmits(['press', 'delete']);

const keys = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [',', 0, 'del']
];

const handlePress = (key) => {
  if (key === 'del') {
    emit('delete');
  } else {
    emit('press', key);
  }
};
</script>

<template>
  <div class="w-full bg-slate-100 p-2 sm:p-4 rounded-t-3xl border-t-4 border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
    <div class="grid grid-cols-3 gap-2 sm:gap-3 max-w-sm mx-auto">
      <template v-for="(row, rowIndex) in keys" :key="rowIndex">
        <button
          v-for="key in row"
          :key="key"
          @pointerdown.stop.prevent="handlePress(key)"
          :class="[
            'h-14 sm:h-16 rounded-2xl text-2xl font-black flex items-center justify-center transition-all active:scale-95 touch-manipulation',
            key === 'del' ? 'bg-orange-100 text-orange-600 border-b-4 border-orange-300' : 
            key === ',' ? 'bg-teal-100 text-teal-700 border-b-4 border-teal-300 text-3xl' : 
            'bg-white text-slate-700 border-b-4 border-slate-300 hover:bg-slate-50'
          ]"
        >
          <Delete v-if="key === 'del'" :size="28" stroke-width="2.5" />
          <span v-else>{{ key }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.touch-manipulation { touch-action: manipulation; }
</style>