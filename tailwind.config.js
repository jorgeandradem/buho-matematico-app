/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 🦉 Definimos Inter como la fuente sans-serif por defecto
        // 'Inter' usa tus archivos 18pt y 'Inter Variable' es el respaldo avanzado
        sans: ['Inter', 'Inter Variable', 'sans-serif'],
      },
    },
  },
  plugins: [],
}