/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Mono"', 'monospace'],
        display: ['"Big Shoulders Stencil Display"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        label: ['"IBM Plex Mono"', 'monospace']
      },
      colors: {
        concrete: {
          950: '#0f0e0d', // Viewport darkest
          900: '#151413', // General background
          850: '#1c1b19', // Slightly elevated background
          800: '#262523', // Panel background
          700: '#33312e', // Elevated button / surface
          600: '#3a3835', // Standard border
          500: '#55514b', // Stronger border / divider
          400: '#736d65', // Subtle text / icon
          300: '#a8a196', // Secondary text
          200: '#d1cbc0', // Muted paper
          100: '#ece6d8'  // Main text "paper"
        },
        paper: '#ece6d8',
        paint: {
          DEFAULT: '#ee5a3c',
          hover: '#f26e53',
          dark: '#151413'
        },
        danger: {
          DEFAULT: '#99261a',
          hover: '#b33629',
          border: '#661911'
        }
      },
      borderRadius: {
        xs: '2px',
        sm: '2px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px'
      },
      boxShadow: {
        brutalist: '3px 3px 0px 0px rgba(0, 0, 0, 0.9)',
        subtle: '2px 2px 0px 0px rgba(0, 0, 0, 0.4)'
      }
    },
  },
  plugins: [],
}
