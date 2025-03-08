/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      colors: {
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'ripple': 'ripple 1s cubic-bezier(0, 0, 0.2, 1) forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'wave': 'wave 2s ease-in-out infinite',
        'sonar': 'sonarWave 2s ease-out infinite',
        'icon-open': 'iconOpen 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'icon-pulse': 'iconPulse 2s ease-in-out infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(100)', opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.3)) drop-shadow(0 0 4px rgba(59, 130, 246, 0.2))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 16px rgba(59, 130, 246, 0.4))',
          },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        sonarWave: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        iconOpen: {
          '0%': {
            transform: 'scale(1) rotate(0deg)',
            filter: 'brightness(1) drop-shadow(0 0 0 rgba(59, 130, 246, 0))',
          },
          '25%': {
            transform: 'scale(1.3) rotate(90deg)',
            filter: 'brightness(1.4) drop-shadow(0 0 20px rgba(59, 130, 246, 0.7))',
          },
          '50%': {
            transform: 'scale(1.5) rotate(180deg)',
            filter: 'brightness(1.6) drop-shadow(0 0 30px rgba(59, 130, 246, 0.8))',
          },
          '75%': {
            transform: 'scale(1.3) rotate(270deg)',
            filter: 'brightness(1.4) drop-shadow(0 0 20px rgba(59, 130, 246, 0.7))',
          },
          '100%': {
            transform: 'scale(1) rotate(360deg)',
            filter: 'brightness(1) drop-shadow(0 0 0 rgba(59, 130, 246, 0))',
          },
        },
        iconPulse: {
          '0%, 100%': {
            transform: 'scale(1)',
            filter: 'brightness(1) drop-shadow(0 0 0 rgba(59, 130, 246, 0))',
          },
          '50%': {
            transform: 'scale(1.1)',
            filter: 'brightness(1.3) drop-shadow(0 0 15px rgba(59, 130, 246, 0.6))',
          },
        },
      },
    },
  },
  plugins: [],
};