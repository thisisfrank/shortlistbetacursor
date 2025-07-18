/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Super Recruiter Brand Colors
        'supernova': '#FFCF00',
        'shadowforce': '#111111',
        'guardian': '#E7E7E7',
        'white-knight': '#FFFFFF',
        // Additional shades for better design flexibility
        'supernova-light': '#FFD633',
        'supernova-dark': '#E6B800',
        'shadowforce-light': '#1A1A1A',
        'guardian-dark': '#D1D1D1',
        'guardian-light': '#F5F5F5'
      },
      fontFamily: {
        'anton': ['Anton', 'sans-serif'],
        'jakarta': ['Plus Jakarta Sans', 'sans-serif']
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'slideUp': 'slideUp 0.4s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'pulse-glow': {
          '0%': { boxShadow: '0 0 20px rgba(255, 207, 0, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 207, 0, 0.6)' }
        }
      }
    },
  },
  plugins: [],
};