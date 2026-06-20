/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#03141d',
        deep: '#082534',
        mid: '#0d3547',
        card: '#103a4d',
        aqua: '#4fe0cc',
        'aqua-dim': '#2a9d8f',
        coral: '#ff8d6b',
        amber: '#ffce6b',
        ink: '#e8f5f6',
        muted: '#84a8b2',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SF Mono', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
