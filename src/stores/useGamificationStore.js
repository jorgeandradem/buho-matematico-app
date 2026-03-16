/** * ARCHIVO: useGamificationStore.js
 * NOTA INTERNA: BANCO CENTRAL v3.2.0 - INTEGRACIÓN NEWS SCANNER
 * LOGICA: Sincronización Privada (UID) + Memoria de Actualizaciones.
 */
import { defineStore } from 'pinia';
import { missionsData } from '../data/missions'; 

// --- IMPORTACIONES FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, runTransaction, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { 
  deleteUser, 
  signInWithEmailAndPassword 
} from "firebase/auth";

const STORAGE_KEY = 'buho-matematico-tesoro-v1';

export const useGamificationStore = defineStore('gamification', {
  state: () => ({
    // --- 💰 BÓVEDA DE MONEDAS ---
    copper: 0,
    silver: 0,
    gold: 0,
    
    // --- 🔄 MARCAS DE SINCRONIZACIÓN (Protocolo Delta) ---
    lastSyncedCopper: 0,
    lastSyncedSilver: 0,
    lastSyncedGold: 0,

    // --- 📊 ESTADÍSTICAS DE SESIÓN ---
    sessionCopperEarned: 0,
    sessionSilverEarned: 0,
    sessionGoldEarned: 0,
    
    // --- 🎒 INVENTARIO Y PROGRESO ---
    purchasedItems: [],
    pirateLevel: 1,
    completedIslands: [],
    worldTourLevel: 0, 
    
    // --- 🔥 RACHA Y NOTIFICACIONES ---
    currentStreak: 0,
    lastPlayedDate: null, 
    activeMissions: [],
    bubbleMessage: '',
    
    // --- 🛡️ CONTROL DE RED Y NOVEDADES ---
    isSyncing: false,
    syncTimeout: null,
    lastSeenUpdateId: null // 👈 Memoria para el News Scanner
  }),

  getters: {
    totalWealthInCopper: (state) => {
      return state.copper + (state.silver * 100) + (state.gold * 10000);
    },
    isIslandComplete: (state) => (id) => state.completedIslands.includes(id)
  },

  actions: {
    // --- 🛡️ CARGA INICIAL DESDE CARPETA PRIVADA ---
    async fetchUserStats() {
      const user = auth.currentUser;
      if (!user) {
        this.loadFromStorage();
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const cloudData = docSnap.data().stats;
          if (cloudData) {
            this.setCoinsFromCloud(cloudData);
          }
        } else {
          this.generateNewMissions();
          this.syncAllToCloud();
        }
      } catch (error) {
        console.error("Error cargando desde nube:", error);
        this.loadFromStorage();
      }
    },

    // --- 🛡️ PROTOCOLO DELTA: CONCILIACIÓN NUBE-LOCAL ---
    setCoinsFromCloud(stats) {
      if (!stats || this.isSyncing) return; 
      
      const copperDelta = this.copper - this.lastSyncedCopper;
      const silverDelta = this.silver - this.lastSyncedSilver;
      const goldDelta   = this.gold   - this.lastSyncedGold;

      this.gold = (stats.gold || 0) + goldDelta;
      this.silver = (stats.silver || 0) + silverDelta;
      this.copper = (stats.copper || 0) + (stats.puntos || 0) + copperDelta;

      this.lastSyncedGold = stats.gold || 0;
      this.lastSyncedSilver = stats.silver || 0;
      this.lastSyncedCopper = (stats.copper || 0) + (stats.puntos || 0);

      this.currentStreak = stats.racha || 0;
      this.lastPlayedDate = stats.lastPlayedDate || null;
      this.purchasedItems = stats.purchasedItems || [];
      this.activeMissions = stats.activeMissions || [];
      this.pirateLevel = stats.pirateLevel || 1;
      this.completedIslands = stats.completedIslands || [];
      this.worldTourLevel = stats.worldTourLevel || 0;
      this.lastSeenUpdateId = stats.lastSeenUpdateId || null; // Sincroniza visto de noticias
      
      this.processConversions();
      this.saveToStorage();
    },

    async syncAllToCloud() {
        if (this.syncTimeout) clearTimeout(this.syncTimeout);

        this.syncTimeout = setTimeout(async () => {
            const user = auth.currentUser;
            if (!user || this.isSyncing) return;

            this.isSyncing = true; 
            try {
                const userRef = doc(db, "users", user.uid);
                
                await runTransaction(db, async (transaction) => {
                    const sfDoc = await transaction.get(userRef);
                    
                    if (!sfDoc.exists()) {
                        transaction.set(userRef, {
                            stats: this.buildStatsObject(),
                            lastActivity: Date.now()
                        });
                        return;
                    }

                    transaction.update(userRef, {
                        "stats.gold": this.gold,
                        "stats.silver": this.silver,
                        "stats.copper": this.copper,
                        "stats.racha": this.currentStreak,
                        "stats.lastPlayedDate": this.lastPlayedDate,
                        "stats.purchasedItems": this.purchasedItems,
                        "stats.activeMissions": this.activeMissions,
                        "stats.pirateLevel": this.pirateLevel,
                        "stats.completedIslands": this.completedIslands,
                        "stats.worldTourLevel": this.worldTourLevel,
                        "stats.lastSeenUpdateId": this.lastSeenUpdateId,
                        lastActivity: Date.now()
                    });
                });

                this.lastSyncedGold = this.gold;
                this.lastSyncedSilver = this.silver;
                this.lastSyncedCopper = this.copper;
                
            } catch (error) {
                console.warn("🦉 Banco Central: Guardado en caché (Modo offline)");
            } finally {
                this.isSyncing = false;
            }
        }, 2000);
    },

    buildStatsObject() {
        return {
            gold: this.gold,
            silver: this.silver,
            copper: this.copper,
            racha: this.currentStreak,
            lastPlayedDate: this.lastPlayedDate,
            purchasedItems: this.purchasedItems,
            activeMissions: this.activeMissions,
            pirateLevel: this.pirateLevel,
            completedIslands: this.completedIslands,
            worldTourLevel: this.worldTourLevel,
            lastSeenUpdateId: this.lastSeenUpdateId
        };
    },

    // --- 💰 GESTIÓN DE RIQUEZA ---
    async processEndGameRewards(rewards, errors) {
      let finalGold = parseInt(rewards.gold || 0);
      let finalSilver = parseInt(rewards.silver || 0);
      let finalCopper = parseInt(rewards.copper || rewards.bronze || 0);

      if (errors > 6) {
        finalGold = Math.ceil(finalGold / 2);
        finalSilver = Math.ceil(finalSilver / 2);
        finalCopper = Math.ceil(finalCopper / 2);
      }

      this.addMultipleCoins({ gold: finalGold, silver: finalSilver, copper: finalCopper });
      this.updateMissionProgress('play_any_game', 1);
    },

    addMultipleCoins(rewards) {
      if (!rewards) return;
      const c = parseInt(rewards.copper || rewards.bronze || 0);
      const s = parseInt(rewards.silver || 0);
      const g = parseInt(rewards.gold || 0);

      if (c > 0) { 
        this.copper += c; 
        this.sessionCopperEarned += c; 
        this.updateMissionProgress('earn_copper', c); 
      }
      if (s > 0) { 
        this.silver += s; 
        this.sessionSilverEarned += s; 
        this.updateMissionProgress('earn_silver', s); 
      }
      if (g > 0) { 
        this.gold += g; 
        this.sessionGoldEarned += g; 
      }

      this.processConversions();
      this.saveToStorage();
      this.syncAllToCloud();
    },

    addCoins(type, amount) {
      const intentAmount = parseInt(amount) || 0;
      if (intentAmount === 0) return;

      const coinType = (type === 'bronze') ? 'copper' : type;
      this[coinType] = Math.max(0, this[coinType] + intentAmount);
      
      if (intentAmount > 0) {
          if (coinType === 'copper') {
              this.sessionCopperEarned += intentAmount;
              this.updateMissionProgress('earn_copper', intentAmount);
          } else if (coinType === 'silver') {
              this.sessionSilverEarned += intentAmount;
              this.updateMissionProgress('earn_silver', intentAmount);
          } else {
              this.sessionGoldEarned += intentAmount;
          }
      }

      this.processConversions();
      this.saveToStorage();
      this.syncAllToCloud(); 
    },

    async spendCoins(type, amount) {
      const cost = Math.max(0, parseInt(amount) || 0);
      const coinType = (type === 'bronze') ? 'copper' : type;
      const costInCopper = (coinType === 'gold') ? cost * 10000 : (coinType === 'silver') ? cost * 100 : cost;

      if (this.totalWealthInCopper < costInCopper) {
          this.bubbleMessage = "No tienes suficiente saldo en la bóveda. 🦉";
          return false;
      }

      this[coinType] -= cost;
      this.processConversions(); 
      this.updateMissionProgress('buy_shop', 1); 
      this.saveToStorage();
      this.syncAllToCloud(); 
      return true;
    },

    processConversions() {
      while (this.copper >= 100) { this.copper -= 100; this.silver += 1; }
      while (this.silver >= 100) { this.silver -= 100; this.gold += 1; }

      while (this.silver < 0 && this.gold > 0) {
          this.gold -= 1;
          this.silver += 100;
      }
      while (this.copper < 0 && this.silver > 0) {
          this.silver -= 1;
          this.copper += 100;
      }

      if (this.copper < 0) this.copper = 0;
      if (this.silver < 0) this.silver = 0;
      if (this.gold < 0) this.gold = 0;
    },

    checkDailyStreak() {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (this.lastPlayedDate !== today) {
            if (this.lastPlayedDate) {
                const lastDate = new Date(this.lastPlayedDate);
                const currentDate = new Date(today);
                const diffTime = Math.abs(currentDate - lastDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    this.currentStreak = (this.currentStreak % 7) + 1;
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

    async deleteAccountPermanently(email, password) {
      try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          await deleteDoc(doc(db, "users", user.uid));
          await deleteUser(user);
          
          this.$reset();
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('buho_last_login');
          
          return { success: true };
      } catch (error) {
          console.error("Error en baja:", error.code);
          return { success: false, error: 'unknown' };
      }
    },

    completeWorldTourChallenge(rewardType, rewardAmount) {
      this.worldTourLevel++;
      this.addCoins(rewardType, rewardAmount);
      this.updateMissionProgress('complete_challenge', 1);
    },

    completePirateMission(islandId, rewardType, rewardAmount) {
      if (this.completedIslands.includes(islandId)) return;
      this.completedIslands.push(islandId);
      this.pirateLevel = (this.pirateLevel < 10) ? this.pirateLevel + 1 : 1;
      this.addCoins(rewardType, rewardAmount);
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
        this.addCoins(lastTicket.type, cost);
        return lastTicket; 
    },

    async hardReset() {
        this.$reset(); 
        localStorage.removeItem(STORAGE_KEY);
        const user = auth.currentUser;
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { stats: null }, { merge: true });
          } catch (error) { console.error(error); }
        }
    },

    generateNewMissions() {
        if (!missionsData || missionsData.length === 0) return;
        const copper = missionsData.filter(m => m.id?.startsWith('m_c'));
        const silver = missionsData.filter(m => m.id?.startsWith('m_s'));
        const gold   = missionsData.filter(m => m.id?.startsWith('m_g'));

        const selected = [
            copper[Math.floor(Math.random() * copper.length)],
            silver[Math.floor(Math.random() * silver.length)],
            gold[Math.floor(Math.random() * gold.length)]
        ];
        this.activeMissions = selected.filter(Boolean).map(m => ({ ...m, progress: 0, completed: false }));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          copper: this.copper, silver: this.silver, gold: this.gold,
          lastSyncedCopper: this.lastSyncedCopper, lastSyncedSilver: this.lastSyncedSilver, lastSyncedGold: this.lastSyncedGold,
          pirateLevel: this.pirateLevel, completedIslands: this.completedIslands, worldTourLevel: this.worldTourLevel,
          purchasedItems: this.purchasedItems, currentStreak: this.currentStreak,
          lastPlayedDate: this.lastPlayedDate, activeMissions: this.activeMissions,
          lastSeenUpdateId: this.lastSeenUpdateId
        }));
      } catch (e) { console.error("Error localStorage:", e); }
    },

    loadFromStorage() {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          Object.assign(this, parsedData);
        }
      } catch (e) { console.error("Error cargando storage:", e); }
    }
  }
});