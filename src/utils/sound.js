// src/utils/sound.js

// Singleton para mantener el contexto de audio vivo
let audioCtx = null;

const getAudioContext = () => {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    return audioCtx;
};

// ----------------------------------------------------
// 1. SONIDO DEL BÚHO (Ulular Sintetizado)
// ----------------------------------------------------
export const playOwlHoot = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume().catch(err => console.warn("No se pudo reanudar el audio:", err));
    }

    const t = ctx.currentTime;

    const createHoot = (startTime, duration, startFreq, endFreq, maxVol) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        
        // Frecuencia
        osc.frequency.setValueAtTime(startFreq, startTime); 
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

        // Volumen AJUSTADO: Bajamos a 0.2 para que sea sutil frente a la voz
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(maxVol, startTime + (duration * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
    };

    // Secuencia "Huuu... Huuuuu" con volumen SUAVE (0.2)
    createHoot(t, 0.4, 600, 450, 0.2);       
    createHoot(t + 0.5, 0.6, 550, 400, 0.15); 

  } catch (e) {
    console.error("Audio error:", e);
  }
};

// ----------------------------------------------------
// 2. SONIDO DE SALIDA
// ----------------------------------------------------
export const playExitSound = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.4);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.5);
    } catch (e) {
        console.error("Audio error exit:", e);
    }
};

// ----------------------------------------------------
// 3. NUEVO: SONIDO DE MONEDAS CAYENDO
// ----------------------------------------------------
export const playCoinSound = () => {
  try {
    // Apunta al archivo físico public/audios/coins.mp3
    const audio = new Audio('/audios/coins.mp3');
    
    // Volumen al 50% para que sea agradable y no asuste
    audio.volume = 0.5; 
    
    // Reproducimos capturando posibles bloqueos del navegador
    audio.play().catch(error => {
      console.warn('El navegador bloqueó el sonido de la moneda:', error);
    });
  } catch (error) {
    console.error('Error general al intentar reproducir coins.mp3:', error);
  }
};