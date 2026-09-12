/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        multiverse: {
          dark: '#030712',
          card: '#0f172a',
          accent: '#06b6d4',
          marvel: '#e23636',
          tva: '#f59e0b',
          raimi: '#dc2626',
          webb: '#2563eb'
        }
      }
    }
  },
  plugins: []
};

