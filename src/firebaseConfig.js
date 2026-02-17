import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // ¡ATENCIÓN! Aquí está la clave corregida con la "q" minúscula:
  apiKey: "AIzaSyDgmEHAEq3A1IpCV-Sgp2X4P2knKZevzKI", 
  authDomain: "buho-matematico-pro.firebaseapp.com",
  projectId: "buho-matematico-pro",
  storageBucket: "buho-matematico-pro.firebasestorage.app",
  messagingSenderId: "1044924656165",
  appId: "1:1044924656165:web:aa9f699e57f912817a2dcc"
};

const app = initializeApp(firebaseConfig);

// Estas líneas son vitales para que la App pueda usar la base de datos y el login:
export const db = getFirestore(app);
export const auth = getAuth(app);