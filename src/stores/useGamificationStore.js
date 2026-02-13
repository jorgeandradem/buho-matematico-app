// src/stores/useGamificationStore.js
import { defineStore } from 'pinia';

// Clave para guardar en el almacenamiento local del navegador
const STORAGE_KEY = 'buho-matematico-tesoro-v1';

export const useGamificationStore = defineStore('gamification', {
  // 1. ESTADO (State)
  state: () => ({
    copper: 0,
    silver: 0,
    gold: 0,

    sessionCopperEarned: 0,
    sessionSilverEarned: 0,
    sessionGoldEarned: 0,

    showSessionSummary: false,
    
    // NUEVO: La "Mochila" donde guardaremos el historial de tickets comprados
    purchasedItems: [] 
  }),

  getters: {
    totalWealthInCopper: (state) => {
      return state.copper + (state.silver * 100) + (state.gold * 10000);
    }
  },

  actions: {
    // Ingresar Monedas
    addCoins(type, amount) {
      const safeAmount = Math.abs(parseInt(amount)) || 0;
      if (safeAmount === 0) return;

      switch (type) {
        case 'copper':
          this.copper += safeAmount;
          this.sessionCopperEarned += safeAmount;
          break;
        case 'silver':
          this.silver += safeAmount;
          this.sessionSilverEarned += safeAmount;
          break;
        case 'gold':
          this.gold += safeAmount;
          this.sessionGoldEarned += safeAmount;
          break;
        default: return;
      }

      this.processConversions();
      this.saveToStorage();
    },

    // Gastar Monedas
    spendCoins(type, amount) {
      const safeAmount = Math.abs(parseInt(amount)) || 0;
      if (safeAmount === 0) return false;

      if (type === 'gold' && this.gold >= safeAmount) {
          this.gold -= safeAmount;
      } else if (type === 'silver' && this.silver >= safeAmount) {
          this.silver -= safeAmount;
      } else if (type === 'copper' && this.copper >= safeAmount) {
          this.copper -= safeAmount;
      } else {
          return false; // Fondos insuficientes
      }

      this.saveToStorage();
      return true; // Compra exitosa
    },

    // NUEVO: Guardar el ticket en la mochila
    saveTicket(ticket) {
        // 'unshift' lo agrega al principio de la lista (el más nuevo arriba)
        this.purchasedItems.unshift(ticket);
        this.saveToStorage();
    },

    // NUEVO: Reembolsar (Deshacer la última compra)
    refundLastPurchase() {
        if (this.purchasedItems.length === 0) return null;
        
        // Sacamos el último ticket de la mochila
        const lastTicket = this.purchasedItems.shift(); 
        
        // Devolvemos el dinero al banco
        if (lastTicket.type === 'gold') this.gold += lastTicket.cost;
        else if (lastTicket.type === 'silver') this.silver += lastTicket.cost;
        else if (lastTicket.type === 'copper') this.copper += lastTicket.cost;
        
        this.processConversions(); 
        this.saveToStorage();
        
        return lastTicket; // Devolvemos el ticket borrado para avisar en pantalla
    },

    // NUEVO: Reset de Fábrica (Borrar Todo)
    hardReset() {
        this.copper = 0;
        this.silver = 0;
        this.gold = 0;
        this.sessionCopperEarned = 0;
        this.sessionSilverEarned = 0;
        this.sessionGoldEarned = 0;
        this.purchasedItems = []; // Vaciamos la mochila
        
        this.saveToStorage();
        console.log('⚠️ RESET TOTAL EJECUTADO. Cuenta en cero.');
    },

    // Conversiones
    processConversions() {
      let converted = false;
      while (this.copper >= 100) {
        this.copper -= 100;
        this.silver += 1;
        converted = true;
      }
      while (this.silver >= 100) {
        this.silver -= 100;
        this.gold += 1;
        converted = true;
      }
    },

    // Guardar en Navegador
    saveToStorage() {
      try {
        const dataToSave = {
          copper: this.copper,
          silver: this.silver,
          gold: this.gold,
          purchasedItems: this.purchasedItems // Guardamos la mochila
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Error al guardar el tesoro:', e);
      }
    },

    // Cargar desde Navegador
    loadFromStorage() {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          this.copper = parseInt(parsedData.copper) || 0;
          this.silver = parseInt(parsedData.silver) || 0;
          this.gold = parseInt(parsedData.gold) || 0;
          // Cargamos la mochila (si el jugador es antiguo y no tiene, le ponemos arreglo vacío [])
          this.purchasedItems = parsedData.purchasedItems || []; 
        }
      } catch (e) {
        console.error('Error al cargar el tesoro:', e);
      }
    },

    triggerSessionSummary() {
        if (this.sessionCopperEarned > 0 || this.sessionSilverEarned > 0 || this.sessionGoldEarned > 0) {
            this.showSessionSummary = true;
        }
    },

    closeSessionSummary() {
      this.showSessionSummary = false;
      this.sessionCopperEarned = 0;
      this.sessionSilverEarned = 0;
      this.sessionGoldEarned = 0;
    }
  },
});