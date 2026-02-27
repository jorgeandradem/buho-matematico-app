/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {}, // ✅ Se eliminó la línea de 'moderna'
  },
  plugins: [],
}