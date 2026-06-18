/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#2f6bff",
          600: "#1f55e0",
          700: "#1a47bd",
        },
      },
    },
  },
  plugins: [],
};
