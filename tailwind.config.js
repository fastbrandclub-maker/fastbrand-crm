/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E8000D',
          dark: '#0A0A0A',
          surface: '#111111',
          card: '#161616',
          border: '#222222',
        },
      },
    },
  },
  plugins: [],
}
