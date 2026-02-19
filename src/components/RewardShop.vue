<script setup>
import { ref, computed, onMounted } from 'vue';
import { X, ShoppingBag, Settings, Save, Backpack, Lock, Loader2 } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import RewardTicket from './RewardTicket.vue';

// --- IMPORTACIONES FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, increment } from "firebase/firestore";
// ----------------------------------

const emit = defineEmits(['close']);
const store = useGamificationStore();

const activeTab = ref('gold'); 
const selectedProduct = ref(null); 
const productToConfirm = ref(null); 
const showSettings = ref(false);
const parentPhone = ref('');

// --- NUEVO ESTADO DE PROCESAMIENTO (Loading) ---
const isProcessing = ref(false);

const mathChallenge = ref(null);
const mathAnswer = ref('');
const pendingAction = ref(null); 

// --- INVENTARIO (90 PRODUCTOS) ---
const rawInventory = [
    // --- 🟠 NIVEL COBRE ---
    { id: 'c1', name: 'Un Abrazo de Oso', cost: 50, type: 'copper', icon: '🐻', desc: 'Un abrazo fuerte y cariñoso' },
    { id: 'c2', name: 'Chocar los 5', cost: 20, type: 'copper', icon: '✋', desc: '¡Dame esos cinco!' },
    { id: 'c3', name: 'Una Pegatina', cost: 100, type: 'copper', icon: '⭐', desc: 'Para tu colección' },
    { id: 'c4', name: 'Un Chicle', cost: 150, type: 'copper', icon: '🍬', desc: 'Sabor a frutas' },
    { id: 'c5', name: 'Cosquillas (1 min)', cost: 80, type: 'copper', icon: '🤣', desc: 'Ataque de risa garantizado' },
    { id: 'c6', name: 'Elegir Canción Coche', cost: 100, type: 'copper', icon: '🎵', desc: 'Tú eres el DJ hoy' },
    { id: 'c7', name: 'Vaso Leche Choco', cost: 120, type: 'copper', icon: '🥛', desc: 'Bebida deliciosa' },
    { id: 'c8', name: 'Dibujo Sorpresa', cost: 50, type: 'copper', icon: '🎨', desc: 'Te hago un dibujo' },
    { id: 'c9', name: 'Chiste de Papá', cost: 30, type: 'copper', icon: '🤡', desc: 'Prepárate para reír (o no)' },
    { id: 'c10', name: 'Una Piruleta', cost: 150, type: 'copper', icon: '🍭', desc: 'Dulce y redonda' },
    { id: 'c11', name: '5 min extra Tablet', cost: 250, type: 'copper', icon: '📱', desc: 'Un poquito más' },
    { id: 'c12', name: 'Elegir el Postre', cost: 200, type: 'copper', icon: '🍮', desc: 'Hoy mandas tú en el postre' },
    { id: 'c13', name: 'Guerra Almohadas', cost: 150, type: 'copper', icon: '🛏️', desc: 'Batalla suave' },
    { id: 'c14', name: 'Peinado Loco', cost: 100, type: 'copper', icon: '💇', desc: 'Hazme un peinado divertido' },
    { id: 'c15', name: 'Masaje de Pies', cost: 200, type: 'copper', icon: '🦶', desc: 'Relax total' },
    { id: 'c16', name: 'Una Nube (Chuche)', cost: 100, type: 'copper', icon: '☁️', desc: 'Esponjosa' },
    { id: 'c17', name: 'Bailar una canción', cost: 50, type: 'copper', icon: '💃', desc: 'Fiesta improvisada' },
    { id: 'c18', name: 'Hacer una mueca', cost: 20, type: 'copper', icon: '🤪', desc: 'La cara más rara' },
    { id: 'c19', name: 'Un globo', cost: 100, type: 'copper', icon: '🎈', desc: 'Para jugar' },
    { id: 'c20', name: 'Grabar un audio', cost: 80, type: 'copper', icon: '🎤', desc: 'Mensaje de voz divertido' },
    { id: 'c21', name: 'Pintarse la cara', cost: 150, type: 'copper', icon: '🖌️', desc: 'Como un tigre o mariposa' },
    { id: 'c22', name: 'Un caramelo', cost: 80, type: 'copper', icon: '🍬', desc: 'Pequeño premio dulce' },
    { id: 'c23', name: 'Saltar en la cama', cost: 200, type: 'copper', icon: '🦘', desc: 'Solo 1 minuto' },
    { id: 'c24', name: 'Leer cuento corto', cost: 100, type: 'copper', icon: '📖', desc: 'Historia rápida' },
    { id: 'c25', name: 'Un beso sonoro', cost: 40, type: 'copper', icon: '💋', desc: '¡Muac!' },
    { id: 'c26', name: 'Avión de papel', cost: 90, type: 'copper', icon: '✈️', desc: 'Volando voy' },
    { id: 'c27', name: 'Beber con pajita', cost: 60, type: 'copper', icon: '🥤', desc: 'Es más divertido' },
    { id: 'c28', name: 'Ver fotos bebé', cost: 100, type: 'copper', icon: '👶', desc: 'Qué pequeño eras' },
    { id: 'c29', name: 'Jugar al Veo Veo', cost: 50, type: 'copper', icon: '👀', desc: 'Adivina qué veo' },
    { id: 'c30', name: 'Andar a caballito', cost: 250, type: 'copper', icon: '🐎', desc: '¡Arre!' },

    // --- ⚪ NIVEL PLATA ---
    { id: 's1', name: 'Huevo Sorpresa', cost: 25, type: 'silver', icon: '🥚', desc: 'Chocolate y juguete' },
    { id: 's2', name: 'Sobre de Cartas', cost: 30, type: 'silver', icon: '🃏', desc: 'Para tu álbum' },
    { id: 's3', name: 'Ir al Parque', cost: 20, type: 'silver', icon: '🌳', desc: 'Tú eliges cuál' },
    { id: 's4', name: 'Helado Pequeño', cost: 25, type: 'silver', icon: '🍦', desc: 'Refrescante' },
    { id: 's5', name: '15 min Tablet', cost: 40, type: 'silver', icon: '🎮', desc: 'Tiempo extra de juego' },
    { id: 's6', name: 'Ayudar a Cocinar', cost: 15, type: 'silver', icon: '🍕', desc: 'Chef por un día' },
    { id: 's7', name: 'Ver YouTube (20m)', cost: 30, type: 'silver', icon: '📺', desc: 'Tus videos favoritos' },
    { id: 's8', name: 'Boli de Colores', cost: 35, type: 'silver', icon: '🖊️', desc: 'Para dibujar bonito' },
    { id: 's9', name: 'Libreta Pequeña', cost: 30, type: 'silver', icon: '📓', desc: 'Para tus notas' },
    { id: 's10', name: 'Bolsa Gusanitos', cost: 20, type: 'silver', icon: '🥨', desc: 'Saladitos' },
    { id: 's11', name: 'Juego de Mesa', cost: 15, type: 'silver', icon: '🎲', desc: 'Una partida juntos' },
    { id: 's12', name: 'Pintar Témperas', cost: 25, type: 'silver', icon: '🎨', desc: 'Arte con pinceles' },
    { id: 's13', name: 'Elegir Merienda', cost: 20, type: 'silver', icon: '🥪', desc: 'Lo que tú quieras' },
    { id: 's14', name: 'Un Comic Corto', cost: 40, type: 'silver', icon: '📚', desc: 'Lectura divertida' },
    { id: 's15', name: 'Pompero', cost: 35, type: 'silver', icon: '🫧', desc: 'Hacer burbujas' },
    { id: 's16', name: 'Hacer Slime', cost: 45, type: 'silver', icon: '🧪', desc: 'Experimento casero' },
    { id: 's17', name: 'No recoger mesa', cost: 50, type: 'silver', icon: '🍽️', desc: 'Te libras por hoy' },
    { id: 's18', name: 'Elegir Peli Sábado', cost: 40, type: 'silver', icon: '🎬', desc: 'Cine en familia' },
    { id: 's19', name: 'Baño con espuma', cost: 20, type: 'silver', icon: '🛁', desc: 'Como en un spa' },
    { id: 's20', name: 'Hacer una cabaña', cost: 25, type: 'silver', icon: '⛺', desc: 'Con sábanas y cojines' },
    { id: 's21', name: 'Zumo especial', cost: 15, type: 'silver', icon: '🍹', desc: 'Sabor tropical' },
    { id: 's22', name: 'Barrita Chocolate', cost: 30, type: 'silver', icon: '🍫', desc: 'Delicioso premio' },
    { id: 's23', name: 'Pegatinas Brilli', cost: 35, type: 'silver', icon: '✨', desc: 'Brillan mucho' },
    { id: 's24', name: 'Tarde Disfraces', cost: 20, type: 'silver', icon: '🎭', desc: 'Ser quien quieras' },
    { id: 's25', name: 'Jugar Plastilina', cost: 15, type: 'silver', icon: '🗿', desc: 'Crear figuras' },
    { id: 's26', name: 'Carrera coches', cost: 15, type: 'silver', icon: '🏎️', desc: 'A toda velocidad' },
    { id: 's27', name: 'Elegir ropa', cost: 20, type: 'silver', icon: '👕', desc: 'Tu outfit de mañana' },
    { id: 's28', name: 'Helado de hielo', cost: 20, type: 'silver', icon: '🧊', desc: 'Polo fresquito' },
    { id: 's29', name: 'Bolsa de Pipas', cost: 15, type: 'silver', icon: '🌻', desc: 'Para pelar' },
    { id: 's30', name: 'Hacer Galletas', cost: 40, type: 'silver', icon: '🍪', desc: 'Repostería rica' },

    // --- 🟡 NIVEL ORO ---
    { id: 'g1', name: 'Revista Favorita', cost: 8, type: 'gold', icon: '📖', desc: 'Con juguete de regalo' },
    { id: 'g2', name: 'Coche Juguete', cost: 5, type: 'gold', icon: '🚗', desc: 'Tipo Hot Wheels' },
    { id: 'g3', name: 'Cine Premium', cost: 6, type: 'gold', icon: '🍿', desc: 'En casa con palomitas' },
    { id: 'g4', name: 'Hamburguesa', cost: 10, type: 'gold', icon: '🍔', desc: 'Menú infantil' },
    { id: 'g5', name: 'Bolsa Lego', cost: 12, type: 'gold', icon: '🧱', desc: 'Para construir' },
    { id: 'g6', name: 'Slime Grande', cost: 8, type: 'gold', icon: '🟢', desc: 'Bote gigante' },
    { id: 'g7', name: 'Squishy', cost: 8, type: 'gold', icon: '🧸', desc: 'Para apretar' },
    { id: 'g8', name: '1h Videojuegos', cost: 10, type: 'gold', icon: '🎮', desc: 'Jugar con papá/mamá' },
    { id: 'g9', name: 'Elegir Cena', cost: 15, type: 'gold', icon: '🍕', desc: 'Pizza, etc.' },
    { id: 'g10', name: 'Excursión Bici', cost: 5, type: 'gold', icon: '🚲', desc: 'Aventura sobre ruedas' },
    { id: 'g11', name: 'Pijamada Salón', cost: 12, type: 'gold', icon: '⛺', desc: 'Dormir fuera de la cama' },
    { id: 'g12', name: 'Ir al Cine', cost: 20, type: 'gold', icon: '🎟️', desc: 'Ver estreno en sala' },
    { id: 'g13', name: 'Pistola Agua', cost: 8, type: 'gold', icon: '🔫', desc: 'Para el verano' },
    { id: 'g14', name: 'Libro Cuentos', cost: 15, type: 'gold', icon: '📘', desc: 'Nueva historia' },
    { id: 'g15', name: 'Peluche Peque', cost: 12, type: 'gold', icon: '🐻', desc: 'Nuevo amigo suave' },
    { id: 'g16', name: 'Rotuladores', cost: 10, type: 'gold', icon: '🖍️', desc: 'Caja nueva' },
    { id: 'g17', name: 'Tarde Playa/Río', cost: 10, type: 'gold', icon: '🏖️', desc: 'Naturaleza' },
    { id: 'g18', name: 'Desayuno Cama', cost: 8, type: 'gold', icon: '🥐', desc: 'Como un rey/reina' },
    { id: 'g19', name: 'Jugar Bolos', cost: 18, type: 'gold', icon: '🎳', desc: 'Partida en la bolera' },
    { id: 'g20', name: 'Puzzle Nuevo', cost: 12, type: 'gold', icon: '🧩', desc: 'Desafío mental' },
    { id: 'g21', name: 'Balón Espuma', cost: 8, type: 'gold', icon: '⚽', desc: 'Para jugar en casa' },
    { id: 'g22', name: 'Set Plastilina', cost: 10, type: 'gold', icon: '🗿', desc: 'Con moldes' },
    { id: 'g23', name: 'Helado Copa', cost: 8, type: 'gold', icon: '🍨', desc: 'Grande con toppings' },
    { id: 'g24', name: 'Parque Bolas', cost: 15, type: 'gold', icon: '🎪', desc: 'Entrada para saltar' },
    { id: 'g25', name: 'Planta propia', cost: 6, type: 'gold', icon: '🪴', desc: 'Para cuidar tú solo' },
    { id: 'g26', name: 'Dominó', cost: 8, type: 'gold', icon: '🁙', desc: 'Juego clásico' },
    { id: 'g27', name: 'Linterna', cost: 10, type: 'gold', icon: '🔦', desc: 'Para explorar' },
    { id: 'g28', name: 'Cuerda Saltar', cost: 6, type: 'gold', icon: '➰', desc: 'Ejercicio divertido' },
    { id: 'g29', name: 'Tarde sin tareas', cost: 20, type: 'gold', icon: '🚫', desc: 'Descanso total' },
    { id: 'g30', name: 'Invitar Amigo', cost: 15, type: 'gold', icon: '🤝', desc: 'Jugar en casa' }
];

const shuffledProducts = ref([]);

onMounted(() => {
    const savedPhone = localStorage.getItem('owlParentPhone');
    if (savedPhone) parentPhone.value = savedPhone;

    shuffledProducts.value = [...rawInventory].sort(() => Math.random() - 0.5);
    speak("¡Bienvenido a la tienda! Mira qué cosas nuevas hay hoy.");
});

const savePhone = () => {
    localStorage.setItem('owlParentPhone', parentPhone.value);
    showSettings.value = false;
    speak("Número guardado correctamente.");
};

const filteredProducts = computed(() => {
    if (activeTab.value === 'vales') return [];
    return shuffledProducts.value.filter(p => p.type === activeTab.value);
});

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

const executeBuy = async () => {
    const product = productToConfirm.value;
    if (!product || isProcessing.value) return;

    isProcessing.value = true; // Bloqueamos el botón

    try {
        // Ejecutamos el gasto en el Store asíncronamente
        const success = await store.spendCoins(product.type, product.cost);

        if (success) {
            const newTicket = {
                ...product,
                code: Math.random().toString(36).substr(2, 6).toUpperCase(),
                date: new Date().toLocaleDateString()
            };
            
            // Guardamos el ticket y sincronizamos la mochila
            await store.saveTicket(newTicket);
            
            productToConfirm.value = null;
            selectedProduct.value = newTicket;
            speak(`¡Genial! Has comprado ${product.name}.`);
        } else {
            speak("Hubo un problema con la compra. Inténtalo de nuevo.");
        }
    } catch (e) {
        console.error("Error en la ejecución de compra:", e);
    } finally {
        isProcessing.value = false; // Liberamos el botón
    }
};

const triggerParentalAction = (action) => {
    const num1 = Math.floor(Math.random() * 5) + 5; 
    const num2 = Math.floor(Math.random() * 5) + 5; 
    mathChallenge.value = {
        text: `¿Cuánto es ${num1} x ${num2}?`,
        answer: num1 * num2
    };
    mathAnswer.value = '';
    pendingAction.value = action;
};

const verifyParentalAction = async () => {
    if (parseInt(mathAnswer.value) === mathChallenge.value.answer) {
        if (pendingAction.value === 'refund') {
            const refundedTicket = await store.refundLastPurchase(); 
            if (refundedTicket) {
                speak(`Se ha devuelto el premio ${refundedTicket.name} y recuperaste las monedas.`);
            }
            else speak("No hay compras para devolver.");

        } else if (pendingAction.value === 'reset') {
            await store.hardReset(); 
            speak("El banco y la mochila han sido borrados por completo.");
            activeTab.value = 'gold'; 
        }
        cancelParentalAction();
        showSettings.value = false; 
    } else {
        speak("Respuesta incorrecta. Acceso denegado.");
        mathAnswer.value = ''; 
    }
};

const cancelParentalAction = () => {
    mathChallenge.value = null;
    mathAnswer.value = '';
    pendingAction.value = null;
};

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
                
                <div v-if="(item.type === 'gold' && store.gold < item.cost) || (item.type === 'silver' && store.silver < item.cost) || (item.type === 'copper' && store.copper < item.cost)" 
                     class="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                     <Lock class="text-slate-400 w-8 h-8" />
                </div>

                <div class="text-5xl group-hover:scale-110 transition-transform filter drop-shadow-md">{{ item.icon }}</div>
                <div class="text-center w-full">
                    <h3 class="font-black text-slate-700 text-sm leading-tight mb-1">{{ item.name }}</h3>
                    <p class="text-[10px] text-slate-400 font-bold leading-tight line-clamp-2 h-6 mb-2">{{ item.desc }}</p>
                    <div :class="`w-full py-1.5 rounded-lg font-black text-xs flex items-center justify-center gap-1 ${activeTab === 'gold' ? 'bg-yellow-100 text-yellow-700' : (activeTab === 'silver' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700')}`">
                        💳 {{ item.cost }}
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
                <button @click="productToConfirm = null" :disabled="isProcessing" class="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-300 active:scale-95 transition-all disabled:opacity-50">Cancelar</button>
                
                <button @click="executeBuy" :disabled="isProcessing" class="flex-1 py-3 bg-green-500 text-white rounded-xl font-black shadow-[0_4px_0_rgb(22,163,74)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center disabled:bg-green-700 disabled:shadow-none">
                    <span v-if="isProcessing" class="flex items-center gap-2">
                        <Loader2 class="animate-spin" size="20" /> Procesando...
                    </span>
                    <span v-else>¡Comprar!</span>
                </button>
            </div>
        </div>
    </div>

    <RewardTicket 
        v-if="selectedProduct" 
        :product="selectedProduct" 
        :parentPhone="parentPhone"
        @close="selectedProduct = null" 
        @share="shareReward" 
    />

  </div>
</template>

<style scoped>
.animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes slideUp { from { transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>