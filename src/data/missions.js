// src/data/missions.js
// Configuración v2.7 - Gratificación Exclusiva Diaria

export const missionsData = [
    // --- 🟠 RETOS DE COBRE (Premio Fijo: 15 Monedas) ---
    {
        id: 'm_c_1',
        title: 'Recolecta 30 monedas de Cobre',
        desc: 'Suma puntos en cualquier modo de ejercicio.',
        type: 'earn_copper',
        target: 30,
        rewardAmount: 15,
        rewardType: 'copper',
        icon: '🥉'
    },
    {
        id: 'm_c_2',
        title: 'Entusiasta de la Tienda',
        desc: 'Realiza 1 compra en la tienda de premios.',
        type: 'buy_shop',
        target: 1,
        rewardAmount: 15,
        rewardType: 'copper',
        icon: '🛍️'
    },

    // --- ⚪ RETOS DE PLATA (Premio Fijo: 10 Monedas) ---
    {
        id: 'm_s_1',
        title: 'Velocidad Mental',
        desc: 'Juega 2 partidas del Desafío Contrarreloj.',
        type: 'play_quiz',
        target: 2,
        rewardAmount: 10,
        rewardType: 'silver',
        icon: '⚡'
    },
    {
        id: 'm_s_2',
        title: 'Ahorrador de Plata',
        desc: 'Consigue 5 monedas de plata mediante ejercicios.',
        type: 'earn_silver',
        target: 5,
        rewardAmount: 10,
        rewardType: 'silver',
        icon: '🥈'
    },

    // --- 🟡 RETOS DE ORO (Premio Fijo: 3 Monedas) ---
    {
        id: 'm_g_1',
        title: 'Experto Contrarreloj',
        desc: 'Logra 20 aciertos totales en el Desafío.',
        type: 'correct_quiz',
        target: 20,
        rewardAmount: 3,
        rewardType: 'gold',
        icon: '🎯'
    },
    {
        id: 'm_g_2',
        title: 'Maestría Matemática',
        desc: 'Acumula 100 monedas de cobre en una sesión.',
        type: 'earn_copper',
        target: 100,
        rewardAmount: 3,
        rewardType: 'gold',
        icon: '🤖'
    }
];