/** @type {import('tailwindcss').Config} */
//
// Tokens du Design System FastBrand CRM.
// Synchronisés avec src/styles/tokens.css — modifier les deux ensemble.
// Référence : DESIGN_SYSTEM.md à la racine.
//
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand (déjà existant, conservé)
        brand: {
          red:     '#E8000D',
          dark:    '#0A0A0A',
          surface: '#111111',
          card:    '#161616',
          border:  '#222222',
        },
        // Aliases sémantiques — utilisables comme bg-primary, text-muted, border-default…
        primary:   '#0A0A0A',
        secondary: '#111111',
        tertiary:  '#161616',
        accent:    '#E8000D',
        // Sémantique
        success: {
          DEFAULT: '#34D399',  // emerald-400
          text:    '#6EE7B7',  // emerald-300
          bg:      '#022C22',  // emerald-950
        },
        warning: {
          DEFAULT: '#FBBF24',  // amber-400
          text:    '#FCD34D',  // amber-300
          bg:      '#451A03',  // amber-950
        },
        danger: {
          DEFAULT: '#E8000D',  // brand-red
          text:    '#FCA5A5',  // red-300
          bg:      '#450A0A',  // red-950
        },
        info: {
          DEFAULT: '#60A5FA',  // blue-400
          text:    '#93C5FD',  // blue-300
          bg:      '#172554',  // blue-950
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Tailles custom (utilisées en arbitrary value : text-[10px], text-[11px])
        '10': ['10px', '14px'],
        '11': ['11px', '16px'],
      },
      borderRadius: {
        // Aliases sémantiques par-dessus l'échelle Tailwind
        'control': '6px',     // rounded-md — boutons, inputs
        'card':    '12px',    // rounded-xl — cards principales, modales
      },
      boxShadow: {
        'modal':  '0 25px 50px -12px rgb(0 0 0 / 0.5)',
        'accent': '0 10px 15px -3px rgb(232 0 13 / 0.20)',
      },
      transitionDuration: {
        'progress': '700ms',
      },
      maxWidth: {
        'portal': '42rem',
      },
      width: {
        'sidebar': '14rem',
      },
    },
  },
  plugins: [],
}
