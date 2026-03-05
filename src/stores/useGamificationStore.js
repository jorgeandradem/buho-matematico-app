import { defineStore } from 'pinia';
import { missionsData } from '../data/missions'; 

// --- IMPORTACIONES FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";

const STORAGE_KEY = 'buho-matematico-tesoro-v1';

export const useGamificationStore = defineStore('gamification', {
  state: () => ({
    // Saldo Actual
    copper: 0,
    silver: 0,
    gold: 0,
    
    // Marcas de Sincronización (Para Protocolo Delta)
    lastSyncedCopper: 0,
    lastSyncedSilver: 0,
    lastSyncedGold: 0,

    // Estadísticas de Sesión (Para celebraciones en StatusBoard)
    sessionCopperEarned: 0,
    sessionSilverEarned: 0,
    sessionGoldEarned: 0,
    
    // Inventario y Progreso
    purchasedItems: [],
    pirateLevel: 1,
    completedIslands: [],
    worldTourLevel: 0, 
    
    // Racha y Notificaciones
    currentStreak: 0,
    lastPlayedDate: null, // Formato YYYY-MM-DD
    activeMissions: [],
    bubbleMessage: '',
    
    // Control de Sincronización
    isSyncing: false,
    syncTimeout: null
  }),

  getters: {
    totalWealthInCopper: (state) => {
      return state.copper + (state.silver * 100) + (state.gold * 10000);
    },
    isIslandComplete: (state) => (id) => state.completedIslands.includes(id)
  },

  actions: {
    // --- 🛡️ PROTOCOLO DELTA: CONCILIACIÓN NUBE-LOCAL ---
    setCoinsFromCloud(stats) {
      if (!stats || this.isSyncing) return; 
      
      // 1. Calculamos el "Saldo en Tránsito" (Lo ganado localmente que no se ha subido)
      const copperInTransit = this.copper - this.lastSyncedCopper;
      const silverInTransit = this.silver - this.lastSyncedSilver;
      const goldInTransit   = this.gold   - this.lastSyncedGold;

      // 2. Fusionamos: Saldo Real de la Nube + Ganancias Locales Pendientes
      this.gold = (stats.gold || 0) + goldInTransit;
      this.silver = (stats.silver || 0) + silverInTransit;
      this.copper = (stats.copper || 0) + (stats.puntos || 0) + copperInTransit;

      // 3. Actualizamos las marcas de referencia sincronizada
      this.lastSyncedGold = stats.gold || 0;
      this.lastSyncedSilver = stats.silver || 0;
      this.lastSyncedCopper = (stats.copper || 0) + (stats.puntos || 0);

      // 4. Cargamos el resto de metadatos de progreso
      this.currentStreak = stats.racha || 0;
      this.lastPlayedDate = stats.lastPlayedDate || null;
      this.purchasedItems = stats.purchasedItems || [];
      this.activeMissions = stats.activeMissions || [];
      this.pirateLevel = stats.pirateLevel || 1;
      this.completedIslands = stats.completedIslands || [];
      this.worldTourLevel = stats.worldTourLevel || 0;
      
      this.saveToStorage();
    },

    // --- ☁️ SINCRONIZACIÓN ATÓMICA CON DEBOUNCING ---
    async syncAllToCloud() {
        if (this.syncTimeout) clearTimeout(this.syncTimeout);

        // Esperamos 2 segundos de inactividad antes de subir a Firebase
        this.syncTimeout = setTimeout(async () => {
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
                    "stats.worldTourLevel": this.worldTourLevel,
                    lastActivity: Date.now()
                });

                // Al tener éxito, igualamos las marcas de sincronización
                this.lastSyncedGold = this.gold;
                this.lastSyncedSilver = this.silver;
                this.lastSyncedCopper = this.copper;
                
            } catch (error) {
                console.warn("🦉 Banco Central: Guardado en modo offline (Caché activa)");
            } finally {
                this.isSyncing = false;
            }
        }, 2000);
    },

    // --- 💰 GESTIÓN DE RIQUEZA (MEJORADA) ---

    // 1. NUEVA FUNCIÓN: Añadir un paquete de monedas (Ideal para el final de los juegos)
    addMultipleCoins(rewards) {
      if (!rewards) return;
      
      // Acepta tanto 'copper' como 'bronze' por compatibilidad con los juegos
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

    // 2. Función Individual (Corregida con alias 'bronze')
    addCoins(type, amount) {
      const safeAmount = Math.max(0, parseInt(amount) || 0);
      if (safeAmount === 0) return;

      // ALIAS: Si un juego envía 'bronze', el sistema lo entiende como 'copper'
      if (type === 'copper' || type === 'bronze') {
          this.copper += safeAmount;
          this.sessionCopperEarned += safeAmount;
          this.updateMissionProgress('earn_copper', safeAmount);
      } else if (type === 'silver') {
          this.silver += safeAmount;
          this.sessionSilverEarned += safeAmount;
          this.updateMissionProgress('earn_silver', safeAmount);
      } else if (type === 'gold') {
          this.gold += safeAmount;
          this.sessionGoldEarned += safeAmount;
      }

      this.processConversions();
      this.saveToStorage();
      this.syncAllToCloud(); 
    },

    async spendCoins(type, amount) {
      const safeAmount = Math.max(0, parseInt(amount) || 0);
      let success = false;

      // Alias aquí también por si acaso
      const coinType = (type === 'bronze') ? 'copper' : type;

      if (coinType === 'gold' && this.gold >= safeAmount) { this.gold -= safeAmount; success = true; }
      else if (coinType === 'silver' && this.silver >= safeAmount) { this.silver -= safeAmount; success = true; }
      else if (coinType === 'copper' && this.copper >= safeAmount) { this.copper -= safeAmount; success = true; }

      if (success) {
          this.updateMissionProgress('buy_shop', 1); 
          this.saveToStorage();
          this.syncAllToCloud(); 
      } else {
          this.bubbleMessage = "No tienes suficiente saldo en la bóveda. 🦉";
      }
      return success;
    },

    processConversions() {
      // 100 cobre -> 1 plata | 100 plata -> 1 oro
      while (this.copper >= 100) { this.copper -= 100; this.silver += 1; }
      while (this.silver >= 100) { this.silver -= 100; this.gold += 1; }
    },

    // --- 🔥 LÓGICA DE RACHA DIARIA BLINDADA ---
    checkDailyStreak() {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Si es un día nuevo, reseteamos mensajes y notificaciones
        if (this.lastPlayedDate !== today) {
            if (this.lastPlayedDate) {
                const lastDate = new Date(this.lastPlayedDate);
                const currentDate = new Date(today);
                const diffTime = Math.abs(currentDate - lastDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Jugó ayer: incrementamos racha
                    this.currentStreak = (this.currentStreak % 7) + 1;
                } else if (diffDays > 1) {
                    // Pasó más de un día: racha vuelve a 1
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

    // --- 🎮 PROGRESO DE JUEGO ---
    completeWorldTourChallenge(rewardType, rewardAmount) {
      this.worldTourLevel++;
      this.addCoins(rewardType, rewardAmount);
      this.bubbleMessage = "¡Increíble! Un paso más cerca de completar el mapa mundial. 🌍";
      this.updateMissionProgress('complete_challenge', 1);
    },

    completePirateMission(islandId, rewardType, rewardAmount) {
      if (this.completedIslands.includes(islandId)) return;
      this.completedIslands.push(islandId);
      this.pirateLevel = (this.pirateLevel < 10) ? this.pirateLevel + 1 : 1;
      this.addCoins(rewardType, rewardAmount);
      this.bubbleMessage = `¡Cofre abierto! Ganaste ${rewardAmount} de ${rewardType}. 🚢`;
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
        this.$reset(); // Resetea el estado a los valores iniciales de Pinia
        localStorage.removeItem(STORAGE_KEY);
        
        const user = auth.currentUser;
        if (user) {
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { "stats": null }); // Limpia stats en nube
          } catch (error) { console.error(error); }
        }
    },

    generateNewMissions() {
        if (!missionsData || missionsData.length === 0) return;
        // Filtramos misiones por categoría
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

    // --- 💾 PERSISTENCIA LOCAL ---
    saveToStorage() {
      try {
        const dataToSave = {
          copper: this.copper, silver: this.silver, gold: this.gold,
          lastSyncedCopper: this.lastSyncedCopper,
          lastSyncedSilver: this.lastSyncedSilver,
          lastSyncedGold: this.lastSyncedGold,
          pirateLevel: this.pirateLevel,
          completedIslands: this.completedIslands,
          worldTourLevel: this.worldTourLevel,
          purchasedItems: this.purchasedItems, 
          currentStreak: this.currentStreak,
          lastPlayedDate: this.lastPlayedDate, 
          activeMissions: this.activeMissions
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) { console.error("Error en LocalStorage:", e); }
    },

    loadFromStorage() {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          Object.assign(this, parsedData);
        }
      } catch (e) { console.error("Error cargando LocalStorage:", e); }
    }
  }
});