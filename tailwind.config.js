/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Instrument Serif'", "Georgia", "serif"],
        sans: ["'Manrope'", "system-ui", "sans-serif"]
      },
      colors: {
        cream: "#faf8f3",
        ink: "#1a1a1a",
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#022c1e"
        }
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06)",
        lift: "0 10px 30px -10px rgba(2,44,30,.25)"
      }
    }
  },
  plugins: []
};
