/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#02968A',
          'teal-hover': '#027C72',
          'teal-light': '#E6F5F4',
          'teal-dark': '#014E48',
          'teal-sidebar': '#013531',
          'teal-sidebar-surface': '#024540',
          ocean: '#023D54',
          'ocean-hover': '#012939',
          'ocean-light': '#EBF2F5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
