/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Worklytics color palette
        'workly': {
          'sidebar': '#4A7378',
          'sidebar-hover': '#3E6166',
          'teal': '#5B8A8F',
          'teal-light': '#7FA5A8',
          'coral': '#FF9B8A',
          'blue-light': '#A8D5E2',
          'green': '#7BC9A6',
          'yellow': '#FFD88A',
          'red': '#FF8A8A',
          'purple-light': '#E9D5FF',
          'coral-light': '#FFE5E0',
          'blue-bg': '#D5E9FF',
          'green-bg': '#D5FFE9',
        },
        'workly-text': {
          'primary': '#2D3748',
          'secondary': '#718096',
          'muted': '#A0AEC0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-workly': 'linear-gradient(135deg, #5B8A8F 0%, #7FA5A8 100%)',
        'gradient-coral': 'linear-gradient(135deg, #FF9B8A 0%, #FF8A8A 100%)',
      },
      boxShadow: {
        'workly': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'workly-hover': '0 8px 20px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'workly': '20px',
      }
    },
  },
  plugins: [],
}
