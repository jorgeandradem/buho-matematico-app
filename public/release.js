import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Configuración de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, 'package.json');
const historyJsonPath = path.join(__dirname, 'public', 'update-history.json');

// 1. Leer la versión actual del package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = pkg.version;

// 2. Configurar la terminal para hacerte preguntas
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`\n🦉 BÚHO MATEMÁTICO - MODO RELEASE v${version} 🦉\n`);

// 3. Preguntar los datos de la actualización
rl.question('📝 Escribe el TÍTULO de la actualización (ej: EVOLUCIÓN DEL NIDO): ', (title) => {
  rl.question('📝 Escribe la DESCRIPCIÓN de los cambios: ', (description) => {
    
    // Generar la fecha de hoy en formato DD/MM/YYYY
    const today = new Date();
    const date = String(today.getDate()).padStart(2, '0') + '/' + 
                 String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                 today.getFullYear();

    // Crear el nuevo bloque mágico
    const newUpdate = {
      updateId: `upd_${Date.now()}`,
      version: version,
      date: date,
      title: title || 'NUEVA ACTUALIZACIÓN',
      description: description || 'Capitán, hemos mejorado el rendimiento del nido.'
    };

    // Leer la bitácora actual
    let history = [];
    if (fs.existsSync(historyJsonPath)) {
      history = JSON.parse(fs.readFileSync(historyJsonPath, 'utf-8'));
    }

    // Seguridad: Evitar duplicar la misma versión
    if (history.length > 0 && history[0].version === version) {
        console.log(`\n⚠️ ¡Cuidado Capitán! La versión ${version} ya está en la bitácora.`);
        console.log(`👉 Primero sube la versión en tu package.json y vuelve a ejecutar el comando.\n`);
        rl.close();
        return;
    }

    // Insertar el nuevo bloque en la posición 1 (arriba del todo)
    history.unshift(newUpdate);

    // Escribir y guardar el archivo update-history.json
    fs.writeFileSync(historyJsonPath, JSON.stringify(history, null, 2), 'utf-8');

    console.log(`\n✅ ¡Misión Cumplida! Bitácora actualizada mágicamente a la v${version}.`);
    console.log(`👉 El Búho ya tiene su punto rojo de notificación listo.\n`);
    
    rl.close();
  });
});