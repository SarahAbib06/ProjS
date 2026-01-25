/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // active le dark mode via la classe 'dark'
  content: [
    "./index.html",      // ton point d'entrée HTML
    "./src/**/*.{js,jsx}" // tous tes fichiers React
  ],
  theme: {
    extend: {}, // tu peux ajouter ici tes couleurs, polices, spacing personnalisés
  },
  plugins: [],
};

