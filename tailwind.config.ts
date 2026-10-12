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
                display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
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
                   rather than one heading.

                   The display steps are straight lines through two points: a
                   360px phone, and the width each one used to reach its
                   ceiling. So a desktop gets exactly the sizes it always had,
                   and a phone gets a step or so smaller than it did, scaling
                   smoothly through every width in between — 320px included,
                   where the floor takes over. */
                // Utility / metadata
                label: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.1em' }],
                meta: ['0.75rem', { lineHeight: '1.6', letterSpacing: '0.07em' }],
                // Body
                body: ['clamp(0.9375rem, 0.839rem + 0.437vw, 1.0625rem)', { lineHeight: '1.7' }],
                lead: ['clamp(1rem, 0.9175rem + 0.506vw, 1.3125rem)', { lineHeight: '1.55' }],
                /* The paragraph under each section's title. A step under
                   body, so every one of them can say a little more and still
                   come out at about the same length on the page. */
                copy: ['clamp(0.875rem, 0.83rem + 0.2vw, 0.9375rem)', { lineHeight: '1.75' }],
                // Display
                d1: ['clamp(1.25rem, 1.008rem + 1.076vw, 1.875rem)', { lineHeight: '1.25' }],
                d2: ['clamp(1.5rem, 1.0375rem + 2.056vw, 2.75rem)', { lineHeight: '1.1' }],
                d3: ['clamp(1.75rem, 1.1025rem + 2.878vw, 3.5rem)', { lineHeight: '1.02' }],
                /* Poster headings — the two places the page sets a name or a
                   title at full volume. Still a long way under the hero. */
                d4: ['clamp(2rem, 1.022rem + 4.348vw, 4.5rem)', { lineHeight: '0.94' }],
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
