// src/data/missions.js

export const missionsData = [
    {
        id: 'm_quiz_play_2',
        title: 'Juega 2 partidas del Desafío Contrarreloj',
        desc: 'Demuestra tu velocidad en el nuevo modo.',
        type: 'play_quiz', // El código que usará el Banco para rastrearlo
        target: 2,         // Cuántas veces debe hacerlo
        rewardAmount: 5,   // Cantidad de recompensa
        rewardType: 'silver', // Tipo de moneda (copper, silver, gold)
        icon: '⚡'
    },
    {
        id: 'm_quiz_correct_15',
        title: 'Logra 15 aciertos en el Desafío',
        desc: 'Suma puntos de respuestas correctas bajo presión.',
        type: 'correct_quiz',
        target: 15,
        rewardAmount: 1,
        rewardType: 'gold',
        icon: '🎯'
    },
    {
        id: 'm_earn_copper_50',
        title: 'Recolecta 50 monedas de Cobre',
        desc: 'Estudia en cualquier modo hasta llenar tus bolsillos.',
        type: 'earn_copper',
        target: 50,
        rewardAmount: 3,
        rewardType: 'silver',
        icon: '🥉'
    },
    {
        id: 'm_earn_silver_10',
        title: 'Consigue 10 monedas de Plata',
        desc: 'Esfuérzate y ahorra para conseguir plata.',
        type: 'earn_silver',
        target: 10,
        rewardAmount: 1,
        rewardType: 'gold',
        icon: '🥈'
    },
    {
        id: 'm_quiz_play_5',
        title: 'Sobrevive a 5 Desafíos Contrarreloj',
        desc: '¡Solo para campeones de la agilidad mental!',
        type: 'play_quiz',
        target: 5,
        rewardAmount: 2,
        rewardType: 'gold',
        icon: '🌪️'
    },
    {
        id: 'm_buy_shop',
        title: 'Date un gusto en la Tienda',
        desc: 'Compra al menos 1 premio con tus ahorros.',
        type: 'buy_shop',
        target: 1,
        rewardAmount: 30,
        rewardType: 'copper',
        icon: '🛍️'
    },
    {
        id: 'm_quiz_correct_30',
        title: 'Máquina de calcular: 30 aciertos rápidos',
        desc: 'Acumula 30 aciertos totales en el Contrarreloj.',
        type: 'correct_quiz',
        target: 30,
        rewardAmount: 2,
        rewardType: 'gold',
        icon: '🤖'
    },
    {
        id: 'm_earn_copper_100',
        title: 'Fiebre del Cobre: Gana 100 monedas',
        desc: 'Juega mucho hoy y conviértete en millonario.',
        type: 'earn_copper',
        target: 100,
        rewardAmount: 5,
        rewardType: 'silver',
        icon: '💰'
    }
];