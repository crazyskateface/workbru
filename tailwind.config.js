/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: '#7B29D6',
          50: '#F4EBFC',
          100: '#E9D7F9',
          200: '#D3AFF3',
          300: '#BD87ED',
          400: '#A75FE7',
          500: '#7B29D6', // Main brand purple
          600: '#6321AB',
          700: '#4A1880',
          800: '#321056',
          900: '#1D0B2B',
          950: '#150329', // Dark background
        },
        // Secondary brand colors
        secondary: {
          DEFAULT: '#1D2195',
          50: '#E6E7F4',
          100: '#CDCFE9',
          200: '#9B9FD3',
          300: '#696FBD',
          400: '#373FA7',
          500: '#1D2195',
          600: '#171A77',
          700: '#111459',
          800: '#0B0D3B',
          900: '#05061D',
        },
        // Accent colors
        accent: {
          green: {
            DEFAULT: '#81DFAE',
            50: '#F3FBF7',
            100: '#E7F7EF',
            200: '#CFEFDF',
            300: '#B7E7CF',
            400: '#9FE3BF',
            500: '#81DFAE',
            600: '#67B28B',
            700: '#4D8668',
            800: '#335945',
            900: '#1A2D23',
          },
          lime: {
            DEFAULT: '#A3D66B',
            50: '#F6FAF0',
            100: '#EDF5E1',
            200: '#DBEBC3',
            300: '#C9E1A5',
            400: '#B7D787',
            500: '#A3D66B',
            600: '#82AB56',
            700: '#628040',
            800: '#41552B',
            900: '#212B15',
          },
          pink: {
            DEFAULT: '#D05D9A',
            50: '#FAF0F5',
            100: '#F5E1EB',
            200: '#EBC3D7',
            300: '#E1A5C3',
            400: '#D787AF',
            500: '#D05D9A',
            600: '#A64A7B',
            700: '#7D385C',
            800: '#53253E',
            900: '#2A131F',
          }
        },
        // Dark mode colors
        dark: {
          bg: '#150329', // Primary dark background
          card: '#200B38', // Card/surface background
          input: '#3D156B', // Input background
          border: '#363F59', // Border color
          text: '#ffffff', // Text color
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};