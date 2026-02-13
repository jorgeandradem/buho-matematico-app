<script setup>
import { computed, ref } from 'vue';
import { X } from 'lucide-vue-next'; // Importamos la X para cerrar
import QrcodeVue from 'qrcode.vue';
import html2canvas from 'html2canvas';

const props = defineProps({
  product: Object
});

const emit = defineEmits(['close', 'share']);

// Referencias para la captura de imagen
const ticketRef = ref(null);
const isDownloading = ref(false);

// NUEVO QR Web-Link: Genera una URL segura hacia el validador aislado
const qrValue = computed(() => {
    if (!props.product) return '';
    
    // Obtenemos el dominio actual (localhost en tu PC, o el .vercel.app en internet)
    const baseUrl = window.location.origin;
    
    // Empaquetamos los datos en la URL
    const params = new URLSearchParams({
        name: props.product.name,
        icon: props.product.icon,
        cost: props.product.cost,
        type: props.product.type,
        code: props.product.code
    });
    
    // El QR ahora es un enlace limpio a la página fantasma (validator.html)
    return `${baseUrl}/validator.html?${params.toString()}`;
});

// FUNCIÓN MÁGICA PARA COMPARTIR/GUARDAR COMO IMAGEN NATIVA
const shareOrDownloadImage = async () => {
    if (!ticketRef.value) return;
    isDownloading.value = true;
    
    try {
        const canvas = await html2canvas(ticketRef.value, {
            scale: 2, // Alta calidad
            backgroundColor: null, 
            useCORS: true
        });
        
        // Convertimos el Canvas en un archivo real tipo Blob (Imagen)
        canvas.toBlob(async (blob) => {
            if (!blob) {
                isDownloading.value = false;
                return;
            }

            const fileName = `Vale_Buho_${props.product.name.replace(/\s+/g, '_')}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            // MAGIA PARA IPHONE / ANDROID: Comprueba si el celular soporta compartir archivos nativos
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Mi Vale del Búho',
                        text: '¡Mira el premio que gané en El Búho Matemático!'
                    });
                } catch (shareError) {
                    console.log('El usuario cerró el menú de compartir:', shareError);
                }
            } else {
                // FALLBACK: Si está en PC, hace la descarga normal
                const link = document.createElement('a');
                link.download = fileName;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
            
            isDownloading.value = false;
        }, 'image/png');

    } catch (error) {
        console.error("Error al generar la imagen", error);
        isDownloading.value = false;
    }
};
</script>

<template>
  <div class="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
    
    <button @click="emit('close')" class="absolute top-4 right-4 z-[110] bg-white/20 text-white p-2 rounded-full hover:bg-white/40 active:scale-95 transition-all backdrop-blur-md">
        <X size="24" />
    </button>

    <div class="w-full max-w-sm flex flex-col items-center">

      <div ref="ticketRef" class="bg-white w-full rounded-t-3xl relative overflow-hidden shadow-2xl flex flex-col shrink-0">
        
        <div class="h-4 sm:h-6 w-full bg-yellow-400 flex items-center justify-center shrink-0">
            <div class="w-16 sm:w-20 h-1 bg-yellow-600/30 rounded-full"></div>
        </div>

        <div class="p-4 sm:p-6 text-center flex flex-col items-center justify-center flex-1">
            <h3 class="font-black text-indigo-900 text-xl sm:text-2xl tracking-widest uppercase mb-1">¡VALE CANJEADO!</h3>
            <p class="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 sm:mb-4 border-b-2 border-dashed border-slate-200 pb-2 w-full">Muestra este ticket</p>

            <div class="text-5xl sm:text-6xl mb-2 sm:mb-3 filter drop-shadow-lg transform rotate-3">{{ product.icon }}</div>
            <h4 class="text-lg sm:text-xl font-black text-slate-800 leading-tight mb-3">{{ product.name }}</h4>

            <div class="p-2 sm:p-3 bg-white border-2 sm:border-4 border-dashed border-indigo-200 rounded-xl sm:rounded-2xl shadow-inner inline-block mb-3 transition-transform hover:scale-105">
                <QrcodeVue :value="qrValue" :size="130" level="H" />
            </div>

            <div class="bg-slate-50 rounded-xl p-2 sm:p-3 w-full border border-slate-100 flex justify-between items-center">
                <div class="text-left">
                    <p class="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Costo</p>
                    <p class="text-xs sm:text-sm font-black text-slate-700">{{ product.cost }} <span class="capitalize">{{ product.type }}</span></p>
                </div>
                <div class="text-right">
                    <p class="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Seguridad</p>
                    <p class="text-xs sm:text-sm font-mono font-black text-indigo-600">#{{ product.code }}</p>
                </div>
            </div>
        </div>

        <div class="ticket-teeth shrink-0"></div>
      </div>

      <div class="w-full mt-3 sm:mt-5 flex flex-col gap-2 sm:gap-3 px-2 sm:px-0 shrink-0">
         <button @click="emit('share')" class="w-full py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-[0_4px_0_rgb(22,163,74)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2">
            💬 Enviar Aviso (Solo Texto)
         </button>
         
         <button @click="shareOrDownloadImage" :disabled="isDownloading" class="w-full py-2.5 sm:py-3 bg-blue-500 hover:bg-blue-600 text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-[0_4px_0_rgb(37,99,235)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2">
            📸 {{ isDownloading ? 'Procesando...' : 'Compartir o Guardar Foto' }}
         </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { 
    from { opacity: 0; transform: scale(0.9) translateY(20px); } 
    to { opacity: 1; transform: scale(1) translateY(0); } 
}

/* Efecto CSS para el borde dentado */
.ticket-teeth {
  height: 20px;
  width: 100%;
  background: radial-gradient(circle at 10px 20px, transparent 12px, white 13px) top left;
  background-size: 20px 20px;
  background-repeat: repeat-x;
  transform: translateY(2px);
}
</style>