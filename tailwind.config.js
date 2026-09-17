/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#313C8E',
          navy: '#313C8E',
          navyDark: '#1E255E',
          sky: '#67CBE2',
          cyan: '#67CBE2',
          cyanDark: '#36A2BB',
          cyanLight: '#A8E6F3',
          ice: '#DAF1F9',
          orange: '#F97316',
          amber: '#F59E0B',
          peach: '#FB923C',
          green: '#10B981',
          danger: '#EF4444',
          bg: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Cairo', 'IBM Plex Sans Arabic', 'sans-serif']
      }
    },
  },
  plugins: [],
}
