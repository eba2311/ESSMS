/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4F8A',
          light: '#3B82F6',
          dark: '#16437A',
        },
        secondary: {
          DEFAULT: '#0F766E',
          light: '#14B8A6',
        },
        success: {
          DEFAULT: '#2D7D3A',
          light: '#22C55E',
        },
        warning: {
          DEFAULT: '#C9920A',
          light: '#F59E0B',
        },
        danger: {
          DEFAULT: '#B5251A',
          light: '#EF4444',
        },
        background: '#F8F9FC',
        surface: '#FFFFFF',
        sidebar: '#0F172A',
        etgreen: '#2D7D3A',
        etred: '#B5251A',
        gold: {
          DEFAULT: '#C9920A',
          light: '#F0B429',
          dark: '#A07208',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 24px -6px rgba(0,0,0,0.08)',
        'glow': '0 0 24px rgba(59,130,246,0.2)',
        'glow-sm': '0 0 12px rgba(59,130,246,0.15)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'sans-serif'],
        amharic: ['Noto Sans Ethiopic', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translate(-12px)', opacity: '0' },
          '100%': { transform: 'translate(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
