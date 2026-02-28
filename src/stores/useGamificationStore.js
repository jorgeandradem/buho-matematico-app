import { defineStore } from 'pinia';
import { missionsData } from '../data/missions'; 

// --- IMPORTACIONES FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from "firebase/firestore";

const STORAGE_KEY = 'buho-matematico-tesoro-v1';

export const useGamificationStore = defineStore('gamification', {
  state: () => ({
    copper: 0,
    silver: 0,
    gold: 0,
    lastSyncedCopper: 0,
    lastSyncedSilver: 0,
    lastSyncedGold: 0,
    sessionCopperEarned: 0,
    sessionSilverEarned: 0,
    sessionGoldEarned: 0,
    showSessionSummary: false,
    purchasedItems: [],
    pirateLevel: 1,
    completedIslands: [],
    currentStreak: 0,
    lastPlayedDate: null,
    activeMissions: [],
    dailyNotifications: 0,
    lastNotificationDate: null,
    bubbleMessage: '',
    isSyncing: false 
  }),

  getters: {
    totalWealthInCopper: (state) => {
      return state.copper + (state.silver * 100) + (state.gold * 10000);
    },
    isIslandComplete: (state) => (id) => state.completedIslands.includes(id)
  },

  actions: {
    setCoinsFromCloud(stats) {
      if (!stats || this.isSyncing) return; 
      
      const copperInTransit = this.copper - this.lastSyncedCopper;
      const silverInTransit = this.silver - this.lastSyncedSilver;
      const goldInTransit   = this.gold   - this.lastSyncedGold;

      this.gold = (stats.gold || 0) + goldInTransit;
      this.silver = (stats.silver || 0) + silverInTransit;
      this.copper = (stats.copper || 0) + (stats.puntos || 0) + copperInTransit;

      this.lastSyncedGold = stats.gold || 0;
      this.lastSyncedSilver = stats.silver || 0;
      this.lastSyncedCopper = (stats.copper || 0) + (stats.puntos || 0);

      this.currentStreak = stats.racha || 0;
      this.lastPlayedDate = stats.lastPlayedDate || null;
      this.purchasedItems = stats.purchasedItems || [];
      this.activeMissions = stats.activeMissions || [];
      this.pirateLevel = stats.pirateLevel || 1;
      this.completedIslands = stats.completedIslands || [];
      
      this.saveToStorage();
    },

    async syncAllToCloud() {
        const user = auth.currentUser;
        if (!user || this.isSyncing) return;

        this.isSyncing = true; 
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                "stats.gold": this.gold,
                "stats.silver": this.silver,
                "stats.copper": this.copper,
                "stats.racha": this.currentStreak,
                "stats.lastPlayedDate": this.lastPlayedDate,
                "stats.purchasedItems": this.purchasedItems,
                "stats.activeMissions": this.activeMissions,
                "stats.pirateLevel": this.pirateLevel,
                "stats.completedIslands": this.completedIslands,
                lastActivity: Date.now()
            });
            this.lastSyncedGold = this.gold;
            this.lastSyncedSilver = this.silver;
            this.lastSyncedCopper = this.copper;
        } catch (error) {
            console.log("📡 Saldo en tránsito (Offline/Error)");
        } finally {
            this.isSyncing = false;
        }
    },

    // --- FLUJO SIN BLOQUEOS: Prioridad a la UI ---
    completePirateMission(islandId, rewardType, rewardAmount) {
      if (this.completedIslands.includes(islandId)) return;

      this.completedIslands.push(islandId);
      if (this.pirateLevel < 10) {
        this.pirateLevel++;
      } else {
        this.pirateLevel = 1;
        this.completedIslands = [];
        this.bubbleMessage = "¡Felicidades Gran Pirata! Nueva ruta iniciada. 🏴‍☠️";
      }

      this.addCoins(rewardType, rewardAmount);
      this.bubbleMessage = `¡Cofre abierto! Ganaste ${rewardAmount} de ${rewardType}. 🚢`;
      
      this.saveToStorage();
      this.syncAllToCloud(); 
    },

    addCoins(type, amount) {
      const safeAmount = Math.max(0, parseInt(amount) || 0);
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
      }

      this.processConversions();
      this.saveToStorage();
      this.syncAllToCloud(); 
    },

    async spendCoins(type, amount) {
      const safeAmount = Math.max(0, parseInt(amount) || 0);
      let success = false;
      if (type === 'gold' && this.gold >= safeAmount) { this.gold -= safeAmount; success = true; }
      else if (type === 'silver' && this.silver >= safeAmount) { this.silver -= safeAmount; success = true; }
      else if (type === 'copper' && this.copper >= safeAmount) { this.copper -= safeAmount; success = true; }

      if (success) {
          this.updateMissionProgress('buy_shop', 1); 
          this.saveToStorage();
          this.syncAllToCloud(); 
      }
      return success;
    },

    saveTicket(ticket) {
        this.purchasedItems.unshift(ticket);
        this.saveToStorage();
        this.syncAllToCloud();
    },

    async refundLastPurchase() {
        if (this.purchasedItems.length === 0) return null;
        const lastTicket = this.purchasedItems.shift(); 
        const cost = Math.max(0, parseInt(lastTicket.cost) || 0);
        
        if (lastTicket.type === 'gold') this.gold += cost;
        else if (lastTicket.type === 'silver') this.silver += cost;
        else if (lastTicket.type === 'copper') this.copper += cost;
        
        this.saveToStorage();
        this.syncAllToCloud();
        return lastTicket; 
    },

    async hardReset() {
        this.copper = 0; this.silver = 0; this.gold = 0;
        this.pirateLevel = 1; this.completedIslands = [];
        this.lastSyncedCopper = 0; this.lastSyncedSilver = 0; this.lastSyncedGold = 0;
        this.sessionCopperEarned = 0; this.sessionSilverEarned = 0; this.sessionGoldEarned = 0;
        this.purchasedItems = []; this.currentStreak = 0;
        this.lastPlayedDate = null; this.activeMissions = [];
        this.dailyNotifications = 0; this.bubbleMessage = '';
        this.isSyncing = false; 
        
        this.saveToStorage();
        const user = auth.currentUser;
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              "stats.gold": 0, "stats.silver": 0, "stats.copper": 0,
              "stats.puntos": 0, "stats.racha": 0, "stats.lastPlayedDate": null,
              "stats.purchasedItems": [], "stats.activeMissions": [],
              "stats.pirateLevel": 1, "stats.completedIslands": []
            });
          } catch (error) { console.error(error); }
        }
    },

    processConversions() {
      while (this.copper >= 100) { this.copper -= 100; this.silver += 1; }
      while (this.silver >= 100) { this.silver -= 100; this.gold += 1; }
    },

    checkDailyStreak() {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (this.lastNotificationDate !== today) {
            this.dailyNotifications = 0;
            this.lastNotificationDate = today;
            this.bubbleMessage = ''; 
        }

        if (this.lastPlayedDate !== today) {
            if (this.lastPlayedDate) {
                const diffTime = Math.abs(new Date(today) - new Date(this.lastPlayedDate));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays === 1) {
                    this.currentStreak += 1; 
                    if (this.currentStreak > 7) { this.currentStreak = 0; }
                } else if (diffDays > 1) {
                    this.currentStreak = 1; 
                }
            } else {
                this.currentStreak = 1; 
            }
            this.lastPlayedDate = today;
            this.generateNewMissions();
            this.saveToStorage();
            this.syncAllToCloud();
        }
    },

    generateNewMissions() {
        if (!missionsData || missionsData.length === 0) return;
        const copper = missionsData.filter(m => m.id && m.id.startsWith('m_c'));
        const silver = missionsData.filter(m => m.id && m.id.startsWith('m_s'));
        const gold   = missionsData.filter(m => m.id && m.id.startsWith('m_g'));

        const selected = [
            copper[Math.floor(Math.random() * copper.length)],
            silver[Math.floor(Math.random() * silver.length)],
            gold[Math.floor(Math.random() * gold.length)]
        ];
        this.activeMissions = selected.filter(Boolean).map(m => ({ ...m, progress: 0, completed: false }));
        this.syncAllToCloud();
    },

    updateMissionProgress(type, amount = 1) {
        let changed = false;
        this.activeMissions.forEach(m => {
            if (m.type === type && !m.completed) {
                m.progress += amount;
                if (m.progress >= m.target) {
                    m.progress = m.target;
                    m.completed = true;
                    this.addCoins(m.rewardType, m.rewardAmount);
                }
                changed = true;
            }
        });
        if (changed) this.saveToStorage();
    },

    saveToStorage() {
      try {
        const dataToSave = {
          copper: this.copper, silver: this.silver, gold: this.gold,
          lastSyncedCopper: this.lastSyncedCopper,
          lastSyncedSilver: this.lastSyncedSilver,
          lastSyncedGold: this.lastSyncedGold,
          pirateLevel: this.pirateLevel,
          completedIslands: this.completedIslands,
          purchasedItems: this.purchasedItems, currentStreak: this.currentStreak,
          lastPlayedDate: this.lastPlayedDate, activeMissions: this.activeMissions,
          dailyNotifications: this.dailyNotifications,
          lastNotificationDate: this.lastNotificationDate
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) { console.error(e); }
    },

    loadFromStorage() {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          this.copper = parseInt(parsedData.copper) || 0;
          this.silver = parseInt(parsedData.silver) || 0;
          this.gold = parseInt(parsedData.gold) || 0;
          this.lastSyncedCopper = parseInt(parsedData.lastSyncedCopper) || 0;
          this.lastSyncedSilver = parseInt(parsedData.lastSyncedSilver) || 0;
          this.lastSyncedGold = parseInt(parsedData.lastSyncedGold) || 0;
          this.pirateLevel = parseInt(parsedData.pirateLevel) || 1;
          this.completedIslands = parsedData.completedIslands || [];
          this.purchasedItems = parsedData.purchasedItems || [];
          this.currentStreak = parseInt(parsedData.currentStreak) || 0;
          this.lastPlayedDate = parsedData.lastPlayedDate || null;
          this.activeMissions = parsedData.activeMissions || [];
          this.dailyNotifications = parsedData.dailyNotifications || 0;
          this.lastNotificationDate = parsedData.lastNotificationDate || null;
        }
      } catch (e) { console.error(e); }
    }
  }
});