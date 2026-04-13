/** * ARCHIVO: firebaseConfig.js
 * NOTA INTERNA: CONFIGURACIÓN MAESTRA v3.1.0 + TELEMETRÍA DE VERSIÓN
 */
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  doc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDgmEHAEq3A1IpCV-Sgp2X4P2knKZevzKI", 
  authDomain: "buho-matematico-pro.firebaseapp.com",
  projectId: "buho-matematico-pro",
  storageBucket: "buho-matematico-pro.firebasestorage.app",
  messagingSenderId: "1044924656165",
  appId: "1:1044924656165:web:aa9f699e57f912817a2dcc"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED 
  })
});

export const auth = getAuth(app);

// --- 🛰️ FUNCIÓN DE TELEMETRÍA (EL LOGGER) ---
export const logAppVersion = async (userId, version) => {
  if (!userId) return;
  
  try {
    const userVersionRef = doc(db, "telemetry", userId);
    await setDoc(userVersionRef, {
      last_seen: serverTimestamp(),
      current_version: version,
      device_info: navigator.userAgent,
      platform: navigator.platform,
      online_status: navigator.onLine
    }, { merge: true });
    
    console.log(`📡 Telemetría: Versión ${version} registrada para el usuario ${userId}`);
  } catch (error) {
    console.error("❌ Error en telemetría:", error);
  }
};

auth.useDeviceLanguage(); 
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("🔒 Banco Central: Sesión Blindada"))
  .catch((error) => console.error("❌ Error Auth:", error));