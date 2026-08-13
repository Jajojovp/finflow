/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       { DEFAULT: '#050505', surface: '#0D0D10', hover: '#16161A' },
        border:   { DEFAULT: '#26262B', light: '#3A3A41' },
        primary:  { DEFAULT: '#F5C518', light: '#FFDF4D', dark: '#C9A200' },   // dorado
        success:  { DEFAULT: '#22C55E', light: '#4ADE80' },
        danger:   { DEFAULT: '#EF4444', light: '#F87171' },
        warning:  { DEFAULT: '#F59E0B', light: '#FBBF24' },
        accent:   { DEFAULT: '#F5C518', light: '#FFDF4D' },                     // accent = dorado (armonía)
        text:     { DEFAULT: '#FAFAF7', muted: '#A1A1A8', dim: '#8B8B93' },
      },
      fontFamily: {
        display: ['DM Serif Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        elevated: '0 10px 25px rgba(0,0,0,0.4)',
        'glow-primary': '0 0 24px rgba(245, 197, 24, 0.25)',
        'glow-success': '0 0 24px rgba(34, 197, 94, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'char-in': 'charIn 0.4s ease-out both',
        'fade-up': 'fadeUp 0.5s ease-out both',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        charIn: { '0%': { opacity: '0', transform: 'translateX(-18px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
    },
  },
  plugins: [],
}
