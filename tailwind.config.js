/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0070f3',
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f7',
          500: '#0070f3',
          600: '#0258d0',
          700: '#0246a8',
          800: '#013c8b',
          900: '#013473',
          foreground: '#ffffff'
        },
        secondary: '#1a1a1a',
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#6b7280'
        }
      },
    },
  },
  plugins: [],
}; 