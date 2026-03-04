import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 1. Creamos la instancia de la aplicación
const app = createApp(App)

// 2. Creamos e instalamos Pinia (El Banco Central)
const pinia = createPinia()
app.use(pinia)

// 3. Montamos la aplicación
app.mount('#app')

/**
 * NOTA TÉCNICA: 
 * Al instalar pinia antes del mount, garantizamos que cualquier 
 * componente que necesite monedas o datos de usuario los tenga
 * disponibles inmediatamente en el ciclo 'onMounted'.
 */