import { defineStore } from 'pinia';
import { missionsData } from '../data/missions'; 

// --- IMPORTAMOS FIREBASE ---
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
    activeMissions: [],

    // --- NOTIFICACIONES Y BURBUJAS ---
    dailyNotifications: 0,
    lastNotificationDate: null,
    bubbleMessage: '',

    // --- 🛡️ v2.9.1: BANDERA DE BLOQUEO DE SEGURIDAD ---
    isSyncing: false 
  }),

  getters: {
    totalWealthInCopper: (state) => {
      return state.copper + (state.silver * 100) + (state.gold * 10000);
    }
  },

  actions: {
    // --- 🛡️ ESCUDO DE RIQUEZA INTELIGENTE (v2.9.1) ---
    // Este método es el que evita que los puntos se reseteen al ganar o comprar.
    setCoinsFromCloud(stats) {
      // Bloqueo 1: Si estamos subiendo datos (comprando o ganando), ignoramos la nube
      if (!stats || this.isSyncing) return; 
      
      const cloudWealth = (stats.gold || 0) * 10000 + 
                          (stats.silver || 0) * 100 + 
                          (stats.copper || 0) + 
                          (stats.puntos || 0);

      const localWealth = (this.gold * 10000) + (this.silver * 100) + this.copper;

      // Bloqueo 2: Si ya hay actividad local (puntos > 0) y hay diferencia con la nube,
      // NO sobreescribimos. Confiamos en el móvil para evitar que la nube nos "pise" el progreso.
      if (localWealth !== 0 && localWealth !== cloudWealth) {
          console.log("🛡️ Escudo Activo: Protegiendo progreso local de hoy.");
          return; 
      }

      this.gold = stats.gold || 0;
      this.silver = stats.silver || 0;
      this.copper = (stats.copper || 0) + (stats.puntos || 0);

      this.currentStreak = stats.racha || 0;
      this.lastPlayedDate = stats.lastPlayedDate || null;
      this.purchasedItems = stats.purchasedItems || [];
      this.activeMissions = stats.activeMissions || [];
      
      this.saveToStorage();
    },

    // --- 📡 SINCRONIZACIÓN TOTAL ASÍNCRONA (v2.9.1) ---
    async syncAllToCloud() {
        const user = auth.currentUser;
        if (!user) return;

        this.isSyncing = true; // Bloqueamos el escudo temporalmente

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
                lastActivity: Date.now()
            });
            console.log("☁️ Nube sincronizada con éxito.");
        } catch (error) {
            console.log("📡 Modo Offline: Guardado local.");
        } finally {
            // Esperamos un segundo extra para que Firebase procese antes de liberar el escudo
            setTimeout(() => {
                this.isSyncing = false;
            }, 1000);
        }
    },

    // --- 🟠 GANAR MONEDAS (ACTIVA LOS RETOS) ---
    async addCoins(type, amount) {
      const safeAmount = Math.max(0, parseInt(amount) || 0);
      if (safeAmount === 0) return;

      switch (type) {
        case 'copper':
          this.copper += safeAmount;
          this.sessionCopperEarned += safeAmount;
          // Esto activa el avance de los retos de cobre
          this.updateMissionProgress('earn_copper', safeAmount);
          break;
        case 'silver':
          this.silver += safeAmount;
          this.sessionSilverEarned += safeAmount;
          // Esto activa el avance de los retos de plata
          this.updateMissionProgress('earn_silver', safeAmount);
          break;
        case 'gold':
          this.gold += safeAmount;
          this.sessionGoldEarned += safeAmount;
          break;
      }

      this.processConversions();
      this.saveToStorage();
      await this.syncAllToCloud(); // Obligatorio esperar para que no se reseteen los puntos
    },

    // --- 🛒 GASTAR MONEDAS (ACTIVA RETOS DE COMPRA) ---
    async spendCoins(type, amount) {
      const safeAmount = Math.max(0, parseInt(amount) || 0);
      let success = false;
      
      if (type === 'gold' && this.gold >= safeAmount) { this.gold -= safeAmount; success = true; }
      else if (type === 'silver' && this.silver >= safeAmount) { this.silver -= safeAmount; success = true; }
      else if (type === 'copper' && this.copper >= safeAmount) { this.copper -= safeAmount; success = true; }

      if (success) {
          // Esto activa el avance de los retos de "comprar"
          this.updateMissionProgress('buy_shop', 1); 
          this.saveToStorage();
          await this.syncAllToCloud(); 
      }
      return success;
    },

    async saveTicket(ticket) {
        this.purchasedItems.unshift(ticket);
        this.saveToStorage();
        await this.syncAllToCloud();
    },

    async refundLastPurchase() {
        if (this.purchasedItems.length === 0) return null;
        const lastTicket = this.purchasedItems.shift(); 
        const cost = Math.max(0, parseInt(lastTicket.cost) || 0);
        if (lastTicket.type === 'gold') this.gold += cost;
        else if (lastTicket.type === 'silver') this.silver += cost;
        else if (lastTicket.type === 'copper') this.copper += cost;
        this.saveToStorage();
        await this.syncAllToCloud();
        return lastTicket; 
    },

    async hardReset() {
        this.copper = 0; this.silver = 0; this.gold = 0;
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
              "stats.purchasedItems": [], "stats.activeMissions": []
            });
          } catch (error) { console.error(error); }
        }
    },

    processConversions() {
      while (this.copper >= 100) { this.copper -= 100; this.silver += 1; }
      while (this.silver >= 100) { this.silver -= 100; this.gold += 1; }
    },

    // --- 📅 RACHA AUTOMÁTICA (v2.7/2.8) ---
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
                    if (this.dailyNotifications < 3) {
                        this.bubbleMessage = `¡Fuego! Racha de día ${this.currentStreak} activada. 🦉`;
                        this.dailyNotifications++;
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
            this.syncAllToCloud();
        }
    },

    generateNewMissions() {
        if (!missionsData || missionsData.length === 0) return;
        const copper = missionsData.filter(m => m.id && m.id.startsWith('m_c'));
        const silver = missionsData.filter(m => m.id && m.id.startsWith('m_s'));
        const gold   = missionsData.filter(m => m.id && m.id.startsWith('m_g'));

        if (copper.length === 0 || silver.length === 0 || gold.length === 0) {
            this.activeMissions = [...missionsData].sort(() => 0.5 - Math.random()).slice(0, 3).map(m => ({ ...m, progress: 0, completed: false }));
        } else {
            const selected = [
                copper[Math.floor(Math.random() * copper.length)],
                silver[Math.floor(Math.random() * silver.length)],
                gold[Math.floor(Math.random() * gold.length)]
            ];
            this.activeMissions = selected.map(m => ({ ...m, progress: 0, completed: false }));
        }
        this.syncAllToCloud();
    },

    // --- 💬 EL MOTOR DE LOS RETOS (v2.9.1) ---
    updateMissionProgress(type, amount = 1) {
        let changed = false;
        this.activeMissions.forEach(m => {
            // Si el tipo coincide y el reto no está terminado, avanzamos
            if (m.type === type && !m.completed) {
                m.progress += amount;
                if (m.progress >= m.target) {
                    m.progress = m.target;
                    m.completed = true;
                    // Entregamos el premio exclusivo del reto
                    this.addCoins(m.rewardType, m.rewardAmount);
                    if (this.dailyNotifications < 3) {
                        this.bubbleMessage = `¡Reto cumplido! Ganaste ${m.rewardAmount} de ${m.rewardType}. 🏆`;
                        this.dailyNotifications++;
                    }
                }
                changed = true;
            }
        });
        if (changed) {
            this.saveToStorage();
            // No llamamos a syncAllToCloud aquí porque addCoins ya lo hará si el reto se completa
        }
    },

    saveToStorage() {
      try {
        const dataToSave = {
          copper: this.copper, silver: this.silver, gold: this.gold,
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
          this.purchasedItems = parsedData.purchasedItems || [];
          this.currentStreak = parseInt(parsedData.currentStreak) || 0;
          this.lastPlayedDate = parsedData.lastPlayedDate || null;
          this.activeMissions = parsedData.activeMissions || [];
          this.dailyNotifications = parsedData.dailyNotifications || 0;
          this.lastNotificationDate = parsedData.lastNotificationDate || null;
        }
      } catch (e) { console.error(e); }
    }
  },
});