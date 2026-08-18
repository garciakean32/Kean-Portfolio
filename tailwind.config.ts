import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
                serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
                mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
                // Only the handful of Japanese words use this
                jp: ['var(--font-noto-jp)', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'sans-serif'],
            },
            colors: {
                paper: {
                    DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
                    2: 'rgb(var(--paper-2) / <alpha-value>)',
                    3: 'rgb(var(--paper-3) / <alpha-value>)',
                },
                ink: {
                    DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
                    2: 'rgb(var(--ink-2) / <alpha-value>)',
                    3: 'rgb(var(--ink-3) / <alpha-value>)',
                },
                rule: {
                    DEFAULT: 'rgb(var(--rule) / <alpha-value>)',
                    strong: 'rgb(var(--rule-strong) / <alpha-value>)',
                },
                accent: 'rgb(var(--accent) / <alpha-value>)',
                'on-ink': 'rgb(var(--on-ink) / <alpha-value>)',
            },
            fontSize: {
                // Utility / metadata
                label: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.14em' }],
                meta: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.08em' }],
                // Body
                body: ['clamp(0.9375rem, 0.9rem + 0.2vw, 1.0625rem)', { lineHeight: '1.75' }],
                lead: ['clamp(1.0625rem, 1rem + 0.45vw, 1.375rem)', { lineHeight: '1.65' }],
                // Display
                d1: ['clamp(1.5rem, 1.25rem + 1.1vw, 2.25rem)', { lineHeight: '1.25' }],
                d2: ['clamp(2rem, 1.5rem + 2.2vw, 3.5rem)', { lineHeight: '1.08' }],
                d3: ['clamp(2.75rem, 1.9rem + 3.8vw, 5.5rem)', { lineHeight: '0.98' }],
                d4: ['clamp(2.6rem, 1.4rem + 5.6vw, 7rem)', { lineHeight: '0.94' }],
                d5: ['clamp(3.5rem, 0.5rem + 12vw, 13rem)', { lineHeight: '0.84' }],
            },
            maxWidth: {
                measure: '38rem',
                shell: '96rem',
            },
            transitionTimingFunction: {
                out: 'cubic-bezier(0.16, 1, 0.3, 1)',
                io: 'cubic-bezier(0.76, 0, 0.24, 1)',
            },
            borderRadius: {
                none: '0',
                sm: '3px',
                DEFAULT: '5px',
                md: '6px',
                lg: '10px',
                xl: '14px',
                full: '9999px',
            },
        },
    },
    plugins: [],
}

export default config
