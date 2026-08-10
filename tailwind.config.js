/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0B0F19', surface: '#111827', hover: '#1F2937' },
        border: { DEFAULT: '#374151', light: '#4B5563' },
        primary: { DEFAULT: '#3B82F6', light: '#60A5FA', dark: '#2563EB' },
        success: { DEFAULT: '#10B981', light: '#34D399' },
        danger: { DEFAULT: '#EF4444', light: '#F87171' },
        warning: { DEFAULT: '#F59E0B', light: '#FBBF24' },
        accent: { DEFAULT: '#8B5CF6', light: '#A78BFA' },
        text: { DEFAULT: '#F9FAFB', muted: '#9CA3AF', dim: '#6B7280' },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
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
        'glow-primary': '0 0 20px rgba(59,130,246,0.15)',
        'glow-success': '0 0 20px rgba(16,185,129,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      },
    },
  },
  plugins: [],
}