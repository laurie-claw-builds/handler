import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#12151A',
        panel: '#1C2028',
        card: '#242B35',
        accent: '#4A9EFF',
        'accent-dim': '#2A5E99',
        border: '#2E3540',
        muted: '#6B7280',
        text: '#E2E8F0',
        'text-dim': '#94A3B8',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      minWidth: {
        '1280': '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
