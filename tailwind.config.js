/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sime: {
          crimson: '#D9222A',
          darkred: '#991118',
          gold: '#C5A059',
          slate: '#1E293B'
        }
      }
    },
  },
  plugins: [],
}
