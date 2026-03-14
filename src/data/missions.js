// src/data/missions.js
// 🦉 Configuración v2.9.7 - Sincronización Total (Relojero + Detective + Bóveda)

export const missionsData = [
    // --- 🟠 RETOS DE COBRE (Premio: 15 Monedas) ---
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
        title: 'Explorador del Nido',
        desc: 'Juega 2 partidas de cualquier juego.',
        type: 'play_any_game',
        target: 2,
        rewardAmount: 15,
        rewardType: 'copper',
        icon: '🦉'
    },
    {
        id: 'm_c_3',
        title: 'Entusiasta de la Tienda',
        desc: 'Realiza 1 compra en la tienda de premios.',
        type: 'buy_shop',
        target: 1,
        rewardAmount: 15,
        rewardType: 'copper',
        icon: '🛍️'
    },
    {
        id: 'm_c_4',
        title: 'Detective de Datos',
        desc: 'Resuelve 5 desafíos de conteo en el Detective 3D.',
        type: 'detective_3d_solve',
        target: 5,
        rewardAmount: 15,
        rewardType: 'copper',
        icon: '🧱'
    },

    // --- ⚪ RETOS DE PLATA (Premio: 10 Monedas) ---
    {
        id: 'm_s_1',
        title: 'Velocidad Mental',
        desc: 'Juega 2 partidas del Quiz Time.',
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
    {
        id: 'm_s_3',
        title: 'Buscador Experto',
        desc: 'Encuentra 10 números en la Sopa de Números.',
        type: 'search_numbers',
        target: 10,
        rewardAmount: 10,
        rewardType: 'silver',
        icon: '🔍'
    },
    {
        id: 'm_s_4',
        title: 'Piloto de Tablas',
        desc: 'Acierta 15 operaciones en Tablas Rápidas.',
        type: 'quick_fly_answer',
        target: 15,
        rewardAmount: 10,
        rewardType: 'silver',
        icon: '🚀'
    },
    {
        id: 'm_s_5',
        title: 'Ingeniero del Tiempo',
        desc: 'Logra 10 ajustes de precisión en El Relojero.',
        type: 'watchmaker_correct',
        target: 10,
        rewardAmount: 10,
        rewardType: 'silver',
        icon: '🕰️'
    },

    // --- 🟡 RETOS DE ORO (Premio: 3 Monedas) ---
    {
        id: 'm_g_1',
        title: 'Genio del Quiz',
        desc: 'Logra 20 aciertos totales en el Quiz Time.',
        type: 'quiz_correct_answer',
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
    },
    {
        id: 'm_g_3',
        title: 'Arquitecto de Puzzles',
        desc: 'Desbloquea 10 piezas del Puzzle Mágico.',
        type: 'solve_puzzle_piece',
        target: 10,
        rewardAmount: 3,
        rewardType: 'gold',
        icon: '🧩'
    },
    {
        id: 'm_g_4',
        title: 'Capitán de Ruta',
        desc: 'Abre 10 cofres en la Ruta del Tesoro.',
        type: 'treasure_chest_opened',
        target: 10,
        rewardAmount: 3,
        rewardType: 'gold',
        icon: '🏴‍☠️'
    },
    {
        id: 'm_g_5',
        title: 'Maestro de la Bóveda',
        desc: 'Logra 5 aperturas exitosas en La Bóveda.',
        type: 'vault_solve',
        target: 5,
        rewardAmount: 3,
        rewardType: 'gold',
        icon: '🏦'
    }
];