/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",   // ← added .ts and .tsx (good practice)
  ],
  darkMode: 'class',                    // ← This is the key line for dark mode
  theme: {
    extend: {
    
    },
  },
  plugins: [],
}