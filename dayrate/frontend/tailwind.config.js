/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: '#0d0d1a',
        card: '#13132a',
        border: '#1e1e40',
      },
      maxWidth: {
        app: '430px',
      },
    },
  },
  plugins: [],
}
