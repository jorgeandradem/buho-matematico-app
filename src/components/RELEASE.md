# 🦉 Búho Matemático - Release Notes
## [v2.10.4] - 2026-03-28

### 🚀 Resumen de la Misión
Esta versión se enfoca en la **optimización táctica** para dispositivos móviles y la implementación del **Motor de Voz Unificado v2.0**, mejorando la accesibilidad y la fluidez mecánica de los juegos principales.

---

### 🛠️ Cambios Quirúrgicos por Componente

#### 🔐 Cerrojo Mágico (`MathLockModal.vue`)
- **UI Refinada:** Se aumentó la altura del panel de instrucciones para evitar el amontonamiento de elementos.
- **Jerarquía Visual:** Las filas de texto se desplazaron hacia abajo, liberando espacio para el título y el nuevo control de audio.
- **Voz Unificada:** Implementación de la función `speak` con 4 estados anímicos (Intro, Gold, Silver, Copper).
- **Accesibilidad:** Botón de repetición de reglas (🔊) ubicado estratégicamente en la esquina superior derecha del manual.

#### 🕰️ El Relojero (`TimeWatchmaker.vue`)
- **Estética 3D:** Reemplazo del icono de portada por un reloj de bolsillo diseñado puramente en **CSS 2D** con profundidad simulada.
- **UX Móvil Extrema:** Eliminación de la cúpula de cristal y el magnetismo para permitir un giro de manecillas 100% fluido y sin interferencias táctiles.
- **Z-Index Fix:** Prioridad total a las agujas sobre cualquier capa visual para evitar bloqueos en pantallas táctiles.

#### 🏗️ Arquitecto Pro & La Bóveda
- **Motor de Voz Pro:** Implementación del sistema `speak` optimizado para trabajar tanto Online como Offline.
- **Silencio Táctico:** Eliminación de narraciones durante el juego para dar protagonismo a los efectos de sonido (.mp3) mecánicos y de acierto.
- **Limpieza de Memoria:** Garantía de cancelación de procesos de voz al cerrar los módulos (`onUnmounted`).

---

### 🔧 Nota Técnica de Despliegue
Para usuarios de Windows PowerShell que encuentren errores con el token `&&`, ejecutar el etiquetado de la siguiente forma:
1. `git tag v2.10.4`
2. `git push origin v2.10.4`

**"¡El conocimiento vuela alto!"** 🦉✨