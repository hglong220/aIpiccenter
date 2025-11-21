import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0fe',
          100: '#d2e1fd',
          200: '#a5c3fb',
          300: '#78a5f9',
          400: '#4b87f7',
          500: '#1A73E8', // Google Blue - Primary
          600: '#155cc0',
          700: '#104598',
          800: '#0b2e70',
          900: '#061748',
        },
        google: {
          blue: '#1A73E8', // Google Blue
          red: '#EA4335',
          yellow: '#FBBC04',
          green: '#34A853',
        },
      },
      maxWidth: {
        'container': '1440px',
      },
      spacing: {
        'section': '120px',
        'module': '48px',
      },
      fontSize: {
        'h1': ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'body': ['18px', { lineHeight: '1.6' }],
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config

