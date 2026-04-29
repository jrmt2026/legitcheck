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
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-display)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          green:         '#1A9968',
          'green-light': '#E8F7F1',
          'green-dark':  '#0D5C3F',

          yellow:         '#C47B0A',
          'yellow-light': '#FEF3DC',
          'yellow-dark':  '#7A4C06',

          orange:         '#D4650A',
          'orange-light': '#FEF0E4',
          'orange-dark':  '#8B3E06',

          red:         '#C0312C',
          'red-light': '#FEF0EF',
          'red-dark':  '#7A1F1C',

          critical:         '#7D1A1A',
          'critical-light': '#FDE8E8',
          'critical-dark':  '#4A0E0E',

          blue:         '#1A56C4',
          'blue-light': '#EEF3FD',
          'blue-dark':  '#0F3580',

          purple:         '#7C3AED',
          'purple-light': '#EDE9FE',
          'purple-dark':  '#4C1D95',

          gold:         '#B8860B',
          'gold-light': '#FEF9E7',
          'gold-dark':  '#78550A',

          teal:         '#0D9488',
          'teal-light': '#CCFBF1',
          'teal-dark':  '#065F46',
        },
        ink: {
          DEFAULT: '#0D1B2A',   // deep navy/midnight blue
          2: '#2C3A52',         // navy-tinted dark
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
        '4xl': '24px',
      },
      animation: {
        'pulse-slow':   'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'score-fill':   'scoreFill 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shield-pulse': 'shieldPulse 2s ease-in-out infinite',
        'danger-pulse': 'dangerPulse 1.5s ease-in-out infinite',
        'bounce-soft':  'bounceSoft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow':    'spin 3s linear infinite',
        'scan-sweep':   'scanSweep 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' },                                                '100%': { opacity: '1' } },
        slideUp:      { '0%': { transform: 'translateY(12px)', opacity: '0' },                 '100%': { transform: 'translateY(0)', opacity: '1' } },
        scoreFill:    { '0%': { strokeDashoffset: '251' },                                     '100%': { strokeDashoffset: 'var(--score-offset)' } },
        shieldPulse:  { '0%, 100%': { transform: 'scale(1)', opacity: '1' },                  '50%': { transform: 'scale(1.04)', opacity: '0.85' } },
        dangerPulse:  { '0%, 100%': { boxShadow: '0 0 0 0 rgba(192,49,44,0.3)' },             '50%': { boxShadow: '0 0 0 12px rgba(192,49,44,0)' } },
        bounceSoft:   { '0%': { transform: 'scale(0.9)', opacity: '0' }, '60%': { transform: 'scale(1.04)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        scanSweep:    { '0%, 100%': { opacity: '0.3', transform: 'rotate(0deg)' }, '50%': { opacity: '0.7', transform: 'rotate(180deg)' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
