/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
    './providers/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0F',
        elevated: '#16161A',
        card: '#1C1C22',
        gold: '#C9A962',
        coral: '#E07A5F',
        sage: '#81B29A',
        primary: '#F5F5F0',
        secondary: '#A0A0A8',
        muted: '#6B6B73',
        glass: 'rgba(255,255,255,0.06)',
      },
      borderRadius: {
        '2xl': '24px',
        '3xl': '32px',
      },
      fontFamily: {
        sans: ['Inter'],
        display: ['CormorantGaramond'],
      },
    },
  },
  plugins: [],
};
