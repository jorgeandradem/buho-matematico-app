<script setup>
// ARCHIVO: OwlImage.vue
// NOTA INTERNA: Modo Híbrido. Soporta el SVG clásico y el nuevo modo Video/Imagen Dinámico.

defineProps({
  customClass: {
    type: String,
    default: ''
  },
  // Si es true, activa el modo video/png. Si es false, dibuja el SVG clásico.
  isDynamic: {
    type: Boolean,
    default: false
  },
  // Recibe el estado de red desde la pantalla padre para saber qué archivo cargar
  isOnline: {
    type: Boolean,
    default: true
  }
});
</script>

<template>
  <div v-if="isDynamic" :class="['relative overflow-hidden', customClass]">
    <video 
      v-if="isOnline"
      src="/videos/buho_tech.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      class="w-full h-full object-contain scale-110"
    ></video>
    <img 
      v-else 
      src="/images/buho_estatico.png" 
      alt="Profesor Búho Offline" 
      class="w-full h-full object-contain scale-110"
    />
  </div>

  <svg v-else viewBox="0 0 200 200" :class="customClass" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bodyGrad" x1="100" y1="40" x2="100" y2="190" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#B45309" /> 
        <stop offset="100%" stopColor="#78350F" /> 
      </linearGradient>
      <linearGradient id="bellyGrad" x1="100" y1="100" x2="100" y2="190" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF3C7" /> 
        <stop offset="100%" stopColor="#FDE68A" /> 
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="0" dy="2" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g transform="translate(0, 5)">
      <path d="M75 185 L70 195 L80 195 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M85 185 L85 195 L95 195 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M115 185 L110 195 L120 195 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M125 185 L125 195 L135 195 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="3" strokeLinejoin="round"/>
    </g>
    <ellipse cx="100" cy="120" rx="65" ry="70" fill="url(#bodyGrad)" filter="url(#softShadow)"/>
    <path d="M100 95 C80 95 65 125 65 160 C65 175 80 185 100 185 C120 185 135 175 135 160 C135 125 120 95 100 95 Z" fill="url(#bellyGrad)"/>
    <path d="M85 120 Q100 130 115 120" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <path d="M80 140 Q100 150 120 140" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <path d="M90 160 Q100 165 110 160" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    <path d="M35 110 C35 110 20 150 50 170" fill="#78350F" stroke="#451A03" strokeWidth="2"/>
    <path d="M165 110 C165 110 180 150 150 170" fill="#78350F" stroke="#451A03" strokeWidth="2"/>
    <circle cx="72" cy="90" r="28" fill="#FFFBEB" stroke="#D97706" strokeWidth="2"/>
    <circle cx="128" cy="90" r="28" fill="#FFFBEB" stroke="#D97706" strokeWidth="2"/>
    <circle cx="72" cy="90" r="14" fill="#3B82F6" stroke="#2563EB" strokeWidth="1"/>
    <circle cx="72" cy="90" r="7" fill="#1F2937"/>
    <circle cx="75" cy="87" r="3" fill="white" opacity="0.9"/>
    <circle cx="128" cy="90" r="14" fill="#3B82F6" stroke="#2563EB" strokeWidth="1"/>
    <circle cx="128" cy="90" r="7" fill="#1F2937"/>
    <circle cx="131" cy="87" r="3" fill="white" opacity="0.9"/>
    <circle cx="72" cy="90" r="20" fill="none" stroke="#374151" strokeWidth="3"/>
    <circle cx="128" cy="90" r="20" fill="none" stroke="#374151" strokeWidth="3"/>
    <line x1="92" y1="90" x2="108" y2="90" stroke="#374151" strokeWidth="3"/>
    <path d="M90 110 L100 125 L110 110 Q100 105 90 110 Z" fill="#F97316" stroke="#C2410C" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M55 65 Q72 55 85 65" fill="none" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/>
    <path d="M115 65 Q128 55 145 65" fill="none" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/>
    <path d="M85 175 L85 190 L100 182 L115 190 L115 175 L100 182 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1"/>
    <circle cx="100" cy="182" r="4" fill="#B91C1C"/>
    <path d="M45 70 L30 35 L70 60" fill="#78350F" stroke="#451A03" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M155 70 L170 35 L130 60" fill="#78350F" stroke="#451A03" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
</template>