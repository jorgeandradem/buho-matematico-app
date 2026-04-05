/** * ARCHIVO: firebaseConfig.js
 * NOTA INTERNA: CONFIGURACIÓN MAESTRA v3.0.0 + MULTI-TAB SYNC OFFLINE
 * LÓGICA: Persistencia Offline de Nueva Generación + Blindaje Multi-dispositivo
 */
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
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

// 1. Inicializamos la App
const app = initializeApp(firebaseConfig);

// 2. Inicializamos la Base de Datos con PERSISTENCIA OFFLINE MODERNA
// 🚀 MEJORA: Utilizamos initializeFirestore para activar la caché local 
// ilimitada y el soporte multi-pestaña de nueva generación.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED // 🛡️ Guarda todo lo necesario para jugar en el parque
  })
});

console.log("🦉 Búho Matemático Config: Base de datos local blindada (Modo Tanque Pro) activada.");

// 3. Configuración Avanzada de Autenticación
export const auth = getAuth(app);

// --- CONFIGURACIÓN DE SESIÓN ETERNA ---

// A. Idioma: Obligamos a Firebase a enviar los correos en Español
auth.useDeviceLanguage(); 

// B. Persistencia LOCAL: Mantiene la sesión iniciada aunque se cierre el navegador.
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("🔒 Banco Central: Sesión Blindada en LocalStorage");
  })
  .catch((error) => {
    console.error("❌ Error en persistencia de Auth:", error);
  });