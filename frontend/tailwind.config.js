/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch AI Design System Tokens
        primary: {
          DEFAULT: '#1f108e',
          container: '#3730a3',
          fixed: '#e2dfff',
          'fixed-dim': '#c3c0ff',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#a9a7ff',
        'on-primary-fixed': '#0f0069',
        'on-primary-fixed-variant': '#3b35a7',
        'inverse-primary': '#c3c0ff',

        secondary: {
          DEFAULT: '#006a63',
          container: '#99efe5',
          fixed: '#9cf2e8',
          'fixed-dim': '#80d5cb',
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#006f67',
        'on-secondary-fixed': '#00201d',
        'on-secondary-fixed-variant': '#00504a',

        tertiary: {
          DEFAULT: '#511c00',
          container: '#752c00',
          fixed: '#ffdbcc',
          'fixed-dim': '#ffb694',
        },
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fe9562',
        'on-tertiary-fixed': '#351000',
        'on-tertiary-fixed-variant': '#7a3003',

        surface: {
          DEFAULT: '#faf8ff',
          dim: '#d2d9f4',
          bright: '#faf8ff',
          variant: '#dae2fd',
          tint: '#544fc0',
          container: '#eaedff',
          'container-low': '#f2f3ff',
          'container-lowest': '#ffffff',
          'container-high': '#e2e7ff',
          'container-highest': '#dae2fd',
        },
        'on-surface': '#131b2e',
        'on-surface-variant': '#464553',
        'inverse-surface': '#283044',
        'inverse-on-surface': '#eef0ff',

        outline: {
          DEFAULT: '#777584',
          variant: '#c8c4d5',
        },

        background: '#faf8ff',
        'on-background': '#131b2e',

        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        // Brand & Theme Helpers
        navy: '#0F172A',
        'indigo-700': '#3730A3',
        'teal-700': '#0F766E',
        page: '#F8FAFC',
        border: '#E2E8F0',
        'on-navy-muted': '#CBD5E1',

        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm': ['16px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'body-sm-medium': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.04em', fontWeight: '600' }],
        'title-md': ['16px', { lineHeight: '24px', fontWeight: '500' }],
      },
      borderRadius: {
        'card': '12px',
        'DEFAULT': '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 0 0 1px rgba(226, 232, 240, 0.8), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'elevation': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
