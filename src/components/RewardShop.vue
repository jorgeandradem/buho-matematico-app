<script setup>
import { ref, computed, onMounted } from 'vue';
import { X, ShoppingBag, Settings, Save, Backpack } from 'lucide-vue-next';
import { products } from '../data/products';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import RewardTicket from './RewardTicket.vue';

const emit = defineEmits(['close']);
const store = useGamificationStore();

const activeTab = ref('gold'); // 'gold', 'silver', 'copper', o 'vales'
const selectedProduct = ref(null); 
const productToConfirm = ref(null); 
const showSettings = ref(false);
const parentPhone = ref('');

// --- ZONA PARENTAL (RETO MATEMÁTICO) ---
const mathChallenge = ref(null);
const mathAnswer = ref('');
const pendingAction = ref(null); // 'refund' | 'reset'

onMounted(() => {
    const savedPhone = localStorage.getItem('owlParentPhone');
    if (savedPhone) parentPhone.value = savedPhone;
});

const savePhone = () => {
    localStorage.setItem('owlParentPhone', parentPhone.value);
    showSettings.value = false;
    speak("Número guardado correctamente.");
};

const filteredProducts = computed(() => {
    return products.filter(p => p.type === activeTab.value);
});

// PASO 1 DE COMPRA: Abrir cuadro de confirmación
const confirmBuy = (product) => {
    let hasFunds = false;
    if (product.type === 'gold' && store.gold >= product.cost) hasFunds = true;
    if (product.type === 'silver' && store.silver >= product.cost) hasFunds = true;
    if (product.type === 'copper' && store.copper >= product.cost) hasFunds = true;

    if (hasFunds) {
        productToConfirm.value = product;
        speak(`¿Seguro que quieres comprar ${product.name}?`);
    } else {
        speak("Aún te faltan monedas para este premio. ¡Sigue practicando!");
    }
};

// PASO 2 DE COMPRA: Ejecutar la compra definitiva
const executeBuy = () => {
    const product = productToConfirm.value;
    if (!product) return;

    const success = store.spendCoins(product.type, product.cost);

    if (success) {
        const newTicket = {
            ...product,
            code: Math.random().toString(36).substr(2, 6).toUpperCase(),
            date: new Date().toLocaleDateString()
        };
        
        store.saveTicket(newTicket); // Guardar en Mochila
        
        productToConfirm.value = null;
        selectedProduct.value = newTicket;
        speak(`¡Genial! Has comprado ${product.name}.`);
    }
};

// --- LÓGICA DE ZONA PARENTAL ---

// 1. Iniciar el reto
const triggerParentalAction = (action) => {
    const num1 = Math.floor(Math.random() * 5) + 5; // 5 al 9
    const num2 = Math.floor(Math.random() * 5) + 5; // 5 al 9
    mathChallenge.value = {
        text: `¿Cuánto es ${num1} x ${num2}?`,
        answer: num1 * num2
    };
    mathAnswer.value = '';
    pendingAction.value = action;
};

// 2. Verificar respuesta
const verifyParentalAction = () => {
    if (parseInt(mathAnswer.value) === mathChallenge.value.answer) {
        // Respuesta Correcta
        if (pendingAction.value === 'refund') {
            const refundedTicket = store.refundLastPurchase();
            if (refundedTicket) speak(`Se ha devuelto el premio y recuperaste las monedas.`);
            else speak("No hay compras para devolver.");
        } else if (pendingAction.value === 'reset') {
            store.hardReset();
            speak("El banco y la mochila han sido borrados por completo.");
            activeTab.value = 'gold'; // Sacarlo de la vista mochila por si estaba ahí
        }
        cancelParentalAction();
        showSettings.value = false; // Cerrar el panel
    } else {
        // Respuesta Incorrecta
        speak("Respuesta incorrecta. Acceso denegado.");
        mathAnswer.value = ''; // Limpiar para que intente de nuevo
    }
};

const cancelParentalAction = () => {
    mathChallenge.value = null;
    mathAnswer.value = '';
    pendingAction.value = null;
};

// --- OTRAS UTILIDADES ---
const viewTicket = (ticket) => {
    selectedProduct.value = ticket;
};

const shareReward = () => {
    if (!selectedProduct.value) return;
    const text = `🦉 ¡HOLA! He canjeado mis monedas en El Búho Matemático por: ${selectedProduct.value.name} ${selectedProduct.value.icon}. \n\nMi código de seguridad es: #${selectedProduct.value.code} \n\n¡Pídeme que te muestre mi ticket en la pantalla!`;
    const encodedText = encodeURIComponent(text);
    
    let url = "";
    if (parentPhone.value && parentPhone.value.length > 5) {
        const cleanPhone = parentPhone.value.replace(/\D/g,''); 
        url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    } else {
        url = `https://wa.me/?text=${encodedText}`;
    }
    window.open(url, '_blank');
};
</script>

<template>
  <div class="absolute inset-0 z-[90] bg-slate-100 flex flex-col font-sans animate-slide-up overflow-hidden">
    
    <div class="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md shrink-0">
        <div class="flex items-center gap-2">
            <ShoppingBag />
            <h2 class="text-xl font-black uppercase">Tienda</h2>
        </div>
        <div class="flex gap-2">
            <button @click="showSettings = !showSettings" class="bg-indigo-500 p-2 rounded-full hover:bg-indigo-400 transition shadow-inner">
                <Settings size="20" />
            </button>
            <button @click="emit('close')" class="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                <X size="20" />
            </button>
        </div>
    </div>

    <div v-if="showSettings" class="bg-indigo-800 p-4 text-white animate-fade-in shadow-inner shrink-0 z-20">
        <p class="text-xs font-bold mb-2 text-indigo-200">📞 TELÉFONO DEL PADRE/TUTOR:</p>
        <div class="flex gap-2">
            <input v-model="parentPhone" type="tel" placeholder="Ej: 5215512345678" 
                class="flex-1 px-3 py-2 rounded-lg text-slate-900 font-bold outline-none focus:ring-2 ring-yellow-400" />
            <button @click="savePhone" class="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <Save size="18" />
            </button>
        </div>
        
        <hr class="border-indigo-600 my-4" />
        
        <p class="text-[10px] font-black tracking-widest mb-2 text-orange-300 uppercase">⚠️ Zona Parental (Requiere validación)</p>
        
        <div v-if="!mathChallenge" class="flex gap-2">
            <button @click="triggerParentalAction('refund')" :disabled="!store.purchasedItems || store.purchasedItems.length === 0" class="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-black py-2 rounded-lg transition">
                ↩️ Devolver último
            </button>
            <button @click="triggerParentalAction('reset')" class="flex-1 bg-red-500 hover:bg-red-600 text-[11px] font-black py-2 rounded-lg transition">
                🔥 Reset Total
            </button>
        </div>
        
        <div v-else class="bg-indigo-900 p-3 rounded-lg border border-orange-400 animate-fade-in">
            <p class="text-[10px] font-bold text-orange-300 mb-2">Para confirmar la acción, resuelve:</p>
            <div class="flex items-center gap-2">
                <span class="font-black text-lg text-white">{{ mathChallenge.text }}</span>
                <input v-model="mathAnswer" type="number" class="w-16 px-2 py-1 rounded-md text-slate-900 font-black text-center outline-none focus:ring-2 ring-orange-400" placeholder="?" />
                <button @click="verifyParentalAction" class="bg-green-500 px-3 py-1.5 rounded-md font-black hover:bg-green-600 flex-1">OK</button>
                <button @click="cancelParentalAction" class="bg-slate-500 px-3 py-1.5 rounded-md font-black hover:bg-slate-600">X</button>
            </div>
        </div>
    </div>

    <div class="flex flex-col p-2 gap-2 bg-indigo-700 shrink-0 shadow-md z-10">
        <div class="flex gap-2">
            <button @click="activeTab = 'gold'" :class="`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${activeTab === 'gold' ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 text-yellow-900 shadow-lg scale-[1.02] border-b-4 border-yellow-600' : 'bg-indigo-800 text-indigo-300 hover:bg-indigo-600'}`">
                <img src="/images/coin-gold.png" class="w-4 h-4 drop-shadow-sm" /> {{ store.gold }}
            </button>
            <button @click="activeTab = 'silver'" :class="`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${activeTab === 'silver' ? 'bg-gradient-to-b from-slate-200 to-slate-400 text-slate-800 shadow-lg scale-[1.02] border-b-4 border-slate-500' : 'bg-indigo-800 text-indigo-300 hover:bg-indigo-600'}`">
                <img src="/images/coin-silver.png" class="w-4 h-4 drop-shadow-sm" /> {{ store.silver }}
            </button>
            <button @click="activeTab = 'copper'" :class="`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all ${activeTab === 'copper' ? 'bg-gradient-to-b from-orange-300 to-orange-500 text-orange-900 shadow-lg scale-[1.02] border-b-4 border-orange-600' : 'bg-indigo-800 text-indigo-300 hover:bg-indigo-600'}`">
                <img src="/images/coin-copper.png" class="w-4 h-4 drop-shadow-sm" /> {{ store.copper }}
            </button>
        </div>
        <button @click="activeTab = 'vales'" :class="`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'vales' ? 'bg-indigo-900 text-white shadow-inner border-2 border-indigo-400' : 'bg-indigo-800 text-indigo-300 hover:bg-indigo-500 border-2 border-transparent'}`">
            <Backpack size="18" /> Mi Mochila de Vales ({{ store.purchasedItems?.length || 0 }})
        </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 bg-slate-100">
        
        <div v-if="activeTab !== 'vales'" class="grid grid-cols-2 gap-4 pb-20">
            <button v-for="item in filteredProducts" :key="item.id" 
                @click="confirmBuy(item)"
                class="bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-300 p-4 flex flex-col items-center gap-3 active:scale-95 transition-all relative overflow-hidden group">
                <div class="text-5xl group-hover:scale-110 transition-transform filter drop-shadow-md">{{ item.icon }}</div>
                <div class="text-center w-full">
                    <h3 class="font-black text-slate-700 text-sm leading-tight mb-1">{{ item.name }}</h3>
                    <p class="text-[10px] text-slate-400 font-bold leading-tight line-clamp-2 h-6 mb-2">{{ item.desc }}</p>
                    <div :class="`w-full py-1.5 rounded-lg font-black text-xs flex items-center justify-center gap-1 ${activeTab === 'gold' ? 'bg-yellow-100 text-yellow-700' : (activeTab === 'silver' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700')}`">
                        💳 Pagar {{ item.cost }}
                    </div>
                </div>
            </button>
        </div>

        <div v-else class="pb-20">
            <div v-if="!store.purchasedItems || store.purchasedItems.length === 0" class="flex flex-col items-center justify-center mt-10 opacity-50">
                <Backpack size="64" class="text-slate-400 mb-4" />
                <h3 class="font-black text-xl text-slate-500 mb-2">Mochila Vacía</h3>
                <p class="text-slate-400 text-center text-sm font-bold px-8">Aún no has comprado nada. ¡Ve a la tienda y canjea tus monedas!</p>
            </div>
            <div v-else class="grid grid-cols-2 gap-4">
                <button v-for="ticket in store.purchasedItems" :key="ticket.code" 
                    @click="viewTicket(ticket)"
                    class="bg-indigo-50 rounded-2xl shadow-sm border-2 border-indigo-200 hover:border-indigo-400 p-3 flex flex-col items-center gap-2 active:scale-95 transition-all relative">
                    <div class="text-4xl filter drop-shadow-md">{{ ticket.icon }}</div>
                    <div class="text-center w-full bg-white p-2 rounded-xl">
                        <h3 class="font-black text-indigo-900 text-[11px] leading-tight mb-1">{{ ticket.name }}</h3>
                        <p class="text-[9px] text-slate-400 font-mono font-bold">CÓDIGO: #{{ ticket.code }}</p>
                        <p class="text-[9px] text-slate-400 font-bold mt-0.5">{{ ticket.date }}</p>
                    </div>
                </button>
            </div>
        </div>
    </div>

    <div v-if="productToConfirm" class="absolute inset-0 z-[95] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div class="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl border-4 border-indigo-500 flex flex-col items-center">
            <h3 class="text-xl font-black text-indigo-900 mb-2 uppercase tracking-wide">¿Confirmar Compra?</h3>
            <div class="text-6xl mb-2 filter drop-shadow-md transform rotate-3 scale-110">{{ productToConfirm.icon }}</div>
            <h4 class="font-black text-slate-800 leading-tight mb-2 text-xl">{{ productToConfirm.name }}</h4>
            <div class="bg-slate-100 px-4 py-2 rounded-xl mb-6 inline-block">
                <p class="text-xs text-slate-500 font-bold uppercase mb-1">Costo del premio</p>
                <p class="text-lg font-black text-slate-700">{{ productToConfirm.cost }} <span class="capitalize">{{ productToConfirm.type }}</span></p>
            </div>
            <div class="flex gap-3 w-full">
                <button @click="productToConfirm = null" class="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-300 active:scale-95 transition-all">Cancelar</button>
                <button @click="executeBuy" class="flex-1 py-3 bg-green-500 text-white rounded-xl font-black shadow-[0_4px_0_rgb(22,163,74)] active:translate-y-1 active:shadow-none transition-all">¡Comprar!</button>
            </div>
        </div>
    </div>

    <RewardTicket 
        v-if="selectedProduct" 
        :product="selectedProduct" 
        @close="selectedProduct = null" 
        @share="shareReward" 
    />

  </div>
</template>

<style scoped>
.animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>