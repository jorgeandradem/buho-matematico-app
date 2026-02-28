<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  // Puede ser 'gold', 'silver' o 'copper'.
  type: { type: String, default: 'gold' },
  // Cantidad de monedas a generar
  count: { type: Number, default: 30 }
});

const coins = ref([]);

onMounted(() => {
  const newCoins = [];
  for (let i = 0; i < props.count; i++) {
    newCoins.push({
      id: i,
      // Posicionamiento aleatorio horizontal
      left: Math.random() * 100 + '%',
      // Duración de caída entre 1 y 3 segundos
      duration: Math.random() * 2 + 1 + 's',
      // Retraso para que no caigan todas al mismo tiempo
      delay: Math.random() * 0.5 + 's',
      // Rotación final aleatoria
      rotation: Math.random() * 360 + 'deg',
      // Tamaño entre 30px y 50px
      size: Math.random() * 20 + 30 + 'px' 
    });
  }
  coins.value = newCoins;
});
</script>

<template>
  <div class="coin-rain-container">
    <img 
      v-for="coin in coins" 
      :key="coin.id"
      :src="`/images/coin-${props.type}.png`" 
      class="falling-coin"
      :style="{ 
        left: coin.left, 
        width: coin.size, 
        height: coin.size,
        animationDuration: coin.duration, 
        animationDelay: coin.delay,
        '--rotation': coin.rotation
      }"
    />
  </div>
</template>

<style scoped>
.coin-rain-container {
  /* Se limita al contenedor padre para no desbordar la interfaz */
  position: absolute;
  top: 0; 
  left: 0; 
  right: 0;
  bottom: 0;
  pointer-events: none; 
  z-index: 9999; 
  overflow: hidden;
}

.falling-coin {
  position: absolute;
  top: -100px; /* Inicia fuera de la pantalla superior */
  object-fit: contain;
  animation-name: fall;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes fall {
  0% { 
    transform: translateY(0) rotate(0deg); 
    opacity: 1; 
  }
  85% { 
    opacity: 1; 
  }
  /* Cae hasta el final del alto dinámico del dispositivo */
  100% { 
    transform: translateY(110dvh) rotate(var(--rotation)); 
    opacity: 0; 
  }
}
</style>