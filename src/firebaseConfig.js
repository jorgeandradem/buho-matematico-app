import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
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

// --- 🛡️ ACTIVACIÓN DEL MODO TANQUE (PERSISTENCIA OFFLINE) ---
// Esto permite que el Búho guarde datos aunque no haya internet
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Probablemente hay múltiples pestañas abiertas al mismo tiempo
        console.warn("La persistencia falló: Múltiples pestañas de la App abiertas.");
    } else if (err.code == 'unimplemented') {
        // El navegador es muy antiguo y no soporta esta función
        console.warn("El navegador no soporta persistencia offline (IndexedDB).");
    }
});

// 3. Configuración Avanzada de Autenticación
export const auth = getAuth(app);

// --- CONFIGURACIÓN DEL GATILLO DE CORREO Y SESIÓN ---

// A. Idioma: Obligamos a Firebase a enviar los correos en Español
auth.useDeviceLanguage(); 

// B. Persistencia: Esto hace que la sesión sea "Eterna" (3 días o más)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("🔒 Persistencia de sesión configurada: LOCAL");
  })
  .catch((error) => {
    console.error("Error en persistencia:", error);
  });