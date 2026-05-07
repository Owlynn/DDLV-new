import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5b2ab5',
        'primary-light': '#7a6ac7',
        'primary-dark': '#5a4a9f',
        accent: '#cf3594',
        'deep-bg': '#0d0218',
      },
      fontFamily: {
        display: ["'Josefin Sans'", 'sans-serif'],
        sans: ["'Josefin Sans'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
