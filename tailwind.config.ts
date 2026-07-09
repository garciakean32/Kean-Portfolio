import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Outfit', 'sans-serif'],
                body: ['Outfit', 'sans-serif'],
                mono: ['Outfit', 'sans-serif'],
            },
            colors: {
                accent: '#2563EB',
                'accent-dark': '#3B82F6',
            },
            animation: {
                'cursor-blink': 'blink 1s step-end infinite',
            },
            keyframes: {
                blink: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
            },
        },
    },
    plugins: [],
}

export default config