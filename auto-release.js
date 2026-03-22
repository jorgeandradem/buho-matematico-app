import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, 'package.json');
const historyJsonPath = path.join(__dirname, 'public', 'update-history.json');

// 1. Leer la versión actual del package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = pkg.version;

// 2. Leer la bitácora actual
let history = [];
if (fs.existsSync(historyJsonPath)) {
  history = JSON.parse(fs.readFileSync(historyJsonPath, 'utf-8'));
}

// 3. Verificar si la versión ya existe en la bitácora
const versionExists = history.some(entry => entry.version === currentVersion);

// Si cambiaste la versión en el package.json y no existe en la bitácora, la crea sola.
if (!versionExists) {
  // Generar la fecha de hoy DD/MM/YYYY
  const today = new Date();
  const date = String(today.getDate()).padStart(2, '0') + '/' + 
               String(today.getMonth() + 1).padStart(2, '0') + '/' + 
               today.getFullYear();

  // Crear la nueva entrada automática
  const newUpdate = {
    updateId: `upd_${Date.now()}`,
    version: currentVersion,
    date: date,
    title: "EVOLUCIÓN DEL NIDO",
    description: "Capitán, hemos aplicado nuevas mejoras y optimizaciones en la plataforma."
  };

  // Insertar al principio de la lista
  history.unshift(newUpdate);

  // Guardar archivo JSON
  fs.writeFileSync(historyJsonPath, JSON.stringify(history, null, 2), 'utf-8');
  
  // Mensaje en terminal solo para avisarte que hizo su magia
  console.log(`\n✨ [BÚHO AUTOMÁTICO] Nueva versión detectada. Bitácora actualizada a la v${currentVersion} silenciosamente.\n`);
}