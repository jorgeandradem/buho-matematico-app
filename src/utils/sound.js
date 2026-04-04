// src/utils/sound.js

// ----------------------------------------------------
// A. SINGLETON PARA AUDIO SINTETIZADO (Osciladores)
// ----------------------------------------------------
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
// B. EL REPRODUCTOR MAESTRO (Caché de MP3 - Evita colapsos)
// ----------------------------------------------------
const audioPool = {};

const playCachedAudio = (path, vol = 1.0) => {
    try {
        // Si el audio no existe en la memoria, lo creamos una sola vez
        if (!audioPool[path]) {
            audioPool[path] = new Audio(path);
        }
        
        const sound = audioPool[path];
        
        // Rebobinamos y disparamos sin crear nuevas instancias en el DOM
        sound.pause(); 
        sound.currentTime = 0; 
        sound.volume = vol;
        
        sound.play().catch(error => {
            console.warn(`Autoplay bloqueado para ${path}:`, error);
        });
    } catch (err) {
        console.error(`Error en el reproductor maestro con ${path}:`, err);
    }
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

        // Volumen AJUSTADO: sutil frente a la voz
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(maxVol, startTime + (duration * 0.1));
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
    };

    // Secuencia "Huuu... Huuuuu" con volumen SUAVE
    createHoot(t, 0.4, 600, 450, 0.2);       
    createHoot(t + 0.5, 0.6, 550, 400, 0.15); 

  } catch (e) {
    console.error("Audio error:", e);
  }
};

// ----------------------------------------------------
// 2. SONIDO DE SALIDA (Sintetizado)
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
// 3. SONIDO DE MONEDAS CAYENDO (Apunta al Reproductor Maestro)
// ----------------------------------------------------
export const playCoinSound = () => {
    // Usamos el pool de memoria con volumen moderado (0.5)
    playCachedAudio('/audios/coins.mp3', 0.5);
};

// ----------------------------------------------------
// 4. DESPACHADOR CENTRAL
// ----------------------------------------------------
export const playSound = (soundName) => {
  switch (soundName) {
    case 'coin':
    case 'coins':
      playCoinSound();
      break;
    case 'owl':
      playOwlHoot();
      break;
    case 'exit':
      playExitSound();
      break;
    default:
      console.warn(`Sonido no encontrado en el despachador: ${soundName}`);
  }
};