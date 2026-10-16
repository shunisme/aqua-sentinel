/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2744',
          dark: '#081728',
          hover: '#163A63',
          subtle: '#EFF6FF',
        },
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#0F2744',
        },
        // Alias forest and sage to the blue palette for seamless backwards-compatibility
        forest: {
          DEFAULT: '#0F2744',
          dark: '#081728',
          hover: '#163A63',
          subtle: '#EFF6FF',
        },
        sage: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#3B82F6',
          subtle: '#EFF6FF',
          border: '#BFDBFE',
        },
        surface: {
          page: '#F8FAFC',
          card: '#FFFFFF',
          subtle: '#F1F5F9',
          hover: '#F8FAFC',
        },
        content: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        line: {
          DEFAULT: '#E2E8F0',
          subtle: '#F1F5F9',
          strong: '#CBD5E1',
        },
        status: {
          amber: '#D97706',
          'amber-subtle': '#FFFBEB',
          'amber-border': '#FDE68A',
          red: '#DC2626',
          'red-subtle': '#FEF2F2',
          'red-border': '#FECACA',
          green: '#059669',
          'green-subtle': '#ECFDF5',
          'green-border': '#A7F3D0',
          blue: '#2563EB',
          'blue-subtle': '#EFF6FF',
          'blue-border': '#BFDBFE',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        editorial: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '10px',
      }
    },
  },
  plugins: [],
}
