/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  // 🛡️ SAFELIST: Blindaje total para que los colores de Memoria Pro no desaparezcan en GitHub
  safelist: [
    // Colores de las cartas (PairColors)
    'bg-pink-50', 'border-pink-200', 'text-pink-700',
    'bg-blue-50', 'border-blue-200', 'text-blue-700',
    'bg-green-50', 'border-green-200', 'text-green-700',
    'bg-amber-50', 'border-amber-200', 'text-amber-700',
    'bg-purple-50', 'border-purple-200', 'text-purple-700',
    'bg-orange-50', 'border-orange-200', 'text-orange-700',
    // Colores de las estrellas (StarColors)
    'text-red-500', 'text-blue-500', 'text-green-500', 
    'text-yellow-500', 'text-purple-500', 'text-pink-500',
    // Estados de error y match
    'border-red-500', 'bg-red-100', 'text-red-700',
    'border-green-500', 'bg-green-100', 'text-green-800'
  ],
  theme: {
    extend: {
      fontFamily: {
        // 🦉 Definimos Inter como la fuente sans-serif por defecto
        sans: ['Inter', 'Inter Variable', 'sans-serif'],
      },
    },
  },
  plugins: [],
}