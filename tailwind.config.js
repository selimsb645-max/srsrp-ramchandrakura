/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bdd3ff',
          300: '#93b4ff',
          400: '#668cff',
          500: '#3f66f5',
          600: '#2b48e0',
          700: '#2338b4',
          800: '#1d2f8f',
          900: '#0f2160',
          950: '#091540'
        },
        leaf: {
          50: '#ecfdf3',
          100: '#d1fae0',
          200: '#a7f3c6',
          300: '#6ee79f',
          400: '#34d178',
          500: '#12a85c',
          600: '#0b8549',
          700: '#0a6a3c',
          800: '#0b5432'
        },
        ink: '#0b1220'
      },
      fontFamily: {
        bn: ['"Hind Siliguri"', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
        display: ['"Baloo Da 2"', '"Hind Siliguri"', 'serif'],
        en: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(9,21,64,.04), 0 12px 32px -12px rgba(9,21,64,.18)',
        ring: '0 0 0 1px rgba(9,21,64,.06)'
      },
      borderRadius: { '2xl': '1.15rem', '3xl': '1.65rem' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } }
      },
      animation: { 'fade-up': 'fade-up .5s ease-out both' }
    }
  },
  plugins: []
};
