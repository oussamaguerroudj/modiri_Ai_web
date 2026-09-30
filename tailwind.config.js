/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: 'rgb(var(--color-ink-950) / <alpha-value>)',
          900: 'rgb(var(--color-ink-900) / <alpha-value>)',
          850: 'rgb(var(--color-ink-850) / <alpha-value>)',
          800: 'rgb(var(--color-ink-800) / <alpha-value>)',
          700: 'rgb(var(--color-ink-700) / <alpha-value>)',
          600: 'rgb(var(--color-ink-600) / <alpha-value>)',
        },
        line: 'var(--color-line)',
        brand: {
          blue: '#3b6df0',
          indigo: '#5b5bf6',
          violet: '#8b5cf6',
          teal: '#14b8a6',
          amber: '#f0a83b',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        glow: 'var(--shadow-glow)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#3b6df0 0%,#5b5bf6 50%,#8b5cf6 100%)',
      },
    },
  },
  plugins: [],
};
