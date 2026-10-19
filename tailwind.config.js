/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          dark: '#131921',
          navy: '#232F3E',
          orange: '#FF9900',
          amber: '#FEBD69',
          blue: '#007185'
        }
      }
    },
  },
  plugins: [],
}
