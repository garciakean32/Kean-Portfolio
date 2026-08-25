import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        /* `lib/data.ts` carries class names too — the aspect ratio a
           photograph is cropped to travels with the photograph. Leave this out
           and those figures generate no `aspect-ratio` rule at all, which
           collapses them to nothing rather than failing loudly. */
        './lib/**/*.{js,ts}',
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
                warn: 'rgb(var(--warn) / <alpha-value>)',
                'on-ink': 'rgb(var(--on-ink) / <alpha-value>)',
            },
            fontSize: {
                /* One hierarchy, and the hero sits above all of it. The hero's
                   wordmark sets its own size off the viewport (see Hero.tsx) —
                   everything in this scale is deliberately a step below it, and
                   ceilinged so a 1280x720 laptop gets a whole section on screen
                   rather than one heading. */
                // Utility / metadata
                label: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.1em' }],
                meta: ['0.75rem', { lineHeight: '1.6', letterSpacing: '0.07em' }],
                // Body
                body: ['clamp(0.9375rem, 0.9rem + 0.22vw, 1.0625rem)', { lineHeight: '1.7' }],
                lead: ['clamp(1.0625rem, 1rem + 0.4vw, 1.3125rem)', { lineHeight: '1.55' }],
                // Display
                d1: ['clamp(1.375rem, 1.15rem + 0.9vw, 1.875rem)', { lineHeight: '1.25' }],
                d2: ['clamp(1.875rem, 1.5rem + 1.5vw, 2.75rem)', { lineHeight: '1.1' }],
                d3: ['clamp(2.25rem, 1.75rem + 2.1vw, 3.5rem)', { lineHeight: '1.02' }],
                /* Poster headings — the two places the page sets a name or a
                   title at full volume. Still a long way under the hero. */
                d4: ['clamp(2.5rem, 1.7rem + 3.5vw, 4.5rem)', { lineHeight: '0.94' }],
            },
            maxWidth: {
                measure: '38rem',
                /* Narrower than it was. The page is read on laptops far more
                   than on 27-inch displays, and a 96rem column made every row
                   a head-turn on the machines that actually open it. */
                shell: '82rem',
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
