"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import PrismDrift, { type PrismDriftHandle } from "@/components/motion/PrismDrift";
import { claimIntro, endIntro, revealChrome } from "@/lib/intro";
import { EASE, gsap, motionEnabled, useGsap } from "@/lib/motion";

/** Hard RGB fringe at a given split, in pixels — the text-side equivalent of
    the portrait's chromatic split, and driven off the same kind of rolled
    intensity rather than a fixed offset. */
const fringe = (px: number) =>
    `${px}px 0 rgba(255,0,80,0.85), ${-px}px 0 rgba(0,229,255,0.85)`;

/** The fixed split the portrait's own reveal hits still use. */
const FRINGE = fringe(3);

/** The portrait's reveal: how many hits, the gap between them, and the hold. */
const HITS = 2;
const HIT_GAP = 0.19;
const HIT_HOLD = 0.09;

/** Seconds between one line's idle tears. Rolled fresh after every one. */
const IDLE_MIN = 6;
const IDLE_MAX = 15;

/**
 * The directions a glitch nudge can throw something, mirroring PrismDrift's
 * own set: left, right, and the four diagonals. Straight up/down is left out
 * there because it reads as a bounce, and the same is true here.
 */
const NUDGE_DIRECTIONS: readonly [number, number][] = [
    [-1, 0],
    [1, 0],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
];
const DIAG = Math.SQRT1_2;

/** What the name reads as mid-glitch — same two halves, different letters. */
const NAME = ["KE", "AN"] as const;
const GLITCHED_NAME = ["KY", "RA"] as const;

/** The layout turns at `lg`, and so does the name: one line above it, two
    stacked halves below, where a single line has no room to grow into. */
const DESKTOP = "(min-width: 1024px)";

/** How long the name takes to stand back down to its resting size — and, with
    it, everything that arrives in the room that makes. */
const RESIZE = 1.25;

/** How long the curtains take to pull clear — long enough to still be moving
    on the portrait's last hit, short enough that they're not lagging behind
    once the frame has settled. */
const CURTAIN_DURATION = HITS * HIT_GAP + HIT_HOLD + 0.3;

export default function Hero() {
    const prism = useRef<PrismDriftHandle>(null);

    const scope = useGsap<HTMLElement>((el) => {
        const q = gsap.utils.selector(el);
        const rand = gsap.utils.random;

        // A fresh landing, or a route back to a page the visitor is already
        // reading? Only the first earns the locked open with the rest of the
        // page covered; the choreography below is the same either way.
        const cinematic = claimIntro();

        const wordmark = q(".js-wordmark")[0] as HTMLElement;
        const parts = q(".js-name-part");
        const portrait = q(".js-portrait");

        /** A nudge in one of the six glitch directions, `min`-`max` px out. */
        const nudge = (min: number, max: number) => {
            const [dx, dy] = NUDGE_DIRECTIONS[Math.floor(Math.random() * NUDGE_DIRECTIONS.length)];
            const distance = rand(min, max);
            const norm = dx !== 0 && dy !== 0 ? DIAG : 1;
            return { x: dx * distance * norm, y: dy * distance * norm };
        };

        // The curtains and the navbar live outside this section — in the root
        // layout, so a sheet of paper and a hidden header are already in
        // place the instant the page paints, before this effect ever runs.
        // Only real when `cinematic`: on a route change it was never hidden,
        // so there's nothing here to pull open. The navbar isn't part of
        // this — it reveals itself in plain CSS once `data-intro` clears,
        // independent of this timeline entirely; see globals.css.
        const curtainTop = cinematic
            ? (document.querySelector('.js-intro-curtain[data-edge="top"]') as HTMLElement | null)
            : null;
        const curtainBottom = cinematic
            ? (document.querySelector('.js-intro-curtain[data-edge="bottom"]') as HTMLElement | null)
            : null;

        // Everything already on screen when the portrait cuts in — it takes
        // the same hits the portrait does.
        const struck = [...q(".js-role"), ...q(".js-tate"), ...q(".js-body"), wordmark];

        /* ---- where the name opens from: as large as the frame allows ---- */

        // Its resting offset is a Tailwind translate and GSAP is about to own
        // `transform` outright, so read the offset off the computed matrix and
        // carry it as GSAP's own `y` rather than lose it.
        const baseY = new DOMMatrix(getComputedStyle(wordmark).transform).f;
        const stacked = !window.matchMedia(DESKTOP).matches;

        const box = wordmark.getBoundingClientRect();
        const frame = el.getBoundingClientRect();
        const partRects = parts.map((part) => part.getBoundingClientRect());
        // Each half's own rendered height, which is also exactly how far
        // apart `partY` (below) pushes the two of them when they stack.
        const line = Math.max(...partRects.map((r) => r.height));
        const [ke, an] = partRects.map((r) => r.width);

        // The section is the whole frame the name opens into — on a fresh
        // load it is also the only thing on screen, everything around it
        // covered by a sheet of the same paper (see globals.css).
        //
        // The two layouts need different logic, not just different numbers.
        // Stacked (mobile/tablet), a half-word is short enough to be bounded
        // by whichever of the two dimensions runs out first. Inline
        // (desktop), the resting size is already a `vw`-driven clamp sized to
        // very nearly fill the section's width — there is almost no width
        // headroom left to open into, so it is bounded by height instead and
        // allowed to crop against the section's own `overflow-hidden`.
        //
        // Both are deliberately short of actually filling the frame: the name
        // wants to open large enough to be the only thing in the room, not so
        // large that it stops reading as a word.
        const nameW = stacked ? Math.max(ke, an) : ke + an;
        const nameH = stacked ? line * 2 : line;
        const open = stacked
            ? gsap.utils.clamp(
                  1,
                  3,
                  Math.min((frame.width * 0.78) / (nameW || 1), (frame.height * 0.72) / nameH)
              )
            : gsap.utils.clamp(1.25, 2.2, (frame.height * 0.62) / nameH);
        // The name's resting place is neither centred nor full-width, so it
        // has to travel as well as grow.
        const dx = frame.left + frame.width / 2 - (box.left + box.width / 2);
        const dy = frame.top + frame.height / 2 - (box.top + box.height / 2);

        // Stacking is done with transforms, never layout: the two halves have
        // to travel back into one line while the name is still shrinking, and
        // a flex-direction swap mid-tween would jump instead of move.
        const partX = (i: number) => (stacked ? (i === 0 ? an / 2 : -ke / 2) : 0);
        const partY = (i: number) => (stacked ? (i === 0 ? -line / 2 : line / 2) : 0);

        /* ---- the reveal ---- */

        // Swaps both halves of the wordmark at once — the only place the
        // name's text content ever changes, now that the swap lives inside
        // the portrait's own reveal hits below rather than on its own
        // recurring clock.
        const setName = (text: readonly string[]) =>
            parts.forEach((part, i) => {
                part.textContent = text[i];
            });

        /* One hit: the portrait teleports, the split blows out, and every
           line already on screen tears with it — the navbar's logo, links,
           resume button and menu icon included, once the bar itself is up.
           No easing anywhere — each of these is on for a frame or two and
           then gone. The name reads as "KYRA" for the same span: set once,
           on the first hit, so it holds through the recovery in between
           rather than flickering back and forth with every strike. */
        const strike = (first: boolean) => {
            prism.current?.burst({ multiplier: rand(5, 9), distance: rand(30, 58) });
            gsap.set(portrait, {
                opacity: 1,
                x: rand(-56, 56),
                y: rand(-28, 28),
                scale: rand(0.96, 1.06),
            });
            gsap.set(struck, {
                x: rand(-22, 22),
                skewX: rand(-10, 10),
                opacity: rand(0.25, 1),
                textShadow: FRINGE,
            });
            if (first) setName(GLITCHED_NAME);
        };

        /* The gap between hits. The portrait all but disappears again for
           every one of them except the last, which is where it stays — and
           where the name reads as itself again, for good. */
        const recover = (last: boolean) => {
            gsap.set(portrait, { opacity: last ? 1 : 0.12, x: 0, y: 0, scale: 1 });
            gsap.set(struck, { x: 0, skewX: 0, opacity: 1, textShadow: "none" });
            if (last) setName(NAME);
        };

        const tl = gsap.timeline({
            // Long enough for the route panel to have finished clearing the
            // page on a fresh load; a beat on a route change, where it is
            // already out of the way.
            delay: cinematic ? 0.7 : 0.25,
            defaults: { ease: EASE.out },
            onComplete: () => {
                gsap.set(wordmark, { willChange: "auto" });
                endIntro();
            },
        });

        // Seeded explicitly rather than left for GSAP to infer from the CSS
        // that's hiding them — the curtains only ever get touched again from
        // inside a `.call()`, and a value GSAP has to parse off computed
        // style the first time one of those fires is a value it can get
        // wrong on the very hit that matters most, the first one.
        if (curtainTop && curtainBottom) {
            tl.set([curtainTop, curtainBottom], { yPercent: 0 }, 0);
        }

        // 1 — the name, alone, as big as the frame will take it. It resolves
        // out of an uneven clip and a blur rather than rising behind a mask,
        // the same "settling into focus" the rest of the site's `morphIn`
        // does. No stagger: both halves are one word arriving at once.
        tl.set(wordmark, {
            x: dx,
            y: baseY + dy,
            scale: open,
            transformOrigin: "50% 50%",
            willChange: "transform",
        })
            .set(parts, { x: partX, y: partY })
            .fromTo(
                parts,
                {
                    clipPath: "polygon(9% 24%, 46% 4%, 93% 15%, 89% 79%, 51% 98%, 5% 84%)",
                    filter: "blur(16px)",
                    opacity: 0,
                },
                {
                    clipPath: "polygon(0% 0%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%)",
                    filter: "blur(0px)",
                    opacity: 1,
                    duration: 1.05,
                    ease: EASE.io,
                    // A settled clip-path still clips to its own polygon, which
                    // would crop the glitch nudges that come later.
                    onComplete: () => gsap.set(parts, { clearProps: "clipPath,filter" }),
                }
            )

            // 2 — it stands down to its resting size and place, and the rest
            // of the frame arrives in the room that makes. Every one of these
            // starts and lands on the same frame as the resize itself, so the
            // whole batch settles as a single move rather than a cascade.
            .to(wordmark, { x: 0, y: baseY, scale: 1, duration: RESIZE, ease: EASE.io }, ">-0.1")
            .to(parts, { x: 0, y: 0, duration: RESIZE, ease: EASE.io }, "<")
            .fromTo(
                q(".js-role"),
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: RESIZE, ease: EASE.io },
                "<"
            )
            .fromTo(
                q(".js-tate"),
                { opacity: 0, y: -14 },
                { opacity: 1, y: 0, duration: RESIZE, ease: EASE.io },
                "<"
            )
            .fromTo(
                q(".js-body"),
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: RESIZE, ease: EASE.io },
                "<"
            );

        // 3 — the portrait does not fade in; it cuts in, twice. The curtains
        // pull clear over the same span rather than on their own timer, so
        // the room they open up is exactly the room the reveal needs — and
        // the navbar lets itself in at this exact instant too, rather than
        // waiting for the whole sequence to finish. See `revealChrome`.
        tl.addLabel("glitch", "+=0.12");
        tl.call(revealChrome, undefined, "glitch");
        if (curtainTop && curtainBottom) {
            tl.to(curtainTop, { yPercent: -100, duration: CURTAIN_DURATION, ease: EASE.out }, "glitch")
                .to(curtainBottom, { yPercent: 100, duration: CURTAIN_DURATION, ease: EASE.out }, "<");
        }
        for (let i = 0; i < HITS; i++) {
            tl.call(strike, [i === 0], `glitch+=${i * HIT_GAP}`).call(
                recover,
                [i === HITS - 1],
                `glitch+=${i * HIT_GAP + HIT_HOLD}`
            );
        }
        tl.call(
            () => {
                gsap.set(portrait, { opacity: 1, clearProps: "transform" });
                gsap.set(struck, { x: 0, skewX: 0, opacity: 1, textShadow: "none" });
            },
            undefined,
            `glitch+=${HITS * HIT_GAP}`
        );

        /* ---- afterwards: each line keeps its own clock ---- */

        /* A tear on a loop, well apart from the last one. Every line rolls its
           own first gap and a fresh one after each tear, so no two of them
           ever settle into step with each other.

           The hit itself is the portrait's, not a separate idea: thrown in
           one of the same six directions, at a distance and a chromatic
           split that are re-rolled every time. Opacity is deliberately left
           alone — text that dims reads as a render bug rather than a glitch,
           where the portrait can carry it because it's an image.

           Built out of `.call()`s rather than `.set()`s so every cycle rolls
           its own numbers; a timeline of sets would bake one set of values in
           at build time and replay them identically forever. */
        const idle = (targets: Element[]) => {
            if (!targets.length) return;

            const hit = () => {
                const throwTo = nudge(3, 11);
                gsap.set(targets, { ...throwTo, textShadow: fringe(rand(2, 6)) });
            };
            const settle = () => gsap.set(targets, { x: 0, y: 0, textShadow: "none" });

            const tear = gsap.timeline({
                repeat: -1,
                delay: rand(IDLE_MIN, IDLE_MAX),
                repeatDelay: rand(IDLE_MIN, IDLE_MAX),
            });

            // Out and back twice, a couple of frames each — a tear rather
            // than a nudge, and over before it can be read as movement.
            tear.call(hit, undefined, 0)
                .call(settle, undefined, 0.07)
                .call(hit, undefined, 0.12)
                .call(settle, undefined, 0.19);

            tear.eventCallback("onRepeat", () => tear.repeatDelay(rand(IDLE_MIN, IDLE_MAX)));
        };

        // The wordmark sits this out — it only ever reads as "KYRA" during
        // the reveal above, never again afterwards, so it gets no idle tear
        // of its own (no nudge, no text change).
        for (const group of ["role", "tate", "jp", "cta"]) {
            idle(q(`[data-glitch="${group}"]`));
        }

        // A quiet drift once the page starts scrolling — the wordmark and the
        // portrait move at different speeds so the frame has some depth.
        gsap
            .timeline({
                scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 },
            })
            .to(q(".js-wordmark"), { yPercent: -12, ease: "none" }, 0)
            .to(q(".js-portrait"), { yPercent: 6, ease: "none" }, 0);
    });

    /* The page must never be left locked — not when motion is off and the
       timeline above never runs, not when the hero is unmounted mid-sequence,
       and not when a backgrounded tab starves the frame loop long enough to
       stall it. Both the curtains and the navbar are safe either way,
       hidden and revealed by the same attribute this clears — neither one
       carries any inline state of its own for a bail to leave behind.

       That teardown has to be told apart from dev's Strict Mode, which mounts
       this same effect, tears it down, and mounts it again — synchronously,
       before anything has actually gone wrong — purely to catch effects that
       aren't safe to run twice. A real unmount doesn't get that immediate
       second mount; deferring the check by a tick and comparing against a
       generation ref is what tells the two apart, since by the time the
       microtask runs, a genuine remount has already bumped it. */
    const introGen = useRef(0);
    useEffect(() => {
        if (!motionEnabled()) {
            endIntro();
            return;
        }
        const myGen = ++introGen.current;
        const guard = window.setTimeout(endIntro, 9000);
        return () => {
            window.clearTimeout(guard);
            queueMicrotask(() => {
                // Deliberately read live, not the value captured at cleanup
                // time — a real remount has to have already bumped it by the
                // time this runs, or the whole check is pointless.
                // eslint-disable-next-line react-hooks/exhaustive-deps
                if (introGen.current !== myGen) return;
                endIntro();
            });
        };
    }, []);

    return (
        <section
            ref={scope}
            // `data-stage`: lifted over the sheet that hides the rest of the
            // page while the open runs — see globals.css.
            data-stage
            className="relative flex min-h-[36rem] flex-col overflow-hidden bg-paper sm:min-h-[40rem] lg:min-h-[46rem]"
        >
            {/* Top row — who and where, and the vertical setting balancing it.
                z-20: stays in front of the portrait, which only needs to sit
                over the name below. */}
            <div className="shell relative z-20 mx-auto flex w-full max-w-shell items-start justify-center pt-[calc(var(--nav-h)+2rem)] lg:justify-between">
                <p
                    data-glitch="role"
                    className="js-role text-center font-mono uppercase tracking-[0.14em] text-[0.5625rem] text-ink-2 sm:text-label"
                >
                    Web Developer
                    <span className="mx-2 text-ink-3">/</span>
                    Based in the Philippines
                </p>

                <span
                    aria-hidden="true"
                    data-glitch="tate"
                    className="js-tate tate hidden font-jp text-sm tracking-[0.4em] text-ink-3 lg:block"
                >
                    ウェブ制作
                </span>
            </div>

            {/* The portrait cut-out, scaled to fit entirely inside the
                section — it shrinks or grows to stay fully in frame, never
                cropped by the section's overflow-hidden. `object-contain`
                centres it, which happens to land the figure roughly over the
                name below.

                z-10: above the name (z-0) it overlaps, below every other row
                (z-20) so only KEAN sits behind it. */}
            <div
                data-anim="fade"
                aria-hidden="true"
                className="js-portrait pointer-events-none absolute inset-0 z-10 drop-shadow-[0_25px_45px_rgba(0,0,0,0.35)]"
            >
                <PrismDrift
                    ref={prism}
                    src="/images/kean hero.png"
                    priority
                    sizes="100vw"
                    className="object-contain"
                />
            </div>

            {/* Centre — the name, the whole point of the frame. z-0: the only
                row the portrait sits in front of. */}
            <div className="relative z-0 flex flex-1 items-center justify-center px-[var(--gutter)] py-8 lg:pl-[calc(var(--rail)+var(--gutter))]">
                <h1
                    aria-label="Kean"
                    // The desktop size is bounded by height as well as width
                    // now, not just clamped between a floor and a ceiling on
                    // width alone — a laptop's shorter, wider viewport was
                    // sizing the word off `vw` regardless of how little
                    // vertical room the section actually had, which is what
                    // let it overflow there even though the same clamp read
                    // fine on a taller screen at the same width. `min()`
                    // picks whichever axis is tighter; the preferred value
                    // and the ceiling both also came down a step, since the
                    // rest size only needs to read as a title, not fill the
                    // section on its own — see the `open` scale in the
                    // timeline above for the part that still does that.
                    className="js-wordmark translate-y-4 select-none font-display font-extrabold leading-[0.82] tracking-[-0.05em] text-white text-[clamp(6.5rem,34vw,9.5rem)] sm:text-[clamp(4.5rem,min(24vw,34vh),20rem)] lg:-translate-y-10"
                >
                    {/* Two halves rather than one word: below `lg` the open
                        stacks them into a block that can fill a narrow screen,
                        and they travel back into a single line as the name
                        settles. Both moves are transforms — see the timeline
                        above — so the layout here is always the resting one,
                        which is also what a visitor with motion off gets.

                        `inline-block` is load-bearing, not cosmetic: transforms
                        do not apply to non-replaced inline elements, and these
                        two are moved, scaled and clipped throughout. */}
                    <span className="flex items-center justify-center">
                        <span data-anim="fade" className="js-name-part inline-block">
                            KE
                        </span>
                        <span data-anim="fade" className="js-name-part inline-block">
                            AN
                        </span>
                    </span>
                </h1>
            </div>

            {/* Bottom row — the pitch and the doors out. z-20: see the top
                row above. */}
            <div className="shell relative z-20 mx-auto flex w-full max-w-shell justify-end pb-10 md:pb-14 lg:justify-between">
                {/* Bottom-left, desktop only — the mobile/tablet layout keeps
                    this text beside the pitch on the right (below). */}
                <div data-glitch="jp" className="js-body hidden text-left lg:block">
                    <p className="font-jp text-xl leading-relaxed text-ink-3">和風</p>
                    <p className="mt-1.5 font-mono text-label uppercase tracking-[0.14em] text-ink">
                        Japan style portfolio
                    </p>
                </div>

                {/* Full-bleed on tablet so 和風 and ウェブ制作 reach the two
                    gutters; back to a narrow right-aligned column on desktop,
                    where the pitch text moves to the block above. */}
                <div className="js-body w-full lg:w-auto lg:max-w-sm lg:text-right">
                    {/* On mobile/tablet, "ウェブ制作" sits beside the pitch
                        text rather than in the top row — bottom-aligned so
                        the two share a baseline, with the vertical run
                        naturally taller than the two short lines beside it,
                        so its top rises above theirs without extra math.
                        `lg:hidden` drops this once the new bottom-left block
                        (above) takes over on desktop. */}
                    <div className="flex items-end justify-between lg:hidden">
                        <div data-glitch="jp">
                            <p className="font-jp text-xl leading-relaxed text-ink-3">
                                和風
                            </p>
                            <p className="mt-1.5 font-mono text-label uppercase tracking-[0.14em] text-ink">
                                Japan style portfolio
                            </p>
                        </div>
                        <span
                            aria-hidden="true"
                            data-glitch="tate"
                            className="tate lg:hidden font-jp text-sm tracking-[0.4em] text-ink-3"
                        >
                            ウェブ制作
                        </span>
                    </div>

                    {/* Blur only — no fill, no border. It keeps the buttons
                        clear of the portrait on small screens without
                        drawing an edge. */}
                    <div
                        data-glitch="cta"
                        className="mt-5 flex flex-col items-stretch gap-4 rounded-xl p-5 backdrop-blur-sm sm:gap-5 sm:p-6 md:flex-row md:items-center md:justify-center lg:justify-end"
                    >
                        <Link
                            href="/projects"
                            className="group inline-flex w-full items-center justify-center gap-2.5 rounded border border-accent bg-accent px-4 py-2.5 font-mono text-label uppercase text-on-ink transition-colors duration-300 hover:bg-transparent hover:text-accent md:w-auto md:justify-start"
                        >
                            See the work
                            <span className="transition-transform duration-300 group-hover:translate-x-1">
                                →
                            </span>
                        </Link>
                        <Link
                            href="/contact"
                            className="link-rule w-full px-4 py-2.5 text-center font-mono text-label uppercase text-ink md:w-auto"
                        >
                            Start a project
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
