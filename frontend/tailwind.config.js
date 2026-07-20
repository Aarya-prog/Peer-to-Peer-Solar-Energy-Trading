/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#f0fdf4',
          DEFAULT: '#22c55e',
          dark: '#16a34a',
          emerald: '#059669',
          lime: '#84cc16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
