/**
 * 🦉 BÚHO SCANNER v3.6 - ACUMULADOR HISTÓRICO (EDICIÓN LOCAL)
 * LÓGICA: Mantiene un registro cronológico de los cambios en public/update-history.json
 * SOLO registra si hay cambio de VERSIÓN + RELEVANCIA LÓGICA en el 'Stage' de Git.
 */
import { execSync } from 'child_process';
import fs from 'fs';

const HISTORY_FILE = './public/update-history.json';
const PACKAGE_FILE = './package.json';

// Palabras clave de "Sustancia" (Ignora cambios visuales simples)
const CORE_LOGIC_KEYWORDS = ['async', 'function', 'db', 'auth', 'store', 'v-if', 'emit', 'props', 'watch', 'runTransaction'];

// Mapeo de Módulos a nombres amigables
const MODULE_MAP = { 
  'MechanicalVault': 'Bóveda', 
  'CoverScreen': 'Entrada', 
  'useGamificationStore': 'Economía', 
  'firebase': 'Seguridad',
  'Architect': 'Geometría',
  'Market': 'Mercado'
};

try {
  // 1. Cargar Versión Actual y el Historial Existente
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
  const currentVersion = pkg.version;

  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }

  // 🛡️ GUARDIÁN DE VERSIÓN: Si la versión actual ya es la última registrada, no hacemos nada.
  if (history.length > 0 && history[0].version === currentVersion) {
    console.log(`🍃 Búho Guardián: La versión ${currentVersion} ya está en la bitácora.`);
    process.exit(0); 
  }

  // 2. Análisis de Relevancia mediante GIT DIFF (Modificado para leer el "Stage")
  const rawDiff = execSync('git diff --cached --unified=0').toString();
  const changesByFile = {};
  const lines = rawDiff.split('\n');
  let currentFile = '';

  lines.forEach(line => {
    if (line.startsWith('+++ b/')) currentFile = line.replace('+++ b/', '');
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const isStyle = /color:|font-|margin|padding|bg-|shadow/.test(line);
      const hasLogic = CORE_LOGIC_KEYWORDS.some(key => line.includes(key));
      
      if (hasLogic && !isStyle) {
        if (!changesByFile[currentFile]) changesByFile[currentFile] = 0;
        changesByFile[currentFile]++;
      }
    }
  });

  let finalModules = [];
  for (const [file, score] of Object.entries(changesByFile)) {
    if (score >= 2) { // Umbral de relevancia
      const moduleName = Object.keys(MODULE_MAP).find(key => file.includes(key));
      if (moduleName) finalModules.push(MODULE_MAP[moduleName]);
    }
  }

  // 3. Generar Nueva Entrada y Actualizar Bitácora
  if (finalModules.length > 0) {
    const newEntry = {
      updateId: `upd_${Date.now()}`,
      version: currentVersion,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      title: "EVOLUCIÓN DEL NIDO",
      description: `Capitán, hemos mejorado: ${[...new Set(finalModules)].join(', ')}.`
    };

    // Añadir al principio (lo más nuevo arriba)
    history.unshift(newEntry);

    // Mantener solo las últimas 10 actualizaciones para optimizar el peso
    const limitedHistory = history.slice(0, 10);

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limitedHistory, null, 2));
    
    // 🚨 PASO CRÍTICO: Agregar el archivo JSON autogenerado al commit actual
    execSync(`git add ${HISTORY_FILE}`);
    
    console.log(`🚀 Búho Scanner: Versión ${currentVersion} añadida a la bitácora histórica y empaquetada para Vercel.`);
  } else {
    console.log('🍃 Búho Scanner: Cambios detectados pero sin relevancia estructural para el alumno.');
  }

} catch (e) {
  console.log('🚀 Scanner: Esperando cambios en el hangar...');
}