import { defineStore } from 'pinia';
import { missionsData } from '../data/missions'; 

// --- IMPORTAMOS FIREBASE PARA EL RESET ---
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from "firebase/firestore";
// -----------------------------------------

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
    purchasedItems: [],

    // --- SISTEMA DE RACHAS Y MISIONES ---
    currentStreak: 0,        
    lastPlayedDate: null,    
    activeMissions: []       
  }),

  getters: {
    totalWealthInCopper: (state) => {
      return state.copper + (state.silver * 100) + (state.gold * 10000);
    }
  },

  actions: {
    // --- FUNCIÓN DE SINCRONIZACIÓN MAESTRA (TIEMPO REAL) ---
    setCoinsFromCloud(stats) {
      if (!stats) return;
      
      console.log("📥 Sincronizando Banco y Racha con la Nube...", stats);

      this.gold = stats.gold || 0;
      this.silver = stats.silver || 0;
      this.copper = stats.copper || 0;

      if (stats.puntos) {
          this.copper += stats.puntos;
      }

      if (stats.racha !== undefined) {
        this.currentStreak = stats.racha;
      }
      
      if (stats.lastPlayedDate) {
        this.lastPlayedDate = stats.lastPlayedDate;
      }
      
      this.processConversions();
      this.saveToStorage();
    },

    addCoins(type, amount) {
      const safeAmount = Math.abs(parseInt(amount)) || 0;
      if (safeAmount === 0) return;

      switch (type) {
        case 'copper':
          this.copper += safeAmount;
          this.sessionCopperEarned += safeAmount;
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
          this.updateMissionProgress('buy_shop', 1); 
          this.saveToStorage();
      }
      return success;
    },

    saveTicket(ticket) {
        this.purchasedItems.unshift(ticket);
        this.saveToStorage();
    },

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

    // --- FUNCIÓN HARD RESET ACTUALIZADA (HÍBRIDA) ---
    async hardReset() {
        console.log("🔥 Iniciando Reset Total (Local + Nube)...");

        // 1. Limpieza de Estado Local
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
        
        // 2. Limpieza de LocalStorage
        this.saveToStorage();

        // 3. LIMPIEZA EN FIREBASE (Nube)
        const user = auth.currentUser;
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              "stats.gold": 0,
              "stats.silver": 0,
              "stats.copper": 0,
              "stats.puntos": 0,
              "stats.racha": 0,
              "stats.lastPlayedDate": null,
              lastActivity: Date.now()
            });
            console.log("☁️ Nube reseteada con éxito.");
          } catch (error) {
            console.error("❌ Error reseteando la nube:", error);
          }
        }
    },

    processConversions() {
      while (this.copper >= 100) { 
          this.copper -= 100; 
          this.silver += 1; 
      }
      while (this.silver >= 100) { 
          this.silver -= 100; 
          this.gold += 1; 
      }
    },

    saveToStorage() {
      try {
        const dataToSave = {
          copper: this.copper,
          silver: this.silver,
          gold: this.gold,
          purchasedItems: this.purchasedItems,
          currentStreak: this.currentStreak,
          lastPlayedDate: this.lastPlayedDate,
          activeMissions: this.activeMissions
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Error al guardar localmente:', e);
      }
    },

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
      } catch (e) {
        console.error('Error al cargar localmente:', e);
      }
    },

    checkDailyStreak() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        if (this.lastPlayedDate !== today) {
            if (this.lastPlayedDate) {
                const lastDate = new Date(this.lastPlayedDate);
                const currentDate = new Date(today);
                const diffTime = Math.abs(currentDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                if (diffDays === 1) {
                    this.currentStreak += 1; 
                    if (this.currentStreak % 7 === 0) {
                        this.addCoins('gold', 1);
                    }
                } else if (diffDays > 1) {
                    this.currentStreak = 1; 
                }
            } else {
                this.currentStreak = 1; 
            }
            this.lastPlayedDate = today;
            this.generateNewMissions();
            this.saveToStorage();
        }
    },

    generateNewMissions() {
        if (!missionsData) return;
        const shuffledMissions = [...missionsData].sort(() => 0.5 - Math.random());
        const selected = shuffledMissions.slice(0, 3);
        
        this.activeMissions = selected.map(mission => ({
            ...mission,
            progress: 0,
            completed: false
        }));
    },

    updateMissionProgress(type, amount = 1) {
        let changed = false;
        this.activeMissions.forEach(mission => {
            if (mission.type === type && !mission.completed) {
                mission.progress += amount;
                if (mission.progress >= mission.target) {
                    mission.progress = mission.target;
                    mission.completed = true;
                    this.addCoins(mission.rewardType, mission.rewardAmount);
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