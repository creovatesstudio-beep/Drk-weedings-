/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        drk: {
          alabaster: '#F5F5F0',
          ivory: '#FAF8F5',
          cream: '#FAF9F5',
          obsidian: '#0A0807',
          espresso: '#141414',
          charcoal: '#1C1917',
          gold: '#C89B3C',
          champagne: '#E6CFA0',
          border: '#E0DBD1',
          divider: '#E8E3DA',
          muted: '#77726A',
          slate: '#4A463F',
        },
      },
      boxShadow: {
        'argon': '0 4px 20px -2px rgba(20, 20, 20, 0.05), 0 1px 3px 0 rgba(20, 20, 20, 0.03)',
        'argon-lg': '0 12px 32px -4px rgba(20, 20, 20, 0.08), 0 4px 12px -2px rgba(20, 20, 20, 0.04)',
      },
    },
  },
  plugins: [],
};
