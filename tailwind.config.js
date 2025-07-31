/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      maxWidth: {
        'container': '960px',
      },
      screens: {
        'sm': '320px',
        'md': '600px',
        'lg': '920px',
        'xl': '1200px',
      },
    },
  },
  plugins: [],
}