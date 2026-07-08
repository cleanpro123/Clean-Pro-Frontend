/** @type {import('tailwindcss').Config} */
// Design tokens mirror src/shared/theme/colors.js so the existing design is preserved.
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D8FE0',
          dark: '#1B6FC4',
          light: '#7FB8F0',
          soft: '#E5F1FB',
        },
        accent: { DEFAULT: '#06B6D4', soft: '#CFF3FA' },
        background: '#F3F8FF',
        surface: '#E8F1FB',
        card: '#FFFFFF',
        text: {
          DEFAULT: '#0F2A4F',
          secondary: '#3A5B85',
        },
        muted: '#6B89A8',
        border: '#DCEAF7',
        divider: '#EAF2FA',
        success: '#0EA5E9',
        warning: '#3B82F6',
        danger: '#EF4444',
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      borderRadius: {
        sm: 8,
        md: 12,
        lg: 18,
        pill: 999,
      },
    },
  },
  plugins: [],
};
