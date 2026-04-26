/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          green: '#1A9968',
          'green-light': '#E8F7F1',
          'green-dark': '#0D5C3F',
          yellow: '#C47B0A',
          'yellow-light': '#FEF3DC',
          'yellow-dark': '#7A4C06',
          red: '#C0312C',
          'red-light': '#FEF0EF',
          'red-dark': '#7A1F1C',
          blue: '#1A56C4',
          'blue-light': '#EEF3FD',
          'blue-dark': '#0F3580',
        },
        ink: {
          DEFAULT: '#0B0D11',
          2: '#3A3D45',
          3: '#6B7280',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          2: '#F5F5F3',
          3: '#EBEBEA',
        },
        line: '#E4E4E2',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
