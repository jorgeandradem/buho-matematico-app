// src/stores/useGamificationStore.js
import { defineStore } from 'pinia';
import { missionsData } from '../data/missions'; // Importamos las misiones base

// Clave para guardar en el almacenamiento local del navegador
const STORAGE_KEY = 'buho-matematico-tesoro-v1';

export const useGamificationStore = defineStore('gamification', {
  state: () => ({
    copper: 0,
    silver: 0,
    gold: 0,

    sessionCopperEarned: 0,
    sessionSilverEarned: 0,
    sessionGoldEarned: 0,

    showSessionSummary: false,
    
    // Mochila de premios
    purchasedItems: [],

    // --- NUEVO: SISTEMA DE RACHAS Y MISIONES ---
    currentStreak: 0,        // Días seguidos jugando
    lastPlayedDate: null,    // Fecha de la última vez que entró (formato YYYY-MM-DD)
    activeMissions: []       // Las 3 misiones de hoy
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
          // Si gana monedas en el juego, reportar a las misiones:
          this.updateMissionProgress('earn_copper', safeAmount);
          break;
        case 'silver':
          this.silver += safeAmount;
          this.sessionSilverEarned += safeAmount;
          this.updateMissionProgress('earn_silver', safeAmount);
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

      let success = false;
      if (type === 'gold' && this.gold >= safeAmount) {
          this.gold -= safeAmount; success = true;
      } else if (type === 'silver' && this.silver >= safeAmount) {
          this.silver -= safeAmount; success = true;
      } else if (type === 'copper' && this.copper >= safeAmount) {
          this.copper -= safeAmount; success = true;
      }

      if (success) {
          this.updateMissionProgress('buy_shop', 1); // Avisar a la misión de compra
          this.saveToStorage();
      }
      return success;
    },

    // Guardar el ticket
    saveTicket(ticket) {
        this.purchasedItems.unshift(ticket);
        this.saveToStorage();
    },

    // Reembolsar
    refundLastPurchase() {
        if (this.purchasedItems.length === 0) return null;
        const lastTicket = this.purchasedItems.shift(); 
        
        if (lastTicket.type === 'gold') this.gold += lastTicket.cost;
        else if (lastTicket.type === 'silver') this.silver += lastTicket.cost;
        else if (lastTicket.type === 'copper') this.copper += lastTicket.cost;
        
        this.processConversions(); 
        this.saveToStorage();
        return lastTicket; 
    },

    // Reset Total
    hardReset() {
        this.copper = 0;
        this.silver = 0;
        this.gold = 0;
        this.sessionCopperEarned = 0;
        this.sessionSilverEarned = 0;
        this.sessionGoldEarned = 0;
        this.purchasedItems = []; 
        this.currentStreak = 0;
        this.lastPlayedDate = null;
        this.activeMissions = [];
        
        this.saveToStorage();
        console.log('⚠️ RESET TOTAL EJECUTADO.');
    },

    // Conversiones
    processConversions() {
      while (this.copper >= 100) { this.copper -= 100; this.silver += 1; }
      while (this.silver >= 100) { this.silver -= 100; this.gold += 1; }
    },

    // Guardar en Memoria
    saveToStorage() {
      try {
        const dataToSave = {
          copper: this.copper,
          silver: this.silver,
          gold: this.gold,
          purchasedItems: this.purchasedItems,
          // Guardar sistema diario
          currentStreak: this.currentStreak,
          lastPlayedDate: this.lastPlayedDate,
          activeMissions: this.activeMissions
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Error al guardar:', e);
      }
    },

    // Cargar y Comprobar Días (El Motor del Tiempo)
    loadFromStorage() {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          this.copper = parseInt(parsedData.copper) || 0;
          this.silver = parseInt(parsedData.silver) || 0;
          this.gold = parseInt(parsedData.gold) || 0;
          this.purchasedItems = parsedData.purchasedItems || [];
          this.currentStreak = parsedData.currentStreak || 0;
          this.lastPlayedDate = parsedData.lastPlayedDate || null;
          this.activeMissions = parsedData.activeMissions || [];
        }
        
        // Comprobar la Racha Diaria siempre al abrir la app
        this.checkDailyStreak();
        
      } catch (e) {
        console.error('Error al cargar:', e);
      }
    },

    // --- MAGIA DEL TIEMPO: RACHAS Y MISIONES ---
    checkDailyStreak() {
        // Obtiene la fecha de hoy estilo "2024-10-25"
        const today = new Date().toLocaleDateString('en-CA'); 

        if (this.lastPlayedDate !== today) {
            
            // Si es un día nuevo (no es hoy), revisamos la racha
            if (this.lastPlayedDate) {
                const lastDate = new Date(this.lastPlayedDate);
                const currentDate = new Date(today);
                // Calculamos diferencia en días
                const diffTime = Math.abs(currentDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                if (diffDays === 1) {
                    this.currentStreak += 1; // Un día de diferencia = Aumenta racha
                } else if (diffDays > 1) {
                    this.currentStreak = 1; // Se rompió la racha (más de 1 día)
                }
            } else {
                this.currentStreak = 1; // Primera vez que juega
            }

            // Actualizamos la fecha a la de hoy
            this.lastPlayedDate = today;

            // --- GENERAR 3 MISIONES NUEVAS ---
            this.generateNewMissions();
            
            this.saveToStorage();
        }
    },

    generateNewMissions() {
        // Copiamos la base de datos de misiones para no modificar la original
        const shuffledMissions = [...missionsData].sort(() => 0.5 - Math.random());
        // Tomamos las primeras 3
        const selected = shuffledMissions.slice(0, 3);
        
        // Las preparamos con progreso en 0
        this.activeMissions = selected.map(mission => ({
            ...mission,
            progress: 0,
            completed: false
        }));
    },

    // Avisa a las misiones cuando el niño hace algo
    updateMissionProgress(type, amount = 1) {
        let changed = false;
        
        this.activeMissions.forEach(mission => {
            // Si el tipo coincide y no está terminada
            if (mission.type === type && !mission.completed) {
                mission.progress += amount;
                
                // Si la completó justo ahora
                if (mission.progress >= mission.target) {
                    mission.progress = mission.target;
                    mission.completed = true;
                    // Entregar la recompensa automáticamente
                    this.addCoins(mission.rewardType, mission.rewardAmount);
                    console.log(`¡Misión Completada! Ganaste ${mission.rewardAmount} ${mission.rewardType}`);
                }
                changed = true;
            }
        });

        if (changed) this.saveToStorage();
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