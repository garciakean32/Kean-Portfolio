@AGENTS.md

# Project

Next.js 16 + React 19 portfolio. TypeScript, Tailwind v4, shadcn/Base UI, framer-motion + GSAP, Resend for email.

Commands:
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — eslint

Do not start a dev server to "verify" a change unless asked; prefer `npm run build` or nothing.

# General Behavior

- Keep responses concise and action-oriented.
- Do not restate the request or explain obvious changes.
- Avoid long summaries after completing tasks.
- Ask the minimum number of clarification questions; assume sensible defaults.
- Prefer bullet points over paragraphs.
- Skip planning for small tasks.
- Read only files relevant to the task; never re-read files already in context.
- Do not paste large code blocks into replies — edit files instead.
- Make the smallest change that satisfies the request.
- Reuse existing patterns; do not introduce new abstractions or dependencies unprompted.
- Do not modify unrelated files.

# Coding

- Follow existing project style and file layout.
- Prefer incremental edits over rewrites.
- Avoid premature optimization.
- Keep functions focused and simple.
- Remove dead code when encountered.
- Keep imports clean; use the `@/` alias as the codebase does.
- Server Components by default; add `"use client"` only when the component needs state, effects, or browser APIs.
- Style with Tailwind classes and the existing `cn()` helper — no inline style objects or new CSS files unless required.
- Reuse components in `components/ui` before creating new ones.
- Never commit secrets; read config from environment variables.

# Git

Always use Conventional Commits.

Examples:
- `feat: add user profile endpoint`
- `fix: prevent duplicate form submission`
- `chore: update dependencies`
- `docs: improve installation guide`
- `refactor: simplify auth middleware`
- `test: add unit tests for parser`
- `perf: optimize database query`
- `ci: update github actions workflow`
- `build: configure production bundling`
- `style: format source files`

Never use vague messages like `update`, `changes`, `fix stuff`, `misc`.

Rules:
- lowercase
- imperative mood
- under 72 characters
- one logical change per commit
- commit or push only when asked

# Output

- No long explanations.
- On completion: 1–3 bullets max.
- If nothing needed changing, say so in one line.
- Reference files as clickable paths (e.g. `app/page.tsx:42`) instead of quoting them.
