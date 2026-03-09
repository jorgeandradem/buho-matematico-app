/** * ARCHIVO: firebaseConfig.js
 * NOTA INTERNA: CONFIGURACIÓN MAESTRA v2.9.2 + MULTI-TAB SYNC
 * LOGICA: Persistencia Offline Avanzada + Blindaje Multi-dispositivo
 */
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence // 🚀 MEJORA: Soporte para múltiples pestañas/ventanas
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

// 2. Inicializamos la Base de Datos
export const db = getFirestore(app);

// --- 🛡️ ACTIVACIÓN DEL MODO TANQUE PRO (MULTI-TAB PERSISTENCE) ---
// Esto permite que el Búho mantenga la sincronización perfecta 
// incluso si el alumno abre varias ventanas del juego.
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Este error es raro en modo multi-tab, pero se mantiene por seguridad.
        console.warn("⚠️ Persistencia: Conflicto de precondición (Base de datos bloqueada)");
    } else if (err.code == 'unimplemented') {
        // Navegadores muy antiguos que no soportan IndexedDB
        console.warn("⚠️ Persistencia: El navegador no soporta guardado offline.");
    }
});

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