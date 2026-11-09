/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clinical Design Tokens
        clinical: {
          bg: '#F7FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          primaryText: '#1E293B',
          secondaryText: '#64748B',
          softBlue: '#EFF6FF',
          softTeal: '#F0FDFA',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1769AA', // Primary Medical Blue
          700: '#155B94',
          800: '#124873',
          900: '#16324F', // Deep Navy
          950: '#0F2338',
        },
        medical: {
          blue: '#1769AA',
          navy: '#16324F',
          teal: '#0D9488',
        },
        navy: {
          800: '#16324F',
          900: '#0F2338',
          950: '#0A1726',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488', // Teal Accent
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
      },
      boxShadow: {
        'clinical': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'clinical-md': '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'clinical-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

